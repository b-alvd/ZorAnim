"use server";

import { revalidatePath } from "next/cache";
import {
  acceptArtistSubmission,
  acceptFilmSubmission,
  refuseArtistSubmission,
  refuseFilmSubmission,
  resolveBanAppeal,
  updateArtistSubmission,
  updateFilmSubmission,
  type ArtistSubmissionInput,
  type FilmSubmissionInput,
} from "@/db/queries";

function readFilmSubmissionInput(formData: FormData): FilmSubmissionInput {
  return {
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
  };
}

export async function updateFilmSubmissionAction(id: string, formData: FormData) {
  await updateFilmSubmission(id, readFilmSubmissionInput(formData));
  revalidatePath("/admin/demandes");
}

export async function acceptFilmSubmissionAction(id: string, identityId: string, isStudio: boolean) {
  await acceptFilmSubmission(id, { id: identityId, isStudio });
  revalidatePath("/admin/demandes");
  revalidatePath("/admin/films");
}

export async function refuseFilmSubmissionAction(id: string) {
  await refuseFilmSubmission(id);
  revalidatePath("/admin/demandes");
}

function readArtistSubmissionInput(formData: FormData): ArtistSubmissionInput {
  const avatar = String(formData.get("avatar") ?? "").trim();
  const portfolioUrl = String(formData.get("portfolioUrl") ?? "").trim();

  return {
    name: String(formData.get("name") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    contactEmail: String(formData.get("contactEmail") ?? ""),
    avatar: avatar || null,
    portfolioUrl: portfolioUrl || null,
  };
}

export async function updateArtistSubmissionAction(id: string, formData: FormData) {
  await updateArtistSubmission(id, readArtistSubmissionInput(formData));
  revalidatePath("/admin/demandes");
}

export async function acceptArtistSubmissionAction(id: string) {
  await acceptArtistSubmission(id);
  revalidatePath("/admin/demandes");
  revalidatePath("/admin/artistes");
}

export async function refuseArtistSubmissionAction(id: string) {
  await refuseArtistSubmission(id);
  revalidatePath("/admin/demandes");
}

export async function acceptBanAppealAction(appealId: string) {
  await resolveBanAppeal(appealId, true);
  revalidatePath("/admin/demandes");
  revalidatePath("/admin/utilisateurs");
}

export async function rejectBanAppealAction(appealId: string) {
  await resolveBanAppeal(appealId, false);
  revalidatePath("/admin/demandes");
}
