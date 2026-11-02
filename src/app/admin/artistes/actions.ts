"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createArtist, deleteArtist, setArtistUser, updateArtist, type ArtistInput } from "@/db/queries";

// Returned rather than thrown: Next.js hides thrown messages in production.
export type ArtistActionResult = { error?: string };

function readArtistInput(formData: FormData): ArtistInput {
  return {
    name: String(formData.get("name") ?? "").trim(),
    bio: String(formData.get("bio") ?? "").trim(),
    avatar: String(formData.get("avatar") ?? ""),
  };
}

const ACCOUNT_REQUIRED = "Choisis le compte auquel appartient ce profil d'artiste.";

function readUserId(formData: FormData): string {
  return String(formData.get("userId") ?? "");
}

function revalidateArtist(id?: string) {
  revalidatePath("/admin/artistes");
  revalidatePath("/artistes");
  if (id) revalidatePath(`/artistes/${id}`);
}

export async function createArtistAction(formData: FormData): Promise<ArtistActionResult> {
  await requireAdmin();
  const userId = readUserId(formData);
  if (!userId) return { error: ACCOUNT_REQUIRED };
  const id = await createArtist(readArtistInput(formData));
  try {
    await setArtistUser(id, userId);
  } catch (e) {
    // Account already taken: don't leave a half-created artist behind.
    await deleteArtist(id);
    return { error: e instanceof Error ? e.message : "Impossible de lier ce compte." };
  }
  revalidateArtist(id);
  return {};
}

export async function updateArtistAction(id: string, formData: FormData): Promise<ArtistActionResult> {
  await requireAdmin();
  const userId = readUserId(formData);
  if (!userId) return { error: ACCOUNT_REQUIRED };
  // Account first: if it is already taken, nothing else is changed.
  try {
    await setArtistUser(id, userId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Impossible de lier ce compte." };
  }
  await updateArtist(id, readArtistInput(formData));
  revalidateArtist(id);
  return {};
}

export async function deleteArtistAction(id: string) {
  await requireAdmin();
  await deleteArtist(id);
  revalidateArtist();
}
