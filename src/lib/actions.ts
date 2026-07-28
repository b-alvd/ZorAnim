"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { toggleFavorite } from "@/db/queries";

export async function toggleFavoriteAction(filmId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");

  const isFavorite = await toggleFavorite(user.id, filmId);
  revalidatePath("/", "layout");
  return isFavorite;
}
