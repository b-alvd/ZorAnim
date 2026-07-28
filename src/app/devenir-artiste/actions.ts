"use server";

import { createArtistSubmission } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function submitArtistAction(formData: FormData) {
  const avatar = String(formData.get("avatar") ?? "").trim();
  const portfolioUrl = String(formData.get("portfolioUrl") ?? "").trim();
  const user = await getCurrentUser();
  if (!user) throw new Error("Tu dois être connecté pour envoyer une candidature.");

  await createArtistSubmission({
    name: String(formData.get("name") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    contactEmail: String(formData.get("contactEmail") ?? ""),
    avatar: avatar || null,
    portfolioUrl: portfolioUrl || null,
    userId: user.id,
  });
}
