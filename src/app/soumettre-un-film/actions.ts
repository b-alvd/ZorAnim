"use server";

import { createFilmSubmission, getUserIdentities } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function submitFilmAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Tu dois être connecté pour soumettre un film.");

  const identities = await getUserIdentities(user.id);
  const artistId = String(formData.get("artistId") ?? "");
  const identity = identities.find((a) => a.id === artistId);
  if (!identity) throw new Error("Tu dois être artiste pour soumettre un film.");

  await createFilmSubmission({
    userId: user.id,
    artistId: identity.id,
    artistName: identity.name,
    title: String(formData.get("title") ?? ""),
    synopsis: String(formData.get("synopsis") ?? ""),
    year: Number(formData.get("year")),
    durationMinutes: Number(formData.get("durationMinutes")),
    rating: String(formData.get("rating") ?? ""),
    category: String(formData.get("category") ?? ""),
    contactEmail: String(formData.get("contactEmail") ?? ""),
    poster: String(formData.get("poster") ?? ""),
    videoUrl: String(formData.get("videoUrl") ?? ""),
  });
}
