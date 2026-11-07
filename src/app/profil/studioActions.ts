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

// Errors are returned rather than thrown: Next.js hides thrown messages in
// production, and these ones are meant for the user.
export type StudioActionResult = { error?: string };

async function run(action: (userId: string) => Promise<string | void | null>): Promise<StudioActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Non authentifié." };
  try {
    const studioId = await action(user.id);
    revalidatePath("/profil");
    // Public studio pages are statically generated: refresh the one touched.
    if (studioId) revalidatePath(`/studios/${studioId}`);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function inviteToStudioAction(studioId: string, artistId: string) {
  return run(async (userId) => {
    await inviteToStudio(studioId, artistId, userId);
  });
}

export async function respondToStudioInviteAction(memberId: string, accept: boolean) {
  return run(async (userId) => (await respondToStudioInvite(memberId, userId, accept))?.studioId);
}

export async function respondToJoinRequestAction(memberId: string, accept: boolean) {
  return run(async (userId) => (await respondToJoinRequest(memberId, userId, accept))?.studioId);
}

export async function removeStudioMembershipAction(memberId: string, studioId?: string) {
  return run(async (userId) => {
    await removeStudioMembership(memberId, userId);
    return studioId;
  });
}

export async function deleteStudioAction(studioId: string) {
  return run(async (userId) => {
    await deleteStudio(studioId, userId);
  });
}
