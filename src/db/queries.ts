import { randomUUID } from "node:crypto";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { films, artists, users, filmSubmissions, artistSubmissions } from "@/db/schema";
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

export async function createArtist(input: ArtistInput): Promise<string> {
  const id = randomUUID();
  await db.insert(artists).values({ id, ...input });
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

export async function acceptFilmSubmission(id: string, artistId: string): Promise<void> {
  const submission = await getFilmSubmission(id);
  if (!submission) return;

  await createFilm({
    title: submission.title,
    synopsis: submission.synopsis,
    year: submission.year,
    durationMinutes: submission.durationMinutes,
    rating: submission.rating,
    category: submission.category,
    artistId,
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

  await createArtist({
    name: submission.name,
    bio: submission.bio,
    avatar: submission.avatar || placeholderAvatar(Date.now() % 6, submission.name),
  });

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
