"use server";

import { revalidatePath } from "next/cache";
import { adminDeleteStudio, adminRemoveStudioMember } from "@/db/queries";

export async function adminDeleteStudioAction(studioId: string) {
  await adminDeleteStudio(studioId);
  revalidatePath("/admin/studios");
}

export async function adminRemoveStudioMemberAction(memberRowId: string) {
  await adminRemoveStudioMember(memberRowId);
  revalidatePath("/admin/studios");
}
