import { randomUUID } from "node:crypto";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  films,
  artists,
  users,
  filmSubmissions,
  artistSubmissions,
  favorites,
  watchHistory,
  contactMessages,
  studioMembers,
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
  artistName: artists.name,
  markedNewAt: films.markedNewAt,
  poster: films.poster,
  videoUrl: films.videoUrl,
};

function filmsQuery() {
  return db.select(filmSelection).from(films).innerJoin(artists, eq(films.artistId, artists.id));
}

type FilmRow = Awaited<ReturnType<typeof filmsQuery>>[number];

function mapFilm(row: FilmRow): Film {
  return {
    id: row.id,
    title: row.title,
    synopsis: row.synopsis,
    year: row.year,
    duration: formatDuration(row.durationMinutes),
    durationMinutes: row.durationMinutes,
    rating: row.rating,
    category: row.category,
    artistId: row.artistId,
    artistName: row.artistName,
    isNew: isNewActive(row.markedNewAt),
    poster: row.poster,
    videoUrl: row.videoUrl,
  };
}

export async function getFilms(): Promise<Film[]> {
  const rows = await filmsQuery();
  return rows.map(mapFilm);
}

export async function getFilm(id: string): Promise<Film | undefined> {
  const [row] = await filmsQuery().where(eq(films.id, id));
  return row ? mapFilm(row) : undefined;
}

export async function getNewFilms(): Promise<Film[]> {
  const rows = await filmsQuery();
  return rows.map(mapFilm).filter((f) => f.isNew);
}

export async function getFilmsByCategory(category: string): Promise<Film[]> {
  const rows = await filmsQuery().where(eq(films.category, category));
  return rows.map(mapFilm);
}

export async function getFilmsByArtist(artistId: string): Promise<Film[]> {
  const rows = await filmsQuery().where(eq(films.artistId, artistId));
  return rows.map(mapFilm);
}

export async function getSuggestions(excludeId: string, limit = 4): Promise<Film[]> {
  const rows = await filmsQuery().where(ne(films.id, excludeId));
  return rows.slice(0, limit).map(mapFilm);
}

export async function getCategories(): Promise<string[]> {
  const rows = await db.selectDistinct({ category: films.category }).from(films);
  return rows.map((r) => r.category);
}

export async function getArtists(): Promise<Artist[]> {
  return db.select().from(artists);
}

export async function getArtist(id: string): Promise<Artist | undefined> {
  const [artist] = await db.select().from(artists).where(eq(artists.id, id));
  return artist;
}

export type FilmInput = {
  title: string;
  synopsis: string;
  year: number;
  durationMinutes: number;
  rating: string;
  category: string;
  artistId: string;
  isNew: boolean;
  poster: string;
  videoUrl: string;
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

export async function updateArtist(id: string, input: ArtistInput): Promise<void> {
  await db.update(artists).set(input).where(eq(artists.id, id));
}

export async function deleteArtist(id: string): Promise<void> {
  await db.delete(artists).where(eq(artists.id, id));
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

export async function acceptFilmSubmission(id: string, artistId?: string): Promise<void> {
  const submission = await getFilmSubmission(id);
  const resolvedArtistId = artistId ?? submission?.artistId;
  if (!submission || !resolvedArtistId) return;

  await createFilm({
    title: submission.title,
    synopsis: submission.synopsis,
    year: submission.year,
    durationMinutes: submission.durationMinutes,
    rating: submission.rating,
    category: submission.category,
    artistId: resolvedArtistId,
    isNew: true,
    poster: submission.poster,
    videoUrl: submission.videoUrl,
  });

  await db.update(filmSubmissions).set({ status: "accepted" }).where(eq(filmSubmissions.id, id));
}

export async function refuseFilmSubmission(id: string): Promise<void> {
  await db.update(filmSubmissions).set({ status: "refused" }).where(eq(filmSubmissions.id, id));
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
}

export async function refuseArtistSubmission(id: string): Promise<void> {
  await db.update(artistSubmissions).set({ status: "refused" }).where(eq(artistSubmissions.id, id));
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
  const rows = await db
    .select(filmSelection)
    .from(films)
    .innerJoin(artists, eq(films.artistId, artists.id))
    .innerJoin(favorites, eq(favorites.filmId, films.id))
    .where(eq(favorites.userId, userId));
  return rows.map(mapFilm);
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

export async function getWatchedFilmIds(userId: string): Promise<Set<string>> {
  const rows = await db.select({ filmId: watchHistory.filmId }).from(watchHistory).where(eq(watchHistory.userId, userId));
  return new Set(rows.map((r) => r.filmId));
}

export async function getWatchHistory(userId: string): Promise<(Film & { watchedAt: string })[]> {
  const rows = await db
    .select({ ...filmSelection, watchedAt: watchHistory.watchedAt })
    .from(films)
    .innerJoin(artists, eq(films.artistId, artists.id))
    .innerJoin(watchHistory, eq(watchHistory.filmId, films.id))
    .where(eq(watchHistory.userId, userId))
    .orderBy(desc(watchHistory.watchedAt));
  return rows.map((r) => ({ ...mapFilm(r), watchedAt: r.watchedAt }));
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
}

export async function getArtistByUserId(userId: string): Promise<Artist | undefined> {
  const [artist] = await db
    .select()
    .from(artists)
    .where(and(eq(artists.userId, userId), eq(artists.isStudio, false)));
  return artist;
}

export async function getStudiosOwnedBy(userId: string): Promise<Artist[]> {
  return db.select().from(artists).where(and(eq(artists.isStudio, true), eq(artists.ownerId, userId)));
}

export async function getActiveStudioMemberships(userId: string): Promise<Artist[]> {
  return db
    .select({
      id: artists.id,
      name: artists.name,
      bio: artists.bio,
      avatar: artists.avatar,
      isStudio: artists.isStudio,
    })
    .from(studioMembers)
    .innerJoin(artists, eq(studioMembers.studioId, artists.id))
    .where(and(eq(studioMembers.userId, userId), eq(studioMembers.status, "active")));
}

export type StudioMembership = { membershipId: string; studio: Artist };

export async function getActiveStudioMembershipsDetailed(userId: string): Promise<StudioMembership[]> {
  const rows = await db
    .select({
      membershipId: studioMembers.id,
      id: artists.id,
      name: artists.name,
      bio: artists.bio,
      avatar: artists.avatar,
      isStudio: artists.isStudio,
    })
    .from(studioMembers)
    .innerJoin(artists, eq(studioMembers.studioId, artists.id))
    .where(and(eq(studioMembers.userId, userId), eq(studioMembers.status, "active")));

  return rows.map((r) => ({
    membershipId: r.membershipId,
    studio: { id: r.id, name: r.name, bio: r.bio, avatar: r.avatar, isStudio: r.isStudio },
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
  await db.insert(artists).values({ id, ...input, isStudio: true, ownerId });
  return id;
}

export async function getInvitableArtists(excludeUserId: string): Promise<Artist[]> {
  const rows = await db.select().from(artists).where(eq(artists.isStudio, false));
  return rows.filter((a) => a.userId && a.userId !== excludeUserId);
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
}

export async function getPendingStudioInvites(userId: string): Promise<(StudioMember & { studioName: string })[]> {
  return db
    .select({
      id: studioMembers.id,
      studioId: studioMembers.studioId,
      userId: studioMembers.userId,
      status: studioMembers.status,
      createdAt: studioMembers.createdAt,
      studioName: artists.name,
    })
    .from(studioMembers)
    .innerJoin(artists, eq(studioMembers.studioId, artists.id))
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
}

export type StudioMemberInfo = { id: string; name: string; email: string; status: string };

export async function getStudioMembers(studioId: string): Promise<StudioMemberInfo[]> {
  const rows = await db
    .select({ id: studioMembers.id, status: studioMembers.status, userName: users.name, userEmail: users.email })
    .from(studioMembers)
    .innerJoin(users, eq(studioMembers.userId, users.id))
    .where(eq(studioMembers.studioId, studioId));
  return rows.map((r) => ({ id: r.id, name: r.userName, email: r.userEmail, status: r.status }));
}

export async function removeStudioMembership(memberRowId: string, requesterUserId: string): Promise<void> {
  const [row] = await db.select().from(studioMembers).where(eq(studioMembers.id, memberRowId));
  if (!row) return;

  const isSelf = row.userId === requesterUserId;
  const [studio] = await db.select({ ownerId: artists.ownerId }).from(artists).where(eq(artists.id, row.studioId));
  const isOwner = studio?.ownerId === requesterUserId;

  if (!isSelf && !isOwner) throw new Error("Non autorisé.");

  await db.delete(studioMembers).where(eq(studioMembers.id, memberRowId));
}

export async function deleteStudio(studioId: string, requesterUserId: string): Promise<void> {
  const [studio] = await db.select().from(artists).where(eq(artists.id, studioId));
  if (!studio || !studio.isStudio) throw new Error("Studio introuvable.");
  if (studio.ownerId !== requesterUserId) throw new Error("Non autorisé.");

  const [filmRow] = await db.select({ id: films.id }).from(films).where(eq(films.artistId, studioId));
  if (filmRow) throw new Error("Impossible de supprimer un studio qui a des films au catalogue.");

  await db.delete(artists).where(eq(artists.id, studioId));
}
