"use server";

import { revalidatePath } from "next/cache";
import { createArtist, deleteArtist, updateArtist, type ArtistInput } from "@/db/queries";

function readArtistInput(formData: FormData): ArtistInput {
  return {
    name: String(formData.get("name") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    avatar: String(formData.get("avatar") ?? ""),
  };
}

export async function createArtistAction(formData: FormData) {
  await createArtist(readArtistInput(formData));
  revalidatePath("/admin/artistes");
}

export async function updateArtistAction(id: string, formData: FormData) {
  await updateArtist(id, readArtistInput(formData));
  revalidatePath("/admin/artistes");
}

export async function deleteArtistAction(id: string) {
  await deleteArtist(id);
  revalidatePath("/admin/artistes");
}
