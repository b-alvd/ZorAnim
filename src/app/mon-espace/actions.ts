"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  deleteFilm,
  getFilm,
  getIdentityOwnership,
  getUserIdentities,
  updateArtist,
  updateFilm,
  updateStudio,
  type ArtistInput,
  type FilmInput,
} from "@/db/queries";

async function assertOwnsFilm(userId: string, filmId: string) {
  const film = await getFilm(filmId);
  if (!film) throw new Error("Film introuvable.");
  const identities = await getUserIdentities(userId);
  if (!identities.some((i) => i.id === film.artistId)) throw new Error("Non autorisé.");
}

async function resolveIdentityInput(userId: string, identityId: string): Promise<{ artistId: string | null; studioId: string | null }> {
  const identities = await getUserIdentities(userId);
  const identity = identities.find((i) => i.id === identityId);
  if (!identity) throw new Error("Non autorisé.");
  return identity.isStudio ? { artistId: null, studioId: identity.id } : { artistId: identity.id, studioId: null };
}

async function assertOwnsIdentity(userId: string, identityId: string) {
  const identity = await getIdentityOwnership(identityId);
  if (!identity) throw new Error("Profil introuvable.");
  if (identity.isStudio) {
    if (identity.ownerId !== userId) throw new Error("Non autorisé.");
  } else if (identity.userId !== userId) {
    throw new Error("Non autorisé.");
  }
}

export async function updateOwnFilmAction(filmId: string, input: FilmInput): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");
  await assertOwnsFilm(user.id, filmId);
  const { artistId, studioId } = await resolveIdentityInput(user.id, input.artistId ?? "");

  await updateFilm(filmId, { ...input, artistId, studioId });
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

export async function updateOwnProfileAction(identityId: string, input: ArtistInput): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");
  const ownership = await getIdentityOwnership(identityId);
  await assertOwnsIdentity(user.id, identityId);

  if (ownership?.isStudio) {
    await updateStudio(identityId, input);
  } else {
    await updateArtist(identityId, input);
  }
  revalidatePath("/mon-espace");
  revalidatePath("/", "layout");
}
