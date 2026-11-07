"use server";

import { revalidatePath } from "next/cache";
import { createContactMessage } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";

// Kept in sync with MAX_LENGTH in ContactForm.tsx ("use server" files may only export functions).
const MAX_MESSAGE_LENGTH = 3000;

// Returned rather than thrown: Next.js hides thrown messages in production.
export async function submitContactAction(input: { subject: string; message: string }): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Tu dois être connecté pour envoyer un message." };

  const message = input.message.trim();
  if (message.length < 10) return { error: "Ton message est un peu court : détaille-le en quelques mots." };
  if (message.length > MAX_MESSAGE_LENGTH) return { error: `Ton message dépasse ${MAX_MESSAGE_LENGTH} caractères.` };

  await createContactMessage({ userId: user.id, name: user.name, email: user.email, subject: input.subject, message });
  revalidatePath("/profil");
  revalidatePath("/admin", "layout");
  return {};
}
