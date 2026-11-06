"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { replyToContactMessage, setContactMessageStatus } from "@/db/queries";

export async function replyToContactMessageAction(id: string, reply: string) {
  await requireAdmin();
  await replyToContactMessage(id, reply);
  revalidatePath("/admin/messages");
  revalidatePath("/admin", "layout");
}

// Handled without a written reply, or opened again.
export async function setContactMessageStatusAction(id: string, status: "open" | "closed") {
  await requireAdmin();
  await setContactMessageStatus(id, status);
  revalidatePath("/admin/messages");
  revalidatePath("/admin", "layout");
}
