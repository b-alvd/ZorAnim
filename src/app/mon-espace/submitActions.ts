"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  createFilmSubmission,
  deleteFilmSubmission,
  getFilm,
  getUserIdentities,
  setReleaseRequest,
  type FilmSubmissionInput,
} from "@/db/queries";
import {
  parseReleaseRequest,
  validateReleaseRequest,
  type ReleaseRequest,
  type ReleaseTrailer,
} from "@/lib/release-request";

// Errors are returned rather than thrown: Next.js hides thrown messages in
// production, and these ones are meant for the creator.
export type SubmitResult = { error?: string };

type Common = { title: string; synopsis: string; year: number; durationMinutes: number; poster: string; videoUrl: string };

export type FilmProposal = Common & {
  identityId: string;
  rating: string;
  category: string;
  release: ReleaseRequest;
  // The creator's announcement fiche this film comes to fill.
  replacesAnnouncementId?: string | null;
};

export type EpisodeProposal = Common & { seasonNumber: number; episodeNumber: number; release: ReleaseRequest };

// A series announced before any episode: its fiche and trailers only.
export type SeriesAnnouncement = { synopsis: string; year: number; poster: string; trailers: ReleaseTrailer[] };

export type SeriesProposal = {
  identityId: string;
  seriesTitle: string;
  rating: string;
  category: string;
  note: string;
  episodes: EpisodeProposal[];
  announcement?: SeriesAnnouncement | null;
};

// `announcement`: no video yet, so neither the video nor the length is required.
function checkCommon(c: Common, label: string, announcement = false): string | null {
  if (!c.title.trim()) return `${label} : le titre est requis.`;
  if (!c.synopsis.trim()) return `${label} : le synopsis est requis.`;
  if (!(c.year > 1900)) return `${label} : l'année est invalide.`;
  if (!c.poster) return `${label} : ajoute une affiche.`;
  if (announcement) return null;
  if (!(c.durationMinutes > 0)) return `${label} : la durée est requise.`;
  if (!c.videoUrl) return `${label} : ajoute la vidéo.`;
  return null;
}

async function resolveIdentity(identityId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Tu dois être connecté pour proposer un contenu." } as const;
  const identity = (await getUserIdentities(user.id)).find((a) => a.id === identityId);
  if (!identity) return { error: "Tu dois être artiste ou membre de ce studio pour proposer un contenu." } as const;
  return { user, identity } as const;
}

// Creates the submissions with their requested release; if any step fails,
// the ones already created are removed so nothing is left half-sent.
async function createAll(entries: { input: FilmSubmissionInput; release: ReleaseRequest }[]): Promise<SubmitResult> {
  const created: string[] = [];
  try {
    for (const { input, release } of entries) {
      const id = await createFilmSubmission(input);
      created.push(id);
      await setReleaseRequest(id, release);
    }
  } catch (e) {
    await Promise.all(created.map((id) => deleteFilmSubmission(id)));
    return { error: e instanceof Error ? e.message : "Envoi impossible." };
  }
  revalidatePath("/mon-espace");
  revalidatePath("/profil");
  revalidatePath("/admin", "layout");
  return {};
}

export async function proposeFilmAction(proposal: FilmProposal): Promise<SubmitResult> {
  const who = await resolveIdentity(proposal.identityId);
  if ("error" in who) return { error: who.error };
  const release = parseReleaseRequest({ ...proposal.release, replacesId: proposal.replacesAnnouncementId ?? null });
  const announcement = release.mode === "announcement";
  if (release.replacesId) {
    const fiche = await getFilm(release.replacesId);
    if (!fiche || fiche.episodeKind !== "announcement" || fiche.seriesTitle || fiche.artistId !== who.identity.id) {
      return { error: "Cette annonce est introuvable ou ne t'appartient pas." };
    }
    if (announcement) return { error: "Choisis comment le film doit sortir (il ne peut pas rester une annonce)." };
  }
  const problem = checkCommon(proposal, "Film", announcement);
  if (problem) return { error: problem };
  const releaseProblem = validateReleaseRequest(release, Date.now());
  if (releaseProblem) return { error: releaseProblem };

  return createAll([
    {
      input: {
        userId: who.user.id,
        artistId: who.identity.isStudio ? null : who.identity.id,
        studioId: who.identity.isStudio ? who.identity.id : null,
        artistName: who.identity.name,
        contactEmail: who.user.email,
        title: proposal.title.trim(),
        synopsis: proposal.synopsis.trim(),
        year: proposal.year,
        durationMinutes: announcement ? proposal.durationMinutes || 0 : proposal.durationMinutes,
        rating: proposal.rating,
        category: proposal.category,
        poster: proposal.poster,
        videoUrl: announcement ? "" : proposal.videoUrl,
        seriesTitle: null,
        seasonNumber: null,
        episodeNumber: null,
        episodeKind: announcement ? "announcement" : "episode",
      },
      release,
    },
  ]);
}

export async function proposeSeriesAction(proposal: SeriesProposal): Promise<SubmitResult> {
  const who = await resolveIdentity(proposal.identityId);
  if ("error" in who) return { error: who.error };
  const seriesTitle = proposal.seriesTitle.trim();
  if (!seriesTitle) return { error: "Le titre de la série est requis." };

  // Announced series: one fiche, no episode yet.
  if (proposal.announcement) {
    const a = proposal.announcement;
    const problem = checkCommon(
      { title: seriesTitle, synopsis: a.synopsis, year: a.year, durationMinutes: 0, poster: a.poster, videoUrl: "" },
      "Annonce",
      true
    );
    if (problem) return { error: problem };
    return createAll([
      {
        input: {
          userId: who.user.id,
          artistId: who.identity.isStudio ? null : who.identity.id,
          studioId: who.identity.isStudio ? who.identity.id : null,
          artistName: who.identity.name,
          contactEmail: who.user.email,
          title: seriesTitle,
          synopsis: a.synopsis.trim(),
          year: a.year,
          durationMinutes: 0,
          rating: proposal.rating,
          category: proposal.category,
          poster: a.poster,
          videoUrl: "",
          seriesTitle,
          seasonNumber: null,
          episodeNumber: null,
          episodeKind: "announcement",
        },
        release: parseReleaseRequest({ mode: "announcement", trailers: a.trailers, note: proposal.note }),
      },
    ]);
  }

  if (proposal.episodes.length === 0) return { error: "Ajoute au moins un épisode." };

  const entries: { input: FilmSubmissionInput; release: ReleaseRequest }[] = [];
  for (const ep of proposal.episodes) {
    const label = `Épisode S${ep.seasonNumber}E${ep.episodeNumber}`;
    const problem = checkCommon(ep, label);
    if (problem) return { error: problem };
    // The series-wide message goes with each episode, so the admin sees it on every request.
    const release = parseReleaseRequest({ ...ep.release, note: proposal.note });
    // An episode always comes with its video; only a whole series is announced.
    if (release.mode === "announcement") return { error: `${label} : un épisode ne peut pas être une annonce.` };
    const releaseProblem = validateReleaseRequest(release, Date.now());
    if (releaseProblem) return { error: `${label} : ${releaseProblem}` };
    entries.push({
      input: {
        userId: who.user.id,
        artistId: who.identity.isStudio ? null : who.identity.id,
        studioId: who.identity.isStudio ? who.identity.id : null,
        artistName: who.identity.name,
        contactEmail: who.user.email,
        title: ep.title.trim(),
        synopsis: ep.synopsis.trim(),
        year: ep.year,
        durationMinutes: ep.durationMinutes,
        rating: proposal.rating,
        category: proposal.category,
        poster: ep.poster,
        videoUrl: ep.videoUrl,
        seriesTitle,
        seasonNumber: ep.seasonNumber,
        episodeNumber: ep.episodeNumber,
        episodeKind: "episode",
      },
      release,
    });
  }
  return createAll(entries);
}
