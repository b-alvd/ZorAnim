"use server";

import { revalidatePath } from "next/cache";
import { createFilm, deleteFilm, launchPremiere, updateFilm, type FilmInput } from "@/db/queries";

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
    episodeKind: formData.get("episodeKind") === "teaser" ? "teaser" : "episode",
    teaserVideoUrl: String(formData.get("teaserVideoUrl") ?? "") || null,
    premiereAt: readDateTimeLocal(formData, "premiereAt"),
    releaseAt: readDateTimeLocal(formData, "releaseAt"),
    videoDurationSeconds: (() => {
      const raw = String(formData.get("videoDurationSeconds") ?? "").trim();
      return raw ? Number(raw) : null;
    })(),
  };
}

export async function createFilmAction(formData: FormData) {
  await createFilm(readFilmInput(formData));
  revalidatePath("/admin/films");
}

export async function updateFilmAction(id: string, formData: FormData) {
  await updateFilm(id, readFilmInput(formData));
  revalidatePath("/admin/films");
}

export async function deleteFilmAction(id: string) {
  await deleteFilm(id);
  revalidatePath("/admin/films");
}

export async function launchPremiereAction(id: string) {
  await launchPremiere(id);
  revalidatePath("/admin/films");
}

export type SeriesEpisodeInput = {
  title: string;
  synopsis: string;
  year: number;
  durationMinutes: number;
  episodeKind: "episode" | "teaser";
  seasonNumber: number;
  episodeNumber: number;
  poster: string;
  videoUrl: string;
};

export async function createSeriesAction(input: {
  artistId: string;
  isStudio: boolean;
  seriesTitle: string;
  rating: string;
  category: string;
  isNew: boolean;
  episodes: SeriesEpisodeInput[];
}) {
  const seriesTitle = input.seriesTitle.trim();
  if (!seriesTitle) throw new Error("Le titre de la série est requis.");
  if (input.episodes.length === 0) throw new Error("Ajoute au moins un épisode.");

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
      seasonNumber: episode.episodeKind === "teaser" ? null : episode.seasonNumber,
      episodeNumber: episode.episodeNumber,
      episodeKind: episode.episodeKind,
    });
  }
  revalidatePath("/admin/films");
}
