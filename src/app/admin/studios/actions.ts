"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  adminDeleteStudio,
  adminRemoveStudioMember,
  adminSetStudioMemberActive,
  adminTransferStudio,
  adminUpdateStudio,
} from "@/db/queries";

// Returned rather than thrown: Next.js hides thrown messages in production.
export type StudioActionResult = { error?: string };

function revalidateStudio(id?: string) {
  revalidatePath("/admin/studios");
  revalidatePath("/studios");
  if (id) revalidatePath(`/studios/${id}`);
}

export async function adminUpdateStudioAction(id: string, formData: FormData): Promise<StudioActionResult> {
  await requireAdmin();
  const ownerId = String(formData.get("ownerId") ?? "");
  try {
    await adminUpdateStudio(
      id,
      {
        name: String(formData.get("name") ?? "").trim(),
        bio: String(formData.get("bio") ?? "").trim(),
        avatar: String(formData.get("avatar") ?? ""),
      },
      ownerId
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Enregistrement impossible." };
  }
  revalidateStudio(id);
  return {};
}

export async function adminDeleteStudioAction(studioId: string) {
  await requireAdmin();
  await adminDeleteStudio(studioId);
  revalidateStudio();
}

export async function adminRemoveStudioMemberAction(memberRowId: string, studioId: string) {
  await requireAdmin();
  await adminRemoveStudioMember(memberRowId);
  revalidateStudio(studioId);
}

export async function adminTransferStudioAction(studioId: string, newOwnerId: string) {
  await requireAdmin();
  await adminTransferStudio(studioId, newOwnerId);
  revalidateStudio(studioId);
  revalidatePath("/admin/utilisateurs");
}

export async function adminAcceptStudioMemberAction(memberRowId: string, studioId: string) {
  await requireAdmin();
  await adminSetStudioMemberActive(memberRowId);
  revalidateStudio(studioId);
}
