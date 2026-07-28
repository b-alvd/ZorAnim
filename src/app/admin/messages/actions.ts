"use server";

import { revalidatePath } from "next/cache";
import { replyToContactMessage } from "@/db/queries";

export async function replyToContactMessageAction(id: string, reply: string) {
  await replyToContactMessage(id, reply);
  revalidatePath("/admin/messages");
}
