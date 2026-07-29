"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { updateSiteSettings } from "@/db/queries";

export async function updateMaintenanceSettingsAction(input: { maintenanceEnabled: boolean }): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Non autorisé.");

  await updateSiteSettings(input);
  revalidatePath("/admin/maintenance");
  revalidatePath("/", "layout");
}
