"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { replyToContactMessage } from "@/db/queries";

export async function replyToContactMessageAction(id: string, reply: string) {
  await requireAdmin();
  await replyToContactMessage(id, reply);
  revalidatePath("/admin/messages");
}
