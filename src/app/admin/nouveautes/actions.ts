"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { updateSiteSettings } from "@/db/queries";

export async function updatePatchNoteAction(input: {
  patchNoteEnabled: boolean;
  patchNoteTitle: string | null;
  patchNoteMessage: string | null;
}): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Non autorisé.");

  await updateSiteSettings(input);
  revalidatePath("/admin/nouveautes");
  revalidatePath("/", "layout");
}
