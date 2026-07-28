"use server";

import { createStudio, getArtistByUserId } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function createStudioAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Tu dois être connecté pour créer un studio.");

  const personalArtist = await getArtistByUserId(user.id);
  if (!personalArtist) throw new Error("Tu dois être artiste pour créer un studio.");

  await createStudio(user.id, {
    name: String(formData.get("name") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    avatar: String(formData.get("avatar") ?? ""),
  });
}
