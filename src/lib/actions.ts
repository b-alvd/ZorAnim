"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  addComment,
  deleteComment,
  getFilmComments,
  getFilmCreatorUserIds,
  getUserRating,
  toggleCommentReaction,
  toggleFavorite,
  upsertRating,
  type Comment,
} from "@/db/queries";

export async function toggleFavoriteAction(filmId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");

  const isFavorite = await toggleFavorite(user.id, filmId);
  revalidatePath("/", "layout");
  return isFavorite;
}

export async function rateFilmAction(filmId: string, value: number): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");
  if (!Number.isInteger(value) || value < 1 || value > 5) throw new Error("Note invalide.");

  await upsertRating(user.id, filmId, value);
  revalidatePath("/", "layout");
}

export async function getFilmSocialDataAction(filmId: string): Promise<{
  comments: Comment[];
  userRating: number | null;
  currentUserId: string | null;
  canModerate: boolean;
  creatorUserIds: string[];
}> {
  const user = await getCurrentUser();
  const [filmComments, userRating, creatorUserIds] = await Promise.all([
    getFilmComments(filmId, user?.id),
    user ? getUserRating(user.id, filmId) : Promise.resolve(null),
    getFilmCreatorUserIds(filmId),
  ]);

  return {
    comments: filmComments,
    userRating,
    currentUserId: user?.id ?? null,
    canModerate: user?.role === "admin",
    creatorUserIds,
  };
}

export async function addCommentAction(filmId: string, body: string, parentId?: string): Promise<Comment[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");
  if (!body.trim()) throw new Error("Le commentaire ne peut pas être vide.");

  await addComment(user.id, filmId, body.trim(), parentId ?? null);
  return getFilmComments(filmId, user.id);
}

export async function deleteCommentAction(commentId: string, filmId: string): Promise<Comment[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");

  await deleteComment(commentId, user.id, user.role === "admin");
  return getFilmComments(filmId, user.id);
}

export async function toggleCommentReactionAction(
  commentId: string,
  filmId: string,
  type: "up" | "down"
): Promise<Comment[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");

  await toggleCommentReaction(user.id, commentId, type);
  return getFilmComments(filmId, user.id);
}
