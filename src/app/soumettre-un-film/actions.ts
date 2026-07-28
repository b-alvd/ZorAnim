"use server";

import { createFilmSubmission } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function submitFilmAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Tu dois être connecté pour soumettre un film.");

  await createFilmSubmission({
    userId: user.id,
    title: String(formData.get("title") ?? ""),
    synopsis: String(formData.get("synopsis") ?? ""),
    year: Number(formData.get("year")),
    durationMinutes: Number(formData.get("durationMinutes")),
    rating: String(formData.get("rating") ?? ""),
    category: String(formData.get("category") ?? ""),
    artistName: String(formData.get("artistName") ?? ""),
    contactEmail: String(formData.get("contactEmail") ?? ""),
    poster: String(formData.get("poster") ?? ""),
    videoUrl: String(formData.get("videoUrl") ?? ""),
  });
}
