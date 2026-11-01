"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { adminDeleteStudio, adminRemoveStudioMember } from "@/db/queries";

export async function adminDeleteStudioAction(studioId: string) {
  await requireAdmin();
  await adminDeleteStudio(studioId);
  revalidatePath("/admin/studios");
}

export async function adminRemoveStudioMemberAction(memberRowId: string) {
  await requireAdmin();
  await adminRemoveStudioMember(memberRowId);
  revalidatePath("/admin/studios");
}
