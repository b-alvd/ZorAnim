"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { deleteStudio, inviteToStudio, removeStudioMembership, respondToStudioInvite } from "@/db/queries";

export async function inviteToStudioAction(studioId: string, artistId: string) {
  await inviteToStudio(studioId, artistId);
  revalidatePath("/profil");
}

export async function respondToStudioInviteAction(memberId: string, accept: boolean) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");

  await respondToStudioInvite(memberId, user.id, accept);
  revalidatePath("/profil");
}

export async function removeStudioMembershipAction(memberId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");

  await removeStudioMembership(memberId, user.id);
  revalidatePath("/profil");
}

export async function deleteStudioAction(studioId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");

  await deleteStudio(studioId, user.id);
  revalidatePath("/profil");
}
