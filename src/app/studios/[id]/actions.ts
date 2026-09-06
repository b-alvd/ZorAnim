"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requestToJoinStudio } from "@/db/queries";

export async function requestToJoinStudioAction(studioId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");

  await requestToJoinStudio(studioId, user.id);
  revalidatePath(`/studios/${studioId}`);
}
