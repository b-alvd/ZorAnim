"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createArtist, deleteArtist, updateArtist, type ArtistInput } from "@/db/queries";

function readArtistInput(formData: FormData): ArtistInput {
  return {
    name: String(formData.get("name") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    avatar: String(formData.get("avatar") ?? ""),
  };
}

export async function createArtistAction(formData: FormData) {
  await requireAdmin();
  await createArtist(readArtistInput(formData));
  revalidatePath("/admin/artistes");
}

export async function updateArtistAction(id: string, formData: FormData) {
  await requireAdmin();
  await updateArtist(id, readArtistInput(formData));
  revalidatePath("/admin/artistes");
}

export async function deleteArtistAction(id: string) {
  await requireAdmin();
  await deleteArtist(id);
  revalidatePath("/admin/artistes");
}
