"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  deleteFilm,
  getFilm,
  getIdentityOwnership,
  getUserIdentities,
  setBanner,
  setPortfolioUrl,
  setSeriesSynopsis,
  setTrailers,
  updateArtist,
  updateFilm,
  updateSeriesInfo,
  updateStudio,
  type ArtistInput,
  type FilmInput,
} from "@/db/queries";

// Errors are returned rather than thrown: Next.js hides thrown messages in
// production, and these ones are meant for the creator.
export type CreatorActionResult = { error?: string };

type TrailerInput = { title: string; videoUrl: string };

async function run(action: (userId: string) => Promise<void>): Promise<CreatorActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Non authentifié." };
  try {
    await action(user.id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
  revalidatePath("/mon-espace");
  revalidatePath("/", "layout");
  return {};
}

async function assertOwnsFilm(userId: string, filmId: string) {
  const film = await getFilm(filmId);
  if (!film) throw new Error("Contenu introuvable.");
  const identities = await getUserIdentities(userId);
  if (!identities.some((i) => i.id === film.artistId)) throw new Error("Non autorisé.");
  return film;
}

async function resolveIdentityInput(
  userId: string,
  identityId: string
): Promise<{ artistId: string | null; studioId: string | null }> {
  const identities = await getUserIdentities(userId);
  const identity = identities.find((i) => i.id === identityId);
  if (!identity) throw new Error("Non autorisé.");
  return identity.isStudio ? { artistId: null, studioId: identity.id } : { artistId: identity.id, studioId: null };
}

async function assertOwnsIdentity(userId: string, identityId: string) {
  const identity = await getIdentityOwnership(identityId);
  if (!identity) throw new Error("Profil introuvable.");
  if (identity.isStudio) {
    if (identity.ownerId === userId) return;
    const identities = await getUserIdentities(userId);
    if (identities.some((i) => i.id === identityId)) return;
    throw new Error("Non autorisé.");
  } else if (identity.userId !== userId) {
    throw new Error("Non autorisé.");
  }
}

function readTrailers(formData: FormData): TrailerInput[] | null {
  const raw = formData.get("trailers");
  if (raw === null) return null;
  const parsed: unknown = JSON.parse(String(raw));
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((t): t is TrailerInput => typeof t?.videoUrl === "string")
    .map((t) => ({ title: String(t.title ?? ""), videoUrl: t.videoUrl }));
}

function readFilmInput(formData: FormData, fallbackIdentityId: string): FilmInput {
  const seriesTitle = String(formData.get("seriesTitle") ?? "").trim();
  const seasonNumber = formData.get("seasonNumber");
  const episodeNumber = formData.get("episodeNumber");
  const durationSeconds = String(formData.get("videoDurationSeconds") ?? "").trim();
  return {
    title: String(formData.get("title") ?? ""),
    synopsis: String(formData.get("synopsis") ?? ""),
    year: Number(formData.get("year")),
    durationMinutes: Number(formData.get("durationMinutes")),
    rating: String(formData.get("rating") ?? ""),
    category: String(formData.get("category") ?? ""),
    artistId: String(formData.get("artistId") ?? "") || fallbackIdentityId,
    studioId: null,
    // The "Nouveau" badge is managed by the admin only.
    isNew: false,
    poster: String(formData.get("poster") ?? ""),
    videoUrl: String(formData.get("videoUrl") ?? ""),
    seriesTitle: seriesTitle || null,
    seasonNumber: seriesTitle && seasonNumber ? Number(seasonNumber) : null,
    episodeNumber: seriesTitle && episodeNumber ? Number(episodeNumber) : null,
    episodeKind: formData.get("episodeKind") === "announcement" ? "announcement" : "episode",
    videoDurationSeconds: durationSeconds ? Number(durationSeconds) : null,
  };
}

export async function updateOwnFilmAction(
  identityId: string,
  filmId: string,
  formData: FormData
): Promise<CreatorActionResult> {
  return run(async (userId) => {
    const film = await assertOwnsFilm(userId, filmId);
    const input = readFilmInput(formData, identityId);
    // An announcement only becomes a film through a proposal checked by the
    // team ("Proposer la vidéo"), never by adding the video here.
    if (film.episodeKind === "announcement") {
      if (input.videoUrl) {
        throw new Error("Pour mettre en ligne le contenu d'une annonce, utilise « Proposer la vidéo » : l'équipe le vérifie avant.");
      }
      input.episodeKind = "announcement";
    }
    const { artistId, studioId } = await resolveIdentityInput(userId, input.artistId ?? identityId);
    const trailers = readTrailers(formData);
    if (trailers) await setTrailers({ filmId }, trailers);
    // Keeps the badge as the admin set it.
    await updateFilm(filmId, { ...input, isNew: film.isNew, artistId, studioId });
  });
}

export async function updateOwnSeriesAction(
  identityId: string,
  oldSeriesTitle: string,
  input: { seriesTitle: string; rating: string; category: string; synopsis: string }
): Promise<CreatorActionResult> {
  return run(async (userId) => {
    if (!input.seriesTitle.trim()) throw new Error("Le titre de la série est requis.");
    await assertOwnsIdentity(userId, identityId);
    const { artistId, studioId } = await resolveIdentityInput(userId, identityId);
    // Saved under the current title, then it follows the rename.
    await setSeriesSynopsis(oldSeriesTitle, input.synopsis);
    await updateSeriesInfo(artistId, studioId, oldSeriesTitle, {
      seriesTitle: input.seriesTitle.trim(),
      rating: input.rating,
      category: input.category,
    });
  });
}

export async function deleteOwnFilmAction(filmId: string): Promise<CreatorActionResult> {
  return run(async (userId) => {
    await assertOwnsFilm(userId, filmId);
    await deleteFilm(filmId);
  });
}

export async function updateOwnProfileAction(
  identityId: string,
  input: ArtistInput & { banner: string | null; portfolioUrl: string | null }
): Promise<CreatorActionResult> {
  return run(async (userId) => {
    await assertOwnsIdentity(userId, identityId);
    const ownership = await getIdentityOwnership(identityId);
    const { banner, portfolioUrl, ...profile } = input;
    const kind = ownership?.isStudio ? "studio" : "artist";
    // Banner first: if its migration hasn't run, nothing is half-saved.
    await setBanner(kind, identityId, banner);
    await setPortfolioUrl(kind, identityId, portfolioUrl);
    if (kind === "studio") await updateStudio(identityId, profile);
    else await updateArtist(identityId, profile);
  });
}
