"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  acceptArtistSubmission,
  acceptFilmSubmission,
  getReleaseRequests,
  setReleaseRequest,
  refuseArtistSubmission,
  refuseFilmSubmission,
  resolveBanAppeal,
  updateArtistSubmission,
  updateFilmSubmission,
  type ArtistSubmissionInput,
  type FilmSubmissionInput,
} from "@/db/queries";
import { parseReleaseRequest, validateReleaseRequest } from "@/lib/release-request";

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

// The admin can change everything the creator asked for, release included.
// Returned rather than thrown: Next.js hides thrown messages in production.
export async function updateFilmSubmissionAction(id: string, formData: FormData): Promise<RequestActionResult> {
  await requireAdmin();
  try {
    const raw = formData.get("releaseRequest");
    if (raw !== null) {
      const previous = (await getReleaseRequests([id])).get(id);
      const release = { ...parseReleaseRequest(String(raw)), note: previous?.note ?? null };
      // Dates may be in the past for the admin; only their consistency is checked.
      const problem = validateReleaseRequest(release, Number.NEGATIVE_INFINITY);
      if (problem) return { error: problem };
      await setReleaseRequest(id, release);
    }
    await updateFilmSubmission(id, readFilmSubmissionInput(formData));
  } catch (e) {
    return errorOf(e);
  }
  revalidatePath("/admin/demandes");
  return {};
}

// Returned rather than thrown: Next.js hides thrown messages in production.
export type RequestActionResult = { error?: string };

const errorOf = (e: unknown): RequestActionResult => ({
  error: e instanceof Error ? e.message : "Une erreur est survenue.",
});

export async function acceptFilmSubmissionAction(
  id: string,
  identityId: string,
  isStudio: boolean
): Promise<RequestActionResult> {
  await requireAdmin();
  try {
    await acceptFilmSubmission(id, { id: identityId, isStudio });
  } catch (e) {
    return errorOf(e);
  }
  revalidatePath("/admin/demandes");
  revalidatePath("/admin/films");
  revalidatePath("/admin", "layout");
  return {};
}

export async function refuseFilmSubmissionAction(id: string) {
  await requireAdmin();
  await refuseFilmSubmission(id);
  revalidatePath("/admin/demandes");
  revalidatePath("/admin", "layout");
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
  await requireAdmin();
  await updateArtistSubmission(id, readArtistSubmissionInput(formData));
  revalidatePath("/admin/demandes");
}

export async function acceptArtistSubmissionAction(id: string): Promise<RequestActionResult> {
  await requireAdmin();
  try {
    await acceptArtistSubmission(id);
  } catch (e) {
    return errorOf(e);
  }
  revalidatePath("/admin/demandes");
  revalidatePath("/admin/artistes");
  revalidatePath("/admin", "layout");
  return {};
}

export async function refuseArtistSubmissionAction(id: string) {
  await requireAdmin();
  await refuseArtistSubmission(id);
  revalidatePath("/admin/demandes");
  revalidatePath("/admin", "layout");
}

export async function acceptBanAppealAction(appealId: string) {
  await requireAdmin();
  await resolveBanAppeal(appealId, true);
  revalidatePath("/admin/demandes");
  revalidatePath("/admin/utilisateurs");
  revalidatePath("/admin", "layout");
}

export async function rejectBanAppealAction(appealId: string) {
  await requireAdmin();
  await resolveBanAppeal(appealId, false);
  revalidatePath("/admin/demandes");
  revalidatePath("/admin", "layout");
}
