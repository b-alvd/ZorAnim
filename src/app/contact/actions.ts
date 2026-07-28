"use server";

import { createContactMessage } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function submitContactAction(input: { name: string; email: string; subject: string; message: string }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Tu dois être connecté pour envoyer un message.");

  await createContactMessage({ userId: user.id, ...input });
}
