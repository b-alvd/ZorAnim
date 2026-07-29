import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  films,
  artists,
  studios,
  users,
  filmSubmissions,
  artistSubmissions,
  favorites,
  watchHistory,
  contactMessages,
  studioMembers,
  filmRatings,
  comments,
  commentReactions,
  notifications,
} from "@/db/schema";
import type { Film, Artist } from "@/data/types";
import { formatDuration, isNewActive } from "@/lib/format";
import { placeholderAvatar } from "@/lib/placeholder";

const filmSelection = {
  id: films.id,
  title: films.title,
  synopsis: films.synopsis,
  year: films.year,
  durationMinutes: films.durationMinutes,
  rating: films.rating,
  category: films.category,
  artistId: films.artistId,
  studioId: films.studioId,
  artistName: artists.name,
  studioName: studios.name,
  markedNewAt: films.markedNewAt,
  poster: films.poster,
  videoUrl: films.videoUrl,
  seriesTitle: films.seriesTitle,
  seasonNumber: films.seasonNumber,
  episodeNumber: films.episodeNumber,
};

function filmsQuery() {
  return db
    .select(filmSelection)
    .from(films)
    .leftJoin(artists, eq(films.artistId, artists.id))
    .leftJoin(studios, eq(films.studioId, studios.id));
}

type FilmRow = Awaited<ReturnType<typeof filmsQuery>>[number];

function mapFilm(row: FilmRow): Film {
  const isStudioAttribution = !!row.studioId;
  return {
    id: row.id,
    title: row.title,
    synopsis: row.synopsis,
    year: row.year,
    duration: formatDuration(row.durationMinutes),
    durationMinutes: row.durationMinutes,
    rating: row.rating,
    category: row.category,
    artistId: (isStudioAttribution ? row.studioId : row.artistId) ?? "",
    artistName: (isStudioAttribution ? row.studioName : row.artistName) ?? "?",
    isStudioAttribution,
    isNew: isNewActive(row.markedNewAt),
    poster: row.poster,
    videoUrl: row.videoUrl,
    avgRating: null,
    ratingCount: 0,
    seriesTitle: row.seriesTitle,
    seasonNumber: row.seasonNumber,
    episodeNumber: row.episodeNumber,
  };
}

async function attachRatingSummaries(filmsList: Film[]): Promise<Film[]> {
  if (filmsList.length === 0) return filmsList;
  const ids = filmsList.map((f) => f.id);
  const rows = await db
    .select({
      filmId: filmRatings.filmId,
      avg: sql<number>`avg(${filmRatings.value})`,
      count: sql<number>`count(*)`,
    })
    .from(filmRatings)
    .where(inArray(filmRatings.filmId, ids))
    .groupBy(filmRatings.filmId);

  const map = new Map(rows.map((r) => [r.filmId, { avg: r.avg, count: r.count }]));
  return filmsList.map((f) => {
    const summary = map.get(f.id);
    return { ...f, avgRating: summary ? summary.avg : null, ratingCount: summary?.count ?? 0 };
  });
}

export async function getFilms(): Promise<Film[]> {
  const rows = await filmsQuery();
  return attachRatingSummaries(rows.map(mapFilm));
}

export async function getFilm(id: string): Promise<Film | undefined> {
  const [row] = await filmsQuery().where(eq(films.id, id));
  if (!row) return undefined;
  const [withRating] = await attachRatingSummaries([mapFilm(row)]);
  return withRating;
}

export async function getNewFilms(): Promise<Film[]> {
  const rows = await filmsQuery();
  return attachRatingSummaries(rows.map(mapFilm).filter((f) => f.isNew));
}

export async function getFilmsByCategory(category: string): Promise<Film[]> {
  const rows = await filmsQuery().where(eq(films.category, category));
  return attachRatingSummaries(rows.map(mapFilm));
}

export async function getFilmsByArtist(artistId: string): Promise<Film[]> {
  const rows = await filmsQuery().where(eq(films.artistId, artistId));
  return attachRatingSummaries(rows.map(mapFilm));
}

export async function getFilmsByStudio(studioId: string): Promise<Film[]> {
  const rows = await filmsQuery().where(eq(films.studioId, studioId));
  return attachRatingSummaries(rows.map(mapFilm));
}

export async function getSeriesEpisodeCounts(seriesTitles: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (seriesTitles.length === 0) return map;
  const rows = await db
    .select({ seriesTitle: films.seriesTitle })
    .from(films)
    .where(inArray(films.seriesTitle, seriesTitles));
  for (const r of rows) {
    if (!r.seriesTitle) continue;
    map.set(r.seriesTitle, (map.get(r.seriesTitle) ?? 0) + 1);
  }
  return map;
}

export async function getSeriesEpisodeIds(seriesTitles: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (seriesTitles.length === 0) return map;
  const rows = await db
    .select({ id: films.id, seriesTitle: films.seriesTitle })
    .from(films)
    .where(inArray(films.seriesTitle, seriesTitles));
  for (const r of rows) {
    if (!r.seriesTitle) continue;
    const arr = map.get(r.seriesTitle) ?? [];
    arr.push(r.id);
    map.set(r.seriesTitle, arr);
  }
  return map;
}

export async function getSeriesEpisodes(seriesTitle: string): Promise<Film[]> {
  const rows = await filmsQuery().where(eq(films.seriesTitle, seriesTitle));
  const episodes = await attachRatingSummaries(rows.map(mapFilm));
  return episodes.sort(
    (a, b) => (a.seasonNumber ?? 0) - (b.seasonNumber ?? 0) || (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0)
  );
}

export async function resolveCommentFilmId(filmId: string): Promise<string> {
  const [film] = await db.select({ seriesTitle: films.seriesTitle }).from(films).where(eq(films.id, filmId));
  if (!film?.seriesTitle) return filmId;
  const episodes = await getSeriesEpisodes(film.seriesTitle);
  return episodes[0]?.id ?? filmId;
}

export async function getSuggestions(excludeId: string, limit = 4): Promise<Film[]> {
  const rows = await filmsQuery().where(ne(films.id, excludeId));
  return attachRatingSummaries(rows.slice(0, limit).map(mapFilm));
}

export async function getCategories(): Promise<string[]> {
  const rows = await db.selectDistinct({ category: films.category }).from(films);
  return rows.map((r) => r.category);
}

export async function getArtists(): Promise<Artist[]> {
  const rows = await db.select().from(artists);
  return rows.map((a) => ({ id: a.id, name: a.name, bio: a.bio, avatar: a.avatar, isStudio: false }));
}

export async function getArtist(id: string): Promise<Artist | undefined> {
  const [row] = await db.select().from(artists).where(eq(artists.id, id));
  if (!row) return undefined;
  return { id: row.id, name: row.name, bio: row.bio, avatar: row.avatar, isStudio: false };
}

export async function getStudios(): Promise<Artist[]> {
  const rows = await db.select().from(studios);
  return rows.map((s) => ({ id: s.id, name: s.name, bio: s.bio, avatar: s.avatar, isStudio: true }));
}

export async function getStudio(id: string): Promise<Artist | undefined> {
  const [row] = await db.select().from(studios).where(eq(studios.id, id));
  if (!row) return undefined;
  return { id: row.id, name: row.name, bio: row.bio, avatar: row.avatar, isStudio: true };
}

export type FilmInput = {
  title: string;
  synopsis: string;
  year: number;
  durationMinutes: number;
  rating: string;
  category: string;
  artistId: string | null;
  studioId: string | null;
  isNew: boolean;
  poster: string;
  videoUrl: string;
  seriesTitle?: string | null;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
};

export async function createFilm(input: FilmInput): Promise<string> {
  const id = randomUUID();
  const { isNew, ...rest } = input;
  await db.insert(films).values({ id, ...rest, markedNewAt: isNew ? new Date().toISOString() : null });
  return id;
}

export async function updateFilm(id: string, input: FilmInput): Promise<void> {
  const { isNew, ...rest } = input;
  const [existing] = await db.select({ markedNewAt: films.markedNewAt }).from(films).where(eq(films.id, id));

  let markedNewAt: string | null;
  if (!isNew) {
    markedNewAt = null;
  } else if (isNewActive(existing?.markedNewAt ?? null)) {
    markedNewAt = existing!.markedNewAt;
  } else {
    markedNewAt = new Date().toISOString();
  }

  await db.update(films).set({ ...rest, markedNewAt }).where(eq(films.id, id));
}

export async function deleteFilm(id: string): Promise<void> {
  await db.delete(films).where(eq(films.id, id));
}

export type ArtistInput = {
  name: string;
  bio: string;
  avatar: string;
};

export async function createArtist(input: ArtistInput, userId?: string | null): Promise<string> {
  const id = randomUUID();
  await db.insert(artists).values({ id, ...input, userId: userId ?? null });
  return id;
}

export async function getIdentityOwnership(
  id: string
): Promise<{ isStudio: boolean; ownerId: string | null; userId: string | null } | undefined> {
  const [artistRow] = await db.select({ userId: artists.userId }).from(artists).where(eq(artists.id, id));
  if (artistRow) return { isStudio: false, ownerId: null, userId: artistRow.userId };

  const [studioRow] = await db.select({ ownerId: studios.ownerId }).from(studios).where(eq(studios.id, id));
  if (studioRow) return { isStudio: true, ownerId: studioRow.ownerId, userId: null };

  return undefined;
}

export async function updateArtist(id: string, input: ArtistInput): Promise<void> {
  await db.update(artists).set(input).where(eq(artists.id, id));
}

export async function deleteArtist(id: string): Promise<void> {
  await db.delete(artists).where(eq(artists.id, id));
}

export async function updateStudio(id: string, input: ArtistInput): Promise<void> {
  await db.update(studios).set(input).where(eq(studios.id, id));
}

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
};

export async function getUsers(): Promise<AdminUser[]> {
  return db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role, createdAt: users.createdAt })
    .from(users);
}

export async function updateUserRole(id: string, role: "user" | "admin"): Promise<void> {
  await db.update(users).set({ role }).where(eq(users.id, id));
}

export async function deleteUser(id: string): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
}

export type FilmSubmission = typeof filmSubmissions.$inferSelect;
export type FilmSubmissionInput = Omit<typeof filmSubmissions.$inferInsert, "id" | "status" | "createdAt">;

export async function createFilmSubmission(input: FilmSubmissionInput): Promise<string> {
  const id = randomUUID();
  await db.insert(filmSubmissions).values({ id, ...input, status: "pending" });
  return id;
}

export async function getPendingFilmSubmissions(): Promise<FilmSubmission[]> {
  return db.select().from(filmSubmissions).where(eq(filmSubmissions.status, "pending"));
}

export async function getFilmSubmission(id: string): Promise<FilmSubmission | undefined> {
  const [row] = await db.select().from(filmSubmissions).where(eq(filmSubmissions.id, id));
  return row;
}

export async function updateFilmSubmission(id: string, input: FilmSubmissionInput): Promise<void> {
  await db.update(filmSubmissions).set(input).where(eq(filmSubmissions.id, id));
}

export async function acceptFilmSubmission(id: string, identity?: { id: string; isStudio: boolean }): Promise<void> {
  const submission = await getFilmSubmission(id);
  if (!submission) return;

  const resolvedArtistId = identity ? (identity.isStudio ? null : identity.id) : submission.artistId;
  const resolvedStudioId = identity ? (identity.isStudio ? identity.id : null) : submission.studioId;
  if (!resolvedArtistId && !resolvedStudioId) return;

  await createFilm({
    title: submission.title,
    synopsis: submission.synopsis,
    year: submission.year,
    durationMinutes: submission.durationMinutes,
    rating: submission.rating,
    category: submission.category,
    artistId: resolvedArtistId,
    studioId: resolvedStudioId,
    isNew: true,
    poster: submission.poster,
    videoUrl: submission.videoUrl,
    seriesTitle: submission.seriesTitle,
    seasonNumber: submission.seasonNumber,
    episodeNumber: submission.episodeNumber,
  });

  await db.update(filmSubmissions).set({ status: "accepted" }).where(eq(filmSubmissions.id, id));

  if (submission.userId) {
    await createNotification(
      submission.userId,
      "film_submission_accepted",
      `Ton film "${submission.title}" a été accepté et ajouté au catalogue.`,
      "/profil"
    );
  }
}

export async function refuseFilmSubmission(id: string): Promise<void> {
  const submission = await getFilmSubmission(id);
  await db.update(filmSubmissions).set({ status: "refused" }).where(eq(filmSubmissions.id, id));

  if (submission?.userId) {
    await createNotification(
      submission.userId,
      "film_submission_refused",
      `Ta soumission "${submission.title}" a été refusée.`,
      "/profil"
    );
  }
}

export async function getPendingFilmSubmissionsByUser(userId: string): Promise<FilmSubmission[]> {
  return db
    .select()
    .from(filmSubmissions)
    .where(and(eq(filmSubmissions.userId, userId), eq(filmSubmissions.status, "pending")));
}

export type ArtistSubmission = typeof artistSubmissions.$inferSelect;
export type ArtistSubmissionInput = Omit<typeof artistSubmissions.$inferInsert, "id" | "status" | "createdAt">;

export async function createArtistSubmission(input: ArtistSubmissionInput): Promise<string> {
  const id = randomUUID();
  await db.insert(artistSubmissions).values({ id, ...input, status: "pending" });
  return id;
}

export async function getPendingArtistSubmissions(): Promise<ArtistSubmission[]> {
  return db.select().from(artistSubmissions).where(eq(artistSubmissions.status, "pending"));
}

export async function getArtistSubmission(id: string): Promise<ArtistSubmission | undefined> {
  const [row] = await db.select().from(artistSubmissions).where(eq(artistSubmissions.id, id));
  return row;
}

export async function updateArtistSubmission(id: string, input: ArtistSubmissionInput): Promise<void> {
  await db.update(artistSubmissions).set(input).where(eq(artistSubmissions.id, id));
}

export async function acceptArtistSubmission(id: string): Promise<void> {
  const submission = await getArtistSubmission(id);
  if (!submission) return;

  await createArtist(
    {
      name: submission.name,
      bio: submission.bio,
      avatar: submission.avatar || placeholderAvatar(Date.now() % 6, submission.name),
    },
    submission.userId
  );

  await db.update(artistSubmissions).set({ status: "accepted" }).where(eq(artistSubmissions.id, id));

  if (submission.userId) {
    await createNotification(
      submission.userId,
      "artist_submission_accepted",
      `Ta demande pour devenir artiste a été acceptée !`,
      "/profil"
    );
  }
}

export async function refuseArtistSubmission(id: string): Promise<void> {
  const submission = await getArtistSubmission(id);
  await db.update(artistSubmissions).set({ status: "refused" }).where(eq(artistSubmissions.id, id));

  if (submission?.userId) {
    await createNotification(
      submission.userId,
      "artist_submission_refused",
      `Ta demande pour devenir artiste a été refusée.`,
      "/profil"
    );
  }
}

export async function getPendingArtistSubmissionsByUser(userId: string): Promise<ArtistSubmission[]> {
  return db
    .select()
    .from(artistSubmissions)
    .where(and(eq(artistSubmissions.userId, userId), eq(artistSubmissions.status, "pending")));
}

export async function getFavoriteFilmIds(userId: string): Promise<Set<string>> {
  const rows = await db.select({ filmId: favorites.filmId }).from(favorites).where(eq(favorites.userId, userId));
  return new Set(rows.map((r) => r.filmId));
}

export async function isFilmFavorite(userId: string, filmId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.filmId, filmId)));
  return !!row;
}

export async function toggleFavorite(userId: string, filmId: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.filmId, filmId)));

  if (existing) {
    await db.delete(favorites).where(eq(favorites.id, existing.id));
    return false;
  }

  await db.insert(favorites).values({ id: randomUUID(), userId, filmId });
  return true;
}

export async function getFavoriteFilms(userId: string): Promise<Film[]> {
  const rows = await filmsQuery().innerJoin(favorites, eq(favorites.filmId, films.id)).where(eq(favorites.userId, userId));
  return attachRatingSummaries(rows.map(mapFilm));
}

export async function markWatched(userId: string, filmId: string): Promise<void> {
  const [existing] = await db
    .select({ id: watchHistory.id })
    .from(watchHistory)
    .where(and(eq(watchHistory.userId, userId), eq(watchHistory.filmId, filmId)));

  if (existing) {
    await db.update(watchHistory).set({ watchedAt: new Date().toISOString() }).where(eq(watchHistory.id, existing.id));
  } else {
    await db.insert(watchHistory).values({ id: randomUUID(), userId, filmId });
  }
}

export async function getFilmEngagement(filmIds: string[]): Promise<Map<string, { views: number; comments: number }>> {
  const map = new Map<string, { views: number; comments: number }>();
  if (filmIds.length === 0) return map;

  const [viewRows, commentRows] = await Promise.all([
    db.select({ filmId: watchHistory.filmId }).from(watchHistory).where(inArray(watchHistory.filmId, filmIds)),
    db.select({ filmId: comments.filmId }).from(comments).where(inArray(comments.filmId, filmIds)),
  ]);

  for (const id of filmIds) map.set(id, { views: 0, comments: 0 });
  for (const r of viewRows) map.get(r.filmId)!.views += 1;
  for (const r of commentRows) map.get(r.filmId)!.comments += 1;
  return map;
}

export async function getWatchedFilmIds(userId: string): Promise<Set<string>> {
  const rows = await db.select({ filmId: watchHistory.filmId }).from(watchHistory).where(eq(watchHistory.userId, userId));
  return new Set(rows.map((r) => r.filmId));
}

export async function getWatchHistory(userId: string): Promise<(Film & { watchedAt: string })[]> {
  const rows = await db
    .select({ ...filmSelection, watchedAt: watchHistory.watchedAt })
    .from(films)
    .leftJoin(artists, eq(films.artistId, artists.id))
    .leftJoin(studios, eq(films.studioId, studios.id))
    .innerJoin(watchHistory, eq(watchHistory.filmId, films.id))
    .where(eq(watchHistory.userId, userId))
    .orderBy(desc(watchHistory.watchedAt));
  const withRatings = await attachRatingSummaries(rows.map(mapFilm));
  return withRatings.map((f, i) => ({ ...f, watchedAt: rows[i].watchedAt }));
}

export type ContactMessage = typeof contactMessages.$inferSelect;

export async function createContactMessage(input: {
  userId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<string> {
  const id = randomUUID();
  await db.insert(contactMessages).values({ id, ...input, status: "open" });
  return id;
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
}

export async function getContactMessagesByUser(userId: string): Promise<ContactMessage[]> {
  return db
    .select()
    .from(contactMessages)
    .where(eq(contactMessages.userId, userId))
    .orderBy(desc(contactMessages.createdAt));
}

export async function replyToContactMessage(id: string, reply: string): Promise<void> {
  await db
    .update(contactMessages)
    .set({ adminReply: reply, repliedAt: new Date().toISOString(), status: "replied" })
    .where(eq(contactMessages.id, id));

  const [message] = await db.select({ userId: contactMessages.userId, subject: contactMessages.subject }).from(contactMessages).where(eq(contactMessages.id, id));
  if (message) {
    await createNotification(
      message.userId,
      "message_reply",
      `L'équipe a répondu à ton message "${message.subject}".`,
      "/profil"
    );
  }
}

export async function getArtistByUserId(userId: string): Promise<Artist | undefined> {
  const [row] = await db.select().from(artists).where(eq(artists.userId, userId));
  if (!row) return undefined;
  return { id: row.id, name: row.name, bio: row.bio, avatar: row.avatar, isStudio: false };
}

export async function getStudiosOwnedBy(userId: string): Promise<Artist[]> {
  const rows = await db.select().from(studios).where(eq(studios.ownerId, userId));
  return rows.map((s) => ({ id: s.id, name: s.name, bio: s.bio, avatar: s.avatar, isStudio: true }));
}

export async function getActiveStudioMemberships(userId: string): Promise<Artist[]> {
  const rows = await db
    .select({ id: studios.id, name: studios.name, bio: studios.bio, avatar: studios.avatar })
    .from(studioMembers)
    .innerJoin(studios, eq(studioMembers.studioId, studios.id))
    .where(and(eq(studioMembers.userId, userId), eq(studioMembers.status, "active")));
  return rows.map((s) => ({ ...s, isStudio: true }));
}

export type StudioMembership = { membershipId: string; studio: Artist };

export async function getActiveStudioMembershipsDetailed(userId: string): Promise<StudioMembership[]> {
  const rows = await db
    .select({
      membershipId: studioMembers.id,
      id: studios.id,
      name: studios.name,
      bio: studios.bio,
      avatar: studios.avatar,
    })
    .from(studioMembers)
    .innerJoin(studios, eq(studioMembers.studioId, studios.id))
    .where(and(eq(studioMembers.userId, userId), eq(studioMembers.status, "active")));

  return rows.map((r) => ({
    membershipId: r.membershipId,
    studio: { id: r.id, name: r.name, bio: r.bio, avatar: r.avatar, isStudio: true },
  }));
}

export async function getUserIdentities(userId: string): Promise<Artist[]> {
  const personal = await getArtistByUserId(userId);
  const owned = await getStudiosOwnedBy(userId);
  const memberOf = await getActiveStudioMemberships(userId);
  const all = [...(personal ? [personal] : []), ...owned, ...memberOf];
  const seen = new Set<string>();
  return all.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
}

export async function createStudio(ownerId: string, input: ArtistInput): Promise<string> {
  const id = randomUUID();
  await db.insert(studios).values({ id, ...input, ownerId });
  return id;
}

export async function getInvitableArtists(excludeUserId: string): Promise<Artist[]> {
  const rows = await db.select().from(artists);
  return rows
    .filter((a) => a.userId && a.userId !== excludeUserId)
    .map((a) => ({ id: a.id, name: a.name, bio: a.bio, avatar: a.avatar, isStudio: false }));
}

export type StudioMember = typeof studioMembers.$inferSelect;

export async function inviteToStudio(studioId: string, artistId: string): Promise<void> {
  const [artist] = await db.select({ userId: artists.userId }).from(artists).where(eq(artists.id, artistId));
  if (!artist?.userId) throw new Error("Cet artiste n'est lié à aucun compte.");

  const [existing] = await db
    .select({ id: studioMembers.id })
    .from(studioMembers)
    .where(and(eq(studioMembers.studioId, studioId), eq(studioMembers.userId, artist.userId)));
  if (existing) return;

  await db.insert(studioMembers).values({ id: randomUUID(), studioId, userId: artist.userId, status: "invited" });

  const [studio] = await db.select({ name: studios.name }).from(studios).where(eq(studios.id, studioId));
  if (studio) {
    await createNotification(
      artist.userId,
      "studio_invite",
      `Tu as été invité à rejoindre le studio "${studio.name}".`,
      "/profil"
    );
  }
}

export async function getPendingStudioInvites(userId: string): Promise<(StudioMember & { studioName: string })[]> {
  return db
    .select({
      id: studioMembers.id,
      studioId: studioMembers.studioId,
      userId: studioMembers.userId,
      status: studioMembers.status,
      createdAt: studioMembers.createdAt,
      studioName: studios.name,
    })
    .from(studioMembers)
    .innerJoin(studios, eq(studioMembers.studioId, studios.id))
    .where(and(eq(studioMembers.userId, userId), eq(studioMembers.status, "invited")));
}

export async function respondToStudioInvite(memberId: string, userId: string, accept: boolean): Promise<void> {
  const [row] = await db.select().from(studioMembers).where(eq(studioMembers.id, memberId));
  if (!row || row.userId !== userId) return;

  if (accept) {
    await db.update(studioMembers).set({ status: "active" }).where(eq(studioMembers.id, memberId));
  } else {
    await db.delete(studioMembers).where(eq(studioMembers.id, memberId));
  }

  const [studio] = await db.select({ name: studios.name, ownerId: studios.ownerId }).from(studios).where(eq(studios.id, row.studioId));
  const [user] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId));
  if (studio?.ownerId && user) {
    await createNotification(
      studio.ownerId,
      "studio_invite_response",
      accept
        ? `${user.name} a rejoint le studio "${studio.name}".`
        : `${user.name} a refusé de rejoindre le studio "${studio.name}".`,
      "/profil"
    );
  }
}

export type StudioMemberInfo = { id: string; name: string; email: string; status: string };

export async function getStudioMembers(studioId: string): Promise<StudioMemberInfo[]> {
  const rows = await db
    .select({
      id: studioMembers.id,
      status: studioMembers.status,
      userName: users.name,
      userEmail: users.email,
      artistName: artists.name,
    })
    .from(studioMembers)
    .innerJoin(users, eq(studioMembers.userId, users.id))
    .leftJoin(artists, eq(artists.userId, studioMembers.userId))
    .where(eq(studioMembers.studioId, studioId));
  return rows.map((r) => ({ id: r.id, name: r.artistName ?? r.userName, email: r.userEmail, status: r.status }));
}

export async function getStudioTeamDisplay(
  studioId: string
): Promise<{ name: string; isOwner: boolean; artistId: string | null }[]> {
  const [studio] = await db.select({ ownerId: studios.ownerId }).from(studios).where(eq(studios.id, studioId));

  const result: { name: string; isOwner: boolean; artistId: string | null }[] = [];

  if (studio?.ownerId) {
    const [ownerRow] = await db
      .select({ userName: users.name, artistId: artists.id, artistName: artists.name })
      .from(users)
      .leftJoin(artists, eq(artists.userId, users.id))
      .where(eq(users.id, studio.ownerId));
    if (ownerRow) {
      result.push({ name: ownerRow.artistName ?? ownerRow.userName, isOwner: true, artistId: ownerRow.artistId ?? null });
    }
  }

  const memberRows = await db
    .select({ userName: users.name, artistId: artists.id, artistName: artists.name })
    .from(studioMembers)
    .innerJoin(users, eq(studioMembers.userId, users.id))
    .leftJoin(artists, eq(artists.userId, studioMembers.userId))
    .where(and(eq(studioMembers.studioId, studioId), eq(studioMembers.status, "active")));

  for (const r of memberRows) {
    result.push({ name: r.artistName ?? r.userName, isOwner: false, artistId: r.artistId ?? null });
  }

  return result;
}

export async function removeStudioMembership(memberRowId: string, requesterUserId: string): Promise<void> {
  const [row] = await db.select().from(studioMembers).where(eq(studioMembers.id, memberRowId));
  if (!row) return;

  const isSelf = row.userId === requesterUserId;
  const [studio] = await db.select({ ownerId: studios.ownerId }).from(studios).where(eq(studios.id, row.studioId));
  const isOwner = studio?.ownerId === requesterUserId;

  if (!isSelf && !isOwner) throw new Error("Non autorisé.");

  await db.delete(studioMembers).where(eq(studioMembers.id, memberRowId));
}

export async function deleteStudio(studioId: string, requesterUserId: string): Promise<void> {
  const [studio] = await db.select().from(studios).where(eq(studios.id, studioId));
  if (!studio) throw new Error("Studio introuvable.");
  if (studio.ownerId !== requesterUserId) throw new Error("Non autorisé.");

  const [filmRow] = await db.select({ id: films.id }).from(films).where(eq(films.studioId, studioId));
  if (filmRow) throw new Error("Impossible de supprimer un studio qui a des films au catalogue.");

  await db.delete(studios).where(eq(studios.id, studioId));
}

export async function upsertRating(userId: string, filmId: string, value: number): Promise<void> {
  const [existing] = await db
    .select({ id: filmRatings.id })
    .from(filmRatings)
    .where(and(eq(filmRatings.userId, userId), eq(filmRatings.filmId, filmId)));

  if (existing) {
    await db.update(filmRatings).set({ value }).where(eq(filmRatings.id, existing.id));
  } else {
    await db.insert(filmRatings).values({ id: randomUUID(), userId, filmId, value });
  }
}

export async function getUserRating(userId: string, filmId: string): Promise<number | null> {
  const [row] = await db
    .select({ value: filmRatings.value })
    .from(filmRatings)
    .where(and(eq(filmRatings.userId, userId), eq(filmRatings.filmId, filmId)));
  return row?.value ?? null;
}

export type Comment = {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  body: string;
  createdAt: string;
  parentId: string | null;
  upCount: number;
  downCount: number;
  myReaction: "up" | "down" | null;
};

export async function getFilmComments(filmId: string, currentUserId?: string): Promise<Comment[]> {
  const rows = await db
    .select({
      id: comments.id,
      userId: comments.userId,
      userName: users.name,
      userAvatarUrl: users.avatarUrl,
      body: comments.body,
      createdAt: comments.createdAt,
      parentId: comments.parentId,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.filmId, filmId))
    .orderBy(desc(comments.createdAt));

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const reactionRows = await db
    .select({ commentId: commentReactions.commentId, type: commentReactions.type, userId: commentReactions.userId })
    .from(commentReactions)
    .where(inArray(commentReactions.commentId, ids));

  const summaries = new Map<string, { up: number; down: number; mine: "up" | "down" | null }>();
  for (const r of reactionRows) {
    const entry = summaries.get(r.commentId) ?? { up: 0, down: 0, mine: null };
    if (r.type === "up") entry.up += 1;
    else entry.down += 1;
    if (currentUserId && r.userId === currentUserId) entry.mine = r.type as "up" | "down";
    summaries.set(r.commentId, entry);
  }

  return rows.map((r) => {
    const s = summaries.get(r.id) ?? { up: 0, down: 0, mine: null };
    return { ...r, upCount: s.up, downCount: s.down, myReaction: s.mine };
  });
}

export async function addComment(
  userId: string,
  filmId: string,
  body: string,
  parentId?: string | null
): Promise<void> {
  await db.insert(comments).values({ id: randomUUID(), userId, filmId, body, parentId: parentId ?? null });

  const [author] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId));
  const [film] = await db.select({ title: films.title }).from(films).where(eq(films.id, filmId));
  const authorName = author?.name ?? "Quelqu'un";
  const link = `/watch/${filmId}`;

  if (parentId) {
    const [parent] = await db.select({ userId: comments.userId }).from(comments).where(eq(comments.id, parentId));
    if (parent && parent.userId !== userId) {
      await createNotification(parent.userId, "comment_reply", `${authorName} a répondu à ton commentaire.`, link);
    }
  } else if (film) {
    const creatorIds = await getFilmCreatorUserIds(filmId);
    for (const creatorId of creatorIds) {
      if (creatorId === userId) continue;
      await createNotification(creatorId, "new_comment", `${authorName} a commenté "${film.title}".`, link);
    }
  }
}

export async function deleteComment(commentId: string, userId: string, isAdmin: boolean): Promise<void> {
  const [row] = await db.select({ userId: comments.userId }).from(comments).where(eq(comments.id, commentId));
  if (!row) return;
  if (row.userId !== userId && !isAdmin) throw new Error("Non autorisé.");
  await db.delete(comments).where(eq(comments.id, commentId));
}

export async function toggleCommentReaction(userId: string, commentId: string, type: "up" | "down"): Promise<void> {
  const [existing] = await db
    .select()
    .from(commentReactions)
    .where(and(eq(commentReactions.commentId, commentId), eq(commentReactions.userId, userId)));

  if (existing) {
    if (existing.type === type) {
      await db.delete(commentReactions).where(eq(commentReactions.id, existing.id));
    } else {
      await db.update(commentReactions).set({ type }).where(eq(commentReactions.id, existing.id));
    }
  } else {
    await db.insert(commentReactions).values({ id: randomUUID(), commentId, userId, type });
  }
}

export type AdminComment = {
  id: string;
  userId: string;
  userName: string;
  body: string;
  createdAt: string;
  parentId: string | null;
  filmTitle: string;
  upCount: number;
  downCount: number;
};

export async function getAllCommentsWithStats(): Promise<AdminComment[]> {
  const rows = await db
    .select({
      id: comments.id,
      userId: comments.userId,
      userName: users.name,
      body: comments.body,
      createdAt: comments.createdAt,
      parentId: comments.parentId,
      filmTitle: films.title,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .innerJoin(films, eq(comments.filmId, films.id))
    .orderBy(desc(comments.createdAt));

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const reactionRows = await db
    .select({ commentId: commentReactions.commentId, type: commentReactions.type })
    .from(commentReactions)
    .where(inArray(commentReactions.commentId, ids));

  const counts = new Map<string, { up: number; down: number }>();
  for (const r of reactionRows) {
    const entry = counts.get(r.commentId) ?? { up: 0, down: 0 };
    if (r.type === "up") entry.up += 1;
    else entry.down += 1;
    counts.set(r.commentId, entry);
  }

  return rows.map((r) => {
    const c = counts.get(r.id) ?? { up: 0, down: 0 };
    return { ...r, upCount: c.up, downCount: c.down };
  });
}

export async function getFilmCreatorUserIds(filmId: string): Promise<string[]> {
  const [film] = await db.select({ artistId: films.artistId, studioId: films.studioId }).from(films).where(eq(films.id, filmId));
  if (!film) return [];

  if (film.artistId) {
    const [artist] = await db.select({ userId: artists.userId }).from(artists).where(eq(artists.id, film.artistId));
    return artist?.userId ? [artist.userId] : [];
  }

  if (!film.studioId) return [];

  const [studio] = await db.select({ ownerId: studios.ownerId }).from(studios).where(eq(studios.id, film.studioId));
  const ids = new Set<string>();
  if (studio?.ownerId) ids.add(studio.ownerId);

  const members = await db
    .select({ userId: studioMembers.userId })
    .from(studioMembers)
    .where(and(eq(studioMembers.studioId, film.studioId), eq(studioMembers.status, "active")));
  for (const m of members) ids.add(m.userId);

  return [...ids];
}

export type AdminStudio = Artist & {
  ownerName: string | null;
  ownerEmail: string | null;
  memberCount: number;
  filmCount: number;
};

export async function getAllStudiosWithDetails(): Promise<AdminStudio[]> {
  const studioList = await getStudios();
  if (studioList.length === 0) return [];

  const ids = studioList.map((s) => s.id);

  const owners = await db
    .select({ id: studios.id, ownerName: users.name, ownerEmail: users.email })
    .from(studios)
    .leftJoin(users, eq(studios.ownerId, users.id))
    .where(inArray(studios.id, ids));
  const ownerMap = new Map(owners.map((o) => [o.id, o]));

  const memberRows = await db
    .select({ studioId: studioMembers.studioId })
    .from(studioMembers)
    .where(and(inArray(studioMembers.studioId, ids), eq(studioMembers.status, "active")));
  const memberCounts = new Map<string, number>();
  for (const m of memberRows) memberCounts.set(m.studioId, (memberCounts.get(m.studioId) ?? 0) + 1);

  const filmRows = await db.select({ studioId: films.studioId }).from(films).where(inArray(films.studioId, ids));
  const filmCounts = new Map<string, number>();
  for (const f of filmRows) {
    if (!f.studioId) continue;
    filmCounts.set(f.studioId, (filmCounts.get(f.studioId) ?? 0) + 1);
  }

  return studioList.map((s) => ({
    ...s,
    ownerName: ownerMap.get(s.id)?.ownerName ?? null,
    ownerEmail: ownerMap.get(s.id)?.ownerEmail ?? null,
    memberCount: memberCounts.get(s.id) ?? 0,
    filmCount: filmCounts.get(s.id) ?? 0,
  }));
}

export async function adminDeleteStudio(studioId: string): Promise<void> {
  await db.delete(studios).where(eq(studios.id, studioId));
}

export async function adminRemoveStudioMember(memberRowId: string): Promise<void> {
  await db.delete(studioMembers).where(eq(studioMembers.id, memberRowId));
}

export type Notification = typeof notifications.$inferSelect;

export async function createNotification(
  userId: string,
  type: string,
  message: string,
  link?: string | null
): Promise<void> {
  await db.insert(notifications).values({ id: randomUUID(), userId, type, message, link: link ?? null });
}

export async function getNotifications(userId: string, limit = 30): Promise<Notification[]> {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const rows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  return rows.length;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await db.update(notifications).set({ read: true }).where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
}

export type DashboardStats = {
  filmCount: number;
  artistCount: number;
  studioCount: number;
  userCount: number;
  pendingCount: number;
  openMessageCount: number;
  totalViews: number;
  totalFavorites: number;
  ratingCount: number;
  averageRating: number | null;
  commentCount: number;
  reactionUpCount: number;
  reactionDownCount: number;
  pendingInviteCount: number;
  topViewedFilms: { id: string; title: string; views: number }[];
  topRatedFilms: { id: string; title: string; average: number; count: number }[];
  topArtists: { id: string; name: string; filmCount: number }[];
  newUsers7d: number;
  newUsers30d: number;
  newFilms7d: number;
  newFilms30d: number;
  filmSubmissionsAccepted: number;
  filmSubmissionsRefused: number;
  filmSubmissionsPending: number;
  artistSubmissionsAccepted: number;
  artistSubmissionsRefused: number;
  artistSubmissionsPending: number;
  categoryBreakdown: { category: string; count: number }[];
  recentFilms: { id: string; title: string; artistName: string; createdAt: string }[];
  recentComments: { id: string; userName: string; filmTitle: string; body: string; createdAt: string }[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    filmRows,
    artistRows,
    studioRows,
    userRows,
    filmSubs,
    artistSubs,
    messages,
    watchRows,
    favoriteRows,
    ratingRows,
    commentRows,
    reactionRows,
    inviteRows,
    allFilmSubs,
    allArtistSubs,
    recentCommentRows,
  ] = await Promise.all([
    db
      .select({
        id: films.id,
        title: films.title,
        artistId: films.artistId,
        studioId: films.studioId,
        createdAt: films.createdAt,
        category: films.category,
      })
      .from(films),
    db.select({ id: artists.id, name: artists.name }).from(artists),
    db.select({ id: studios.id, name: studios.name }).from(studios),
    db.select({ id: users.id, createdAt: users.createdAt }).from(users),
    getPendingFilmSubmissions(),
    getPendingArtistSubmissions(),
    getContactMessages(),
    db.select({ filmId: watchHistory.filmId }).from(watchHistory),
    db.select({ filmId: favorites.filmId }).from(favorites),
    db.select({ filmId: filmRatings.filmId, value: filmRatings.value }).from(filmRatings),
    db.select({ id: comments.id }).from(comments),
    db.select({ type: commentReactions.type }).from(commentReactions),
    db.select({ id: studioMembers.id }).from(studioMembers).where(eq(studioMembers.status, "invited")),
    db.select({ status: filmSubmissions.status }).from(filmSubmissions),
    db.select({ status: artistSubmissions.status }).from(artistSubmissions),
    db
      .select({
        id: comments.id,
        userName: users.name,
        filmTitle: films.title,
        body: comments.body,
        createdAt: comments.createdAt,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .innerJoin(films, eq(comments.filmId, films.id))
      .orderBy(desc(comments.createdAt))
      .limit(5),
  ]);

  const filmMap = new Map(filmRows.map((f) => [f.id, f]));
  const creatorMap = new Map<string, { name: string; isStudio: boolean }>([
    ...artistRows.map((a): [string, { name: string; isStudio: boolean }] => [a.id, { name: a.name, isStudio: false }]),
    ...studioRows.map((s): [string, { name: string; isStudio: boolean }] => [s.id, { name: s.name, isStudio: true }]),
  ]);
  const creatorIdOf = (f: { artistId: string | null; studioId: string | null }) => f.artistId ?? f.studioId ?? "";

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const since = (days: number) => now - days * DAY;
  const newUsers7d = userRows.filter((u) => new Date(u.createdAt).getTime() >= since(7)).length;
  const newUsers30d = userRows.filter((u) => new Date(u.createdAt).getTime() >= since(30)).length;
  const newFilms7d = filmRows.filter((f) => new Date(f.createdAt).getTime() >= since(7)).length;
  const newFilms30d = filmRows.filter((f) => new Date(f.createdAt).getTime() >= since(30)).length;

  const categoryCounts = new Map<string, number>();
  for (const f of filmRows) categoryCounts.set(f.category, (categoryCounts.get(f.category) ?? 0) + 1);
  const categoryBreakdown = [...categoryCounts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  const recentFilms = [...filmRows]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((f) => ({
      id: f.id,
      title: f.title,
      artistName: creatorMap.get(creatorIdOf(f))?.name ?? "?",
      createdAt: f.createdAt,
    }));

  const viewsByFilm = new Map<string, number>();
  for (const w of watchRows) viewsByFilm.set(w.filmId, (viewsByFilm.get(w.filmId) ?? 0) + 1);

  const ratingSumByFilm = new Map<string, number>();
  const ratingCountByFilm = new Map<string, number>();
  for (const r of ratingRows) {
    ratingSumByFilm.set(r.filmId, (ratingSumByFilm.get(r.filmId) ?? 0) + r.value);
    ratingCountByFilm.set(r.filmId, (ratingCountByFilm.get(r.filmId) ?? 0) + 1);
  }

  const filmCountByArtist = new Map<string, number>();
  for (const f of filmRows) {
    const cid = creatorIdOf(f);
    filmCountByArtist.set(cid, (filmCountByArtist.get(cid) ?? 0) + 1);
  }

  const topViewedFilms = [...viewsByFilm.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, views]) => ({ id, title: filmMap.get(id)?.title ?? "?", views }));

  const topRatedFilms = [...ratingSumByFilm.entries()]
    .map(([id, sum]) => ({
      id,
      title: filmMap.get(id)?.title ?? "?",
      average: sum / (ratingCountByFilm.get(id) ?? 1),
      count: ratingCountByFilm.get(id) ?? 0,
    }))
    .sort((a, b) => b.average - a.average || b.count - a.count)
    .slice(0, 5);

  const topArtists = [...filmCountByArtist.entries()]
    .filter(([id]) => !creatorMap.get(id)?.isStudio)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, filmCount]) => ({ id, name: creatorMap.get(id)?.name ?? "?", filmCount }));

  const ratingTotal = ratingRows.reduce((sum, r) => sum + r.value, 0);

  return {
    filmCount: filmRows.length,
    artistCount: artistRows.length,
    studioCount: studioRows.length,
    userCount: userRows.length,
    pendingCount: filmSubs.length + artistSubs.length,
    openMessageCount: messages.filter((m) => m.status === "open").length,
    totalViews: watchRows.length,
    totalFavorites: favoriteRows.length,
    ratingCount: ratingRows.length,
    averageRating: ratingRows.length > 0 ? ratingTotal / ratingRows.length : null,
    commentCount: commentRows.length,
    reactionUpCount: reactionRows.filter((r) => r.type === "up").length,
    reactionDownCount: reactionRows.filter((r) => r.type === "down").length,
    pendingInviteCount: inviteRows.length,
    topViewedFilms,
    topRatedFilms,
    topArtists,
    newUsers7d,
    newUsers30d,
    newFilms7d,
    newFilms30d,
    filmSubmissionsAccepted: allFilmSubs.filter((s) => s.status === "accepted").length,
    filmSubmissionsRefused: allFilmSubs.filter((s) => s.status === "refused").length,
    filmSubmissionsPending: allFilmSubs.filter((s) => s.status === "pending").length,
    artistSubmissionsAccepted: allArtistSubs.filter((s) => s.status === "accepted").length,
    artistSubmissionsRefused: allArtistSubs.filter((s) => s.status === "refused").length,
    artistSubmissionsPending: allArtistSubs.filter((s) => s.status === "pending").length,
    categoryBreakdown,
    recentFilms,
    recentComments: recentCommentRows,
  };
}
