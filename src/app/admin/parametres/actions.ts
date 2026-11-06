"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { updateSiteSettings } from "@/db/queries";

type ActionResult = { error?: string };

async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user && user.role === "admin";
}

export async function updateMaintenanceAction(input: { maintenanceEnabled: boolean }): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Non autorisé." };
  await updateSiteSettings({ maintenanceEnabled: input.maintenanceEnabled });
  revalidatePath("/", "layout");
  return {};
}

export async function updatePatchNoteAction(input: {
  patchNoteEnabled: boolean;
  patchNoteTitle: string | null;
  patchNoteMessage: string | null;
}): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Non autorisé." };
  if (input.patchNoteEnabled && !input.patchNoteMessage) {
    return { error: "Ajoute un message pour afficher l'encart." };
  }
  await updateSiteSettings(input);
  revalidatePath("/", "layout");
  return {};
}
