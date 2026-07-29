"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isRateLimited } from "@/lib/rateLimit";
import {
  addComment,
  deleteComment,
  getFilmComments,
  getFilmCreatorUserIds,
  getNotifications,
  getSeriesEpisodes,
  getUnreadNotificationCount,
  getUserRating,
  getWatchedFilmIds,
  isFilmFavorite,
  markAllNotificationsRead,
  resolveCommentFilmId,
  toggleCommentReaction,
  toggleFavorite,
  upsertRating,
  type Comment,
  type Notification,
} from "@/db/queries";
import type { Film } from "@/data/types";

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
  if (isRateLimited(`rate:${user.id}`, 20, 5 * 60 * 1000)) {
    throw new Error("Trop de notes envoyées, réessaie dans quelques minutes.");
  }

  await upsertRating(user.id, filmId, value);
  revalidatePath("/", "layout");
}

export async function getFilmSocialDataAction(filmId: string): Promise<{
  comments: Comment[];
  userRating: number | null;
  currentUserId: string | null;
  canModerate: boolean;
  creatorUserIds: string[];
  isFavorite: boolean;
}> {
  const user = await getCurrentUser();
  const commentFilmId = await resolveCommentFilmId(filmId);
  const [filmComments, userRating, creatorUserIds, isFavorite] = await Promise.all([
    getFilmComments(commentFilmId, user?.id),
    user ? getUserRating(user.id, filmId) : Promise.resolve(null),
    getFilmCreatorUserIds(filmId),
    user ? isFilmFavorite(user.id, filmId) : Promise.resolve(false),
  ]);

  return {
    comments: filmComments,
    userRating,
    currentUserId: user?.id ?? null,
    canModerate: user?.role === "admin",
    creatorUserIds,
    isFavorite,
  };
}

export async function addCommentAction(filmId: string, body: string, parentId?: string): Promise<Comment[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");
  if (!body.trim()) throw new Error("Le commentaire ne peut pas être vide.");
  if (isRateLimited(`comment:${user.id}`, 8, 5 * 60 * 1000)) {
    throw new Error("Trop de commentaires envoyés, réessaie dans quelques minutes.");
  }

  const commentFilmId = await resolveCommentFilmId(filmId);
  await addComment(user.id, commentFilmId, body.trim(), parentId ?? null);
  return getFilmComments(commentFilmId, user.id);
}

export async function deleteCommentAction(commentId: string, filmId: string): Promise<Comment[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");

  const commentFilmId = await resolveCommentFilmId(filmId);
  await deleteComment(commentId, user.id, user.role === "admin");
  return getFilmComments(commentFilmId, user.id);
}

export async function toggleCommentReactionAction(
  commentId: string,
  filmId: string,
  type: "up" | "down"
): Promise<Comment[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");
  if (isRateLimited(`reaction:${user.id}`, 40, 60 * 1000)) {
    throw new Error("Trop de réactions envoyées, réessaie dans un instant.");
  }

  const commentFilmId = await resolveCommentFilmId(filmId);
  await toggleCommentReaction(user.id, commentId, type);
  return getFilmComments(commentFilmId, user.id);
}

export async function getNotificationsAction(): Promise<{ notifications: Notification[]; unreadCount: number }> {
  const user = await getCurrentUser();
  if (!user) return { notifications: [], unreadCount: 0 };

  const [list, unreadCount] = await Promise.all([getNotifications(user.id), getUnreadNotificationCount(user.id)]);
  return { notifications: list, unreadCount };
}

export async function getSeriesEpisodesAction(seriesTitle: string): Promise<Film[]> {
  return getSeriesEpisodes(seriesTitle);
}

export async function getWatchedEpisodeIdsAction(seriesTitle: string): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const [episodes, watchedIds] = await Promise.all([getSeriesEpisodes(seriesTitle), getWatchedFilmIds(user.id)]);
  return episodes.filter((ep) => watchedIds.has(ep.id)).map((ep) => ep.id);
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await markAllNotificationsRead(user.id);
}
