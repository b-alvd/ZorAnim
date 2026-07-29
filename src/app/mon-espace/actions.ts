"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  createFilm,
  deleteFilm,
  getArtistOwnership,
  getFilm,
  getUserIdentities,
  updateArtist,
  updateFilm,
  type ArtistInput,
  type FilmInput,
} from "@/db/queries";

async function assertOwnsFilm(userId: string, filmId: string) {
  const film = await getFilm(filmId);
  if (!film) throw new Error("Film introuvable.");
  const identities = await getUserIdentities(userId);
  if (!identities.some((i) => i.id === film.artistId)) throw new Error("Non autorisé.");
}

async function assertOwnsIdentity(userId: string, artistId: string) {
  const artist = await getArtistOwnership(artistId);
  if (!artist) throw new Error("Profil introuvable.");
  if (artist.isStudio) {
    if (artist.ownerId !== userId) throw new Error("Non autorisé.");
  } else if (artist.userId !== userId) {
    throw new Error("Non autorisé.");
  }
}

export async function createOwnFilmAction(input: FilmInput): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");
  const identities = await getUserIdentities(user.id);
  if (!identities.some((i) => i.id === input.artistId)) throw new Error("Non autorisé.");

  await createFilm(input);
  revalidatePath("/mon-espace");
  revalidatePath("/", "layout");
}

export async function updateOwnFilmAction(filmId: string, input: FilmInput): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");
  await assertOwnsFilm(user.id, filmId);

  await updateFilm(filmId, input);
  revalidatePath("/mon-espace");
  revalidatePath("/", "layout");
}

export async function deleteOwnFilmAction(filmId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");
  await assertOwnsFilm(user.id, filmId);

  await deleteFilm(filmId);
  revalidatePath("/mon-espace");
  revalidatePath("/", "layout");
}

export async function updateOwnProfileAction(artistId: string, input: ArtistInput): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");
  await assertOwnsIdentity(user.id, artistId);

  await updateArtist(artistId, input);
  revalidatePath("/mon-espace");
  revalidatePath("/", "layout");
}
