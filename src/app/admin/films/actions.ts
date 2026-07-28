"use server";

import { revalidatePath } from "next/cache";
import { createFilm, deleteFilm, updateFilm, type FilmInput } from "@/db/queries";

function readFilmInput(formData: FormData): FilmInput {
  return {
    title: String(formData.get("title") ?? ""),
    synopsis: String(formData.get("synopsis") ?? ""),
    year: Number(formData.get("year")),
    durationMinutes: Number(formData.get("durationMinutes")),
    rating: String(formData.get("rating") ?? ""),
    category: String(formData.get("category") ?? ""),
    artistId: String(formData.get("artistId") ?? ""),
    isNew: formData.get("isNew") === "on",
    poster: String(formData.get("poster") ?? ""),
    videoUrl: String(formData.get("videoUrl") ?? ""),
  };
}

export async function createFilmAction(formData: FormData) {
  await createFilm(readFilmInput(formData));
  revalidatePath("/admin/films");
}

export async function updateFilmAction(id: string, formData: FormData) {
  await updateFilm(id, readFilmInput(formData));
  revalidatePath("/admin/films");
}

export async function deleteFilmAction(id: string) {
  await deleteFilm(id);
  revalidatePath("/admin/films");
}
