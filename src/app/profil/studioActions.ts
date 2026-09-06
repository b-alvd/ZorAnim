"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  deleteStudio,
  inviteToStudio,
  removeStudioMembership,
  respondToJoinRequest,
  respondToStudioInvite,
} from "@/db/queries";

export async function inviteToStudioAction(studioId: string, artistId: string) {
  await inviteToStudio(studioId, artistId);
  revalidatePath("/profil");
}

export async function respondToStudioInviteAction(memberId: string, accept: boolean) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");

  const result = await respondToStudioInvite(memberId, user.id, accept);
  revalidatePath("/profil");
  if (result) revalidatePath(`/studios/${result.studioId}`);
}

export async function respondToJoinRequestAction(memberId: string, accept: boolean) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");

  const result = await respondToJoinRequest(memberId, user.id, accept);
  revalidatePath("/profil");
  // The public studio page is statically generated (generateStaticParams),
  // so an accepted member wouldn't show up there until this path is
  // explicitly revalidated.
  if (result) revalidatePath(`/studios/${result.studioId}`);
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
