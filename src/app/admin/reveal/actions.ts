"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { updateSiteSettings } from "@/db/queries";

export async function updateRevealSettingsAction(input: { revealEnabled: boolean; revealAt: string | null }): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Non autorisé.");

  await updateSiteSettings(input);
  revalidatePath("/admin/reveal");
  revalidatePath("/", "layout");
}
