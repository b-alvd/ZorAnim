"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  adminUpdateSeries,
  createFilm,
  deleteFilm,
  deleteSeries,
  launchPremiere,
  setFilmsNew,
  setTrailers,
  stopPremiere,
  updateFilm,
  type FilmInput,
  type TrailerInput,
} from "@/db/queries";

function readDateTimeLocal(formData: FormData, name: string): string | null {
  const raw = String(formData.get(name) ?? "").trim();
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function readFilmInput(formData: FormData): FilmInput {
  const seriesTitle = String(formData.get("seriesTitle") ?? "").trim();
  const seasonNumber = formData.get("seasonNumber");
  const episodeNumber = formData.get("episodeNumber");
  const selectedId = String(formData.get("artistId") ?? "") || null;
  const isStudio = formData.get("isStudio") === "1";
  return {
    title: String(formData.get("title") ?? ""),
    synopsis: String(formData.get("synopsis") ?? ""),
    year: Number(formData.get("year")),
    durationMinutes: Number(formData.get("durationMinutes")),
    rating: String(formData.get("rating") ?? ""),
    category: String(formData.get("category") ?? ""),
    artistId: isStudio ? null : selectedId,
    studioId: isStudio ? selectedId : null,
    isNew: formData.get("isNew") === "on",
    poster: String(formData.get("poster") ?? ""),
    videoUrl: String(formData.get("videoUrl") ?? ""),
    seriesTitle: seriesTitle || null,
    seasonNumber: seriesTitle && seasonNumber ? Number(seasonNumber) : null,
    episodeNumber: seriesTitle && episodeNumber ? Number(episodeNumber) : null,
    episodeKind: formData.get("episodeKind") === "announcement" ? "announcement" : "episode",
    teaserVideoUrl: String(formData.get("teaserVideoUrl") ?? "") || null,
    premiereAt: readDateTimeLocal(formData, "premiereAt"),
    premiereBanner: String(formData.get("premiereBanner") ?? "") || null,
    releaseBanner: String(formData.get("releaseBanner") ?? "") || null,
    premiereAdUrl: String(formData.get("premiereAdUrl") ?? "") || null,
    premiereAdDurationSeconds: (() => {
      const raw = String(formData.get("premiereAdDurationSeconds") ?? "").trim();
      return raw ? Math.round(Number(raw)) : null;
    })(),
    releaseAt: readDateTimeLocal(formData, "releaseAt"),
    videoDurationSeconds: (() => {
      const raw = String(formData.get("videoDurationSeconds") ?? "").trim();
      return raw ? Number(raw) : null;
    })(),
  };
}

// The film form sends its trailer list as JSON in "trailers"; null when the
// form has no such list (series episodes: trailers belong to the series).
function readTrailers(formData: FormData): TrailerInput[] | null {
  const raw = formData.get("trailers");
  if (raw === null) return null;
  const parsed: unknown = JSON.parse(String(raw));
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((t): t is TrailerInput => typeof t?.videoUrl === "string")
    .map((t) => ({ title: String(t.title ?? ""), videoUrl: t.videoUrl }));
}

export async function createFilmAction(formData: FormData) {
  await requireAdmin();
  const id = await createFilm(readFilmInput(formData));
  const trailers = readTrailers(formData);
  if (trailers?.length) await setTrailers({ filmId: id }, trailers);
  revalidatePath("/admin/films");
}

export async function updateFilmAction(id: string, formData: FormData) {
  await requireAdmin();
  const trailers = readTrailers(formData);
  // Trailers first: if that fails (e.g. migration not run yet) the film is
  // left untouched rather than half-saved.
  if (trailers) await setTrailers({ filmId: id }, trailers);
  await updateFilm(id, readFilmInput(formData));
  revalidatePath("/admin/films");
}

export async function deleteFilmAction(id: string) {
  await requireAdmin();
  await deleteFilm(id);
  revalidatePath("/admin/films");
}

export async function setFilmsNewAction(ids: string[], isNew: boolean) {
  await requireAdmin();
  await setFilmsNew(ids, isNew);
  revalidatePath("/admin/films");
  revalidatePath("/", "layout");
}

export async function updateSeriesAction(
  oldSeriesTitle: string,
  input: { seriesTitle: string; rating: string; category: string; trailers: TrailerInput[] }
) {
  await requireAdmin();
  const seriesTitle = input.seriesTitle.trim();
  if (!seriesTitle) throw new Error("Le titre de la série est requis.");
  // Trailers are saved under the current title, then follow the rename.
  await setTrailers({ seriesTitle: oldSeriesTitle }, input.trailers);
  await adminUpdateSeries(oldSeriesTitle, {
    seriesTitle,
    rating: input.rating,
    category: input.category,
  });
  revalidatePath("/admin/films");
  revalidatePath("/", "layout");
}

export async function deleteSeriesAction(seriesTitle: string) {
  await requireAdmin();
  await deleteSeries(seriesTitle);
  revalidatePath("/admin/films");
  revalidatePath("/", "layout");
}

export async function launchPremiereAction(id: string) {
  await requireAdmin();
  await launchPremiere(id);
  revalidatePath("/admin/films");
}

export async function stopPremiereAction(id: string) {
  await requireAdmin();
  await stopPremiere(id);
  revalidatePath("/admin/films");
  revalidatePath("/");
}

export type SeriesEpisodeInput = {
  title: string;
  synopsis: string;
  year: number;
  durationMinutes: number;
  seasonNumber: number;
  episodeNumber: number;
  poster: string;
  videoUrl: string;
  premiereAt?: string | null;
  premiereBanner?: string | null;
  releaseBanner?: string | null;
  premiereAdUrl?: string | null;
  premiereAdDurationSeconds?: number | null;
  releaseAt?: string | null;
  videoDurationSeconds?: number | null;
};

export async function createSeriesAction(input: {
  artistId: string;
  isStudio: boolean;
  seriesTitle: string;
  rating: string;
  category: string;
  isNew: boolean;
  trailers?: TrailerInput[];
  episodes: SeriesEpisodeInput[];
  // Fiche shown in "Bientôt" while the series has no episode yet.
  announcement?: { poster: string; synopsis: string; year: number } | null;
}) {
  await requireAdmin();
  const seriesTitle = input.seriesTitle.trim();
  if (!seriesTitle) throw new Error("Le titre de la série est requis.");
  if (input.episodes.length === 0 && !input.announcement) throw new Error("Ajoute au moins un épisode.");

  if (input.episodes.length === 0 && input.announcement) {
    await createFilm({
      title: seriesTitle,
      synopsis: input.announcement.synopsis,
      year: input.announcement.year,
      durationMinutes: 0,
      rating: input.rating,
      category: input.category,
      artistId: input.isStudio ? null : input.artistId,
      studioId: input.isStudio ? input.artistId : null,
      isNew: input.isNew,
      poster: input.announcement.poster,
      videoUrl: "",
      seriesTitle,
      seasonNumber: null,
      episodeNumber: null,
      episodeKind: "announcement",
    });
  }

  for (const episode of input.episodes) {
    await createFilm({
      title: episode.title,
      synopsis: episode.synopsis,
      year: episode.year,
      durationMinutes: episode.durationMinutes,
      rating: input.rating,
      category: input.category,
      artistId: input.isStudio ? null : input.artistId,
      studioId: input.isStudio ? input.artistId : null,
      isNew: input.isNew,
      poster: episode.poster,
      videoUrl: episode.videoUrl,
      seriesTitle,
      seasonNumber: episode.seasonNumber,
      episodeNumber: episode.episodeNumber,
      episodeKind: "episode",
      premiereAt: episode.premiereAt ?? null,
      premiereBanner: episode.premiereBanner ?? null,
      releaseBanner: episode.releaseBanner ?? null,
      premiereAdUrl: episode.premiereAdUrl ?? null,
      premiereAdDurationSeconds: episode.premiereAdDurationSeconds ?? null,
      releaseAt: episode.releaseAt ?? null,
      videoDurationSeconds: episode.videoDurationSeconds ?? null,
    });
  }
  if (input.trailers?.length) await setTrailers({ seriesTitle }, input.trailers);
  revalidatePath("/admin/films");
}
