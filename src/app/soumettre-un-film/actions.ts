"use server";

import { createFilmSubmission, getUserIdentities } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function submitFilmAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Tu dois être connecté pour soumettre un film.");

  const identities = await getUserIdentities(user.id);
  const artistId = String(formData.get("artistId") ?? "");
  const identity = identities.find((a) => a.id === artistId);
  if (!identity) throw new Error("Tu dois être artiste pour soumettre un film.");

  await createFilmSubmission({
    userId: user.id,
    artistId: identity.isStudio ? null : identity.id,
    studioId: identity.isStudio ? identity.id : null,
    artistName: identity.name,
    title: String(formData.get("title") ?? ""),
    synopsis: String(formData.get("synopsis") ?? ""),
    year: Number(formData.get("year")),
    durationMinutes: Number(formData.get("durationMinutes")),
    rating: String(formData.get("rating") ?? ""),
    category: String(formData.get("category") ?? ""),
    contactEmail: String(formData.get("contactEmail") ?? ""),
    poster: String(formData.get("poster") ?? ""),
    videoUrl: String(formData.get("videoUrl") ?? ""),
    seriesTitle: null,
    seasonNumber: null,
    episodeNumber: null,
  });
}

export type EpisodeInput = {
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

export async function submitSeriesAction(input: {
  artistId: string;
  contactEmail: string;
  seriesTitle: string;
  rating: string;
  category: string;
  episodes: EpisodeInput[];
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Tu dois être connecté pour soumettre une série.");

  const identities = await getUserIdentities(user.id);
  const identity = identities.find((a) => a.id === input.artistId);
  if (!identity) throw new Error("Tu dois être artiste pour soumettre une série.");

  const seriesTitle = input.seriesTitle.trim();
  if (!seriesTitle) throw new Error("Le titre de la série est requis.");
  if (input.episodes.length === 0) throw new Error("Ajoute au moins un épisode.");

  for (const episode of input.episodes) {
    await createFilmSubmission({
      userId: user.id,
      artistId: identity.isStudio ? null : identity.id,
      studioId: identity.isStudio ? identity.id : null,
      artistName: identity.name,
      title: episode.title,
      synopsis: episode.synopsis,
      year: episode.year,
      durationMinutes: episode.durationMinutes,
      rating: input.rating,
      category: input.category,
      contactEmail: input.contactEmail,
      poster: episode.poster,
      videoUrl: episode.videoUrl,
      seriesTitle,
      seasonNumber: episode.episodeKind === "teaser" ? null : episode.seasonNumber,
      episodeNumber: episode.episodeNumber,
      episodeKind: episode.episodeKind,
    });
  }
}
