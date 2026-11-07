import { randomUUID } from "node:crypto";
import { and, desc, eq, gt, inArray, ne, or, sql } from "drizzle-orm";
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
  siteSettings,
  banAppeals,
  premiereViewers,
  sessions,
  trailers as trailersTable,
  seriesMeta,
} from "@/db/schema";
import type { Film, Artist, Trailer } from "@/data/types";
import { formatDuration, isNewActive } from "@/lib/format";
import { formatEpisodeTag, isReleased, splitComingSoon } from "@/lib/series";
import { placeholderAvatar } from "@/lib/placeholder";
import { seriesRatingSummary } from "@/lib/series-rating";
import { getPremiereStatus, liveSeconds } from "@/lib/premiere";
import { describeReleaseRequest, parseReleaseRequest, type ReleaseRequest } from "@/lib/release-request";

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
  episodeKind: films.episodeKind,
  teaserVideoUrl: films.teaserVideoUrl,
  premiereAt: films.premiereAt,
  premiereBanner: films.premiereBanner,
  releaseBanner: films.releaseBanner,
  premiereAdUrl: films.premiereAdUrl,
  premiereAdDurationSeconds: films.premiereAdDurationSeconds,
  releaseAt: films.releaseAt,
  videoDurationSeconds: films.videoDurationSeconds,
};

function filmsQuery() {
  return db
    .select(filmSelection)
    .from(films)
    .leftJoin(artists, eq(films.artistId, artists.id))
    .leftJoin(studios, eq(films.studioId, studios.id));
}

type FilmRow = Awaited<ReturnType<typeof filmsQuery>>[number];

// "teaser" is the former name of announcement fiches (teaser episodes and
// "not out yet" teaser films): still read as such until migration 0038.
function toEpisodeKind(value: string | null): Film["episodeKind"] {
  return value === "announcement" || value === "teaser" ? "announcement" : "episode";
}

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
    episodeAvgRating: null,
    episodeRatingCount: 0,
    seriesTitle: row.seriesTitle,
    seasonNumber: row.seasonNumber,
    episodeNumber: row.episodeNumber,
    episodeKind: toEpisodeKind(row.episodeKind),
    teaserVideoUrl: row.teaserVideoUrl,
    trailers: [],
    seriesSynopsis: null,
    premiereAt: row.premiereAt,
    premiereBanner: row.premiereBanner,
    releaseBanner: row.releaseBanner,
    premiereAdUrl: row.premiereAdUrl,
    premiereAdDurationSeconds: row.premiereAdDurationSeconds,
    releaseAt: row.releaseAt,
    videoDurationSeconds: row.videoDurationSeconds,
  };
}

async function attachRatingSummaries(filmsList: Film[]): Promise<Film[]> {
  if (filmsList.length === 0) return filmsList;
  const seriesTitles = [...new Set(filmsList.filter((f) => f.seriesTitle).map((f) => f.seriesTitle!))];
  const episodeIdsBySeries = await getSeriesEpisodeIds(seriesTitles);

  const ids = [...new Set([...filmsList.map((f) => f.id), ...[...episodeIdsBySeries.values()].flat()])];
  const rows = await db
    .select({ userId: filmRatings.userId, filmId: filmRatings.filmId, value: filmRatings.value })
    .from(filmRatings)
    .where(inArray(filmRatings.filmId, ids));

  const rowsByFilm = new Map<string, typeof rows>();
  for (const r of rows) {
    const arr = rowsByFilm.get(r.filmId) ?? [];
    arr.push(r);
    rowsByFilm.set(r.filmId, arr);
  }
  const ownSummary = (id: string) => {
    const list = rowsByFilm.get(id) ?? [];
    if (list.length === 0) return null;
    return { avg: list.reduce((sum, r) => sum + r.value, 0) / list.length, count: list.length };
  };
  const seriesSummaries = new Map(
    [...episodeIdsBySeries.entries()].map(([title, epIds]) => [
      title,
      seriesRatingSummary(epIds.flatMap((id) => rowsByFilm.get(id) ?? [])),
    ])
  );

  const [trailerLists, synopses] = await Promise.all([
    getTrailers(
      seriesTitles,
      filmsList.filter((f) => !f.seriesTitle).map((f) => f.id)
    ),
    getSeriesSynopses(seriesTitles),
  ]);
  return filmsList.map((f) => {
    const own = ownSummary(f.id);
    const content = f.seriesTitle ? seriesSummaries.get(f.seriesTitle) ?? null : own;
    return {
      ...f,
      avgRating: content?.avg ?? null,
      ratingCount: content?.count ?? 0,
      episodeAvgRating: own?.avg ?? null,
      episodeRatingCount: own?.count ?? 0,
      trailers: trailersFor(f, trailerLists),
      seriesSynopsis: f.seriesTitle ? synopses.get(f.seriesTitle) ?? null : null,
    };
  });
}

// The trailers table arrives with migration 0036. Until a database has it,
// reads fall back to the legacy single `teaser_video_url` of films (and no
// series trailers) instead of breaking every page, so the code can be
// deployed before the migration is run.
function isMissingTable(e: unknown): boolean {
  const message = e instanceof Error ? `${e.message} ${e.cause instanceof Error ? e.cause.message : ""}` : String(e);
  return /no such table/i.test(message);
}

const MIGRATION_NEEDED = "La table trailers n'existe pas encore : lance la migration 0036 (scripts/apply-0036.ts).";

type TrailerLists = { bySeries: Map<string, Trailer[]>; byFilm: Map<string, Trailer[]> };

export async function getTrailers(seriesTitles: string[], filmIds: string[]): Promise<TrailerLists> {
  const lists: TrailerLists = { bySeries: new Map(), byFilm: new Map() };
  if (seriesTitles.length === 0 && filmIds.length === 0) return lists;
  try {
    const conditions = [
      ...(seriesTitles.length ? [inArray(trailersTable.seriesTitle, seriesTitles)] : []),
      ...(filmIds.length ? [inArray(trailersTable.filmId, filmIds)] : []),
    ];
    const rows = await db
      .select()
      .from(trailersTable)
      .where(conditions.length === 1 ? conditions[0] : or(...conditions))
      .orderBy(trailersTable.position, trailersTable.createdAt);
    const views = await getTrailerViews(rows.map((r) => r.id));
    for (const r of rows) {
      const trailer = { id: r.id, title: r.title, videoUrl: r.videoUrl, views: views.get(r.id) ?? 0 };
      if (r.seriesTitle) lists.bySeries.set(r.seriesTitle, [...(lists.bySeries.get(r.seriesTitle) ?? []), trailer]);
      else if (r.filmId) lists.byFilm.set(r.filmId, [...(lists.byFilm.get(r.filmId) ?? []), trailer]);
    }
  } catch (e) {
    if (!isMissingTable(e)) throw e;
  }
  return lists;
}

// Trailer plays are counted apart from the content's own views. The column
// comes with migration 0041: until then every trailer reads as 0 views.
function isMissingColumn(e: unknown): boolean {
  const message = e instanceof Error ? `${e.message} ${e.cause instanceof Error ? e.cause.message : ""}` : String(e);
  return /no such column/i.test(message);
}

async function getTrailerViews(ids: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (ids.length === 0) return map;
  try {
    const rows = await db.all<{ id: string; views: number }>(
      sql`SELECT id, views FROM trailers WHERE id IN (${sql.join(
        ids.map((id) => sql`${id}`),
        sql`, `
      )})`
    );
    for (const r of rows) map.set(r.id, r.views ?? 0);
  } catch (e) {
    if (!isMissingColumn(e) && !isMissingTable(e)) throw e;
  }
  return map;
}

export async function incrementTrailerView(id: string): Promise<void> {
  if (id === LEGACY_TRAILER_ID) return;
  try {
    await db.run(sql`UPDATE trailers SET views = views + 1 WHERE id = ${id}`);
  } catch (e) {
    if (!isMissingColumn(e) && !isMissingTable(e)) throw e;
  }
}

// Legacy single trailer of a film, used until it is moved to the trailers table.
export const LEGACY_TRAILER_ID = "legacy";

function trailersFor(f: Film, lists: TrailerLists): Trailer[] {
  const own = f.seriesTitle ? lists.bySeries.get(f.seriesTitle) : lists.byFilm.get(f.id);
  if (own?.length) return own;
  // Not migrated yet: a film's legacy single trailer, or the video of an
  // announcement fiche (formerly a teaser, its video is the trailer).
  const legacy = f.episodeKind === "announcement" ? f.teaserVideoUrl || f.videoUrl : f.seriesTitle ? null : f.teaserVideoUrl;
  return legacy ? [{ id: LEGACY_TRAILER_ID, title: "Bande-annonce", videoUrl: legacy, views: 0 }] : [];
}

export type TrailerInput = { title: string; videoUrl: string };
export type TrailerOwner = { seriesTitle: string } | { filmId: string };

// Replaces the whole trailer list of a film or a series.
export async function setTrailers(owner: TrailerOwner, list: TrailerInput[]): Promise<void> {
  const ownerCondition =
    "seriesTitle" in owner ? eq(trailersTable.seriesTitle, owner.seriesTitle) : eq(trailersTable.filmId, owner.filmId);
  const clean = list
    .map((t) => ({ title: t.title.trim(), videoUrl: t.videoUrl.trim() }))
    .filter((t) => t.videoUrl);
  try {
    await db.delete(trailersTable).where(ownerCondition);
    if (clean.length) {
      await db.insert(trailersTable).values(
        clean.map((t, position) => ({
          id: randomUUID(),
          seriesTitle: "seriesTitle" in owner ? owner.seriesTitle : null,
          filmId: "filmId" in owner ? owner.filmId : null,
          title: t.title || (clean.length > 1 ? `Bande-annonce ${position + 1}` : "Bande-annonce"),
          videoUrl: t.videoUrl,
          position,
        }))
      );
    }
  } catch (e) {
    if (isMissingTable(e)) {
      // Nothing to clear on a database that has never stored a trailer.
      if (clean.length === 0) return;
      throw new Error(MIGRATION_NEEDED);
    }
    throw e;
  }
  // A film's list now lives in the trailers table: drop the legacy field so
  // it isn't shown as a fallback anymore.
  if ("filmId" in owner) await db.update(films).set({ teaserVideoUrl: null }).where(eq(films.id, owner.filmId));
}

// series_meta arrives with migration 0040: until then, reads find no series
// synopsis (episodes' own synopses are shown instead).
export async function getSeriesSynopses(seriesTitles: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (seriesTitles.length === 0) return map;
  try {
    const rows = await db
      .select({ seriesTitle: seriesMeta.seriesTitle, synopsis: seriesMeta.synopsis })
      .from(seriesMeta)
      .where(inArray(seriesMeta.seriesTitle, seriesTitles));
    for (const r of rows) if (r.synopsis?.trim()) map.set(r.seriesTitle, r.synopsis);
  } catch (e) {
    if (!isMissingTable(e)) throw e;
  }
  return map;
}

export async function setSeriesSynopsis(seriesTitle: string, synopsis: string): Promise<void> {
  const value = synopsis.trim() || null;
  try {
    await db
      .insert(seriesMeta)
      .values({ seriesTitle, synopsis: value })
      .onConflictDoUpdate({ target: seriesMeta.seriesTitle, set: { synopsis: value, updatedAt: new Date().toISOString() } });
  } catch (e) {
    if (isMissingTable(e)) {
      if (!value) return;
      throw new Error("La table series_meta n'existe pas encore : lance la migration 0040 (scripts/apply-0040.ts).");
    }
    throw e;
  }
}

// Keeps series trailers attached when a series is renamed or deleted.
async function renameSeriesTrailers(oldTitle: string, newTitle: string): Promise<void> {
  if (oldTitle === newTitle) return;
  try {
    await db.update(trailersTable).set({ seriesTitle: newTitle }).where(eq(trailersTable.seriesTitle, oldTitle));
  } catch (e) {
    if (!isMissingTable(e)) throw e;
  }
  try {
    await db.update(seriesMeta).set({ seriesTitle: newTitle }).where(eq(seriesMeta.seriesTitle, oldTitle));
  } catch (e) {
    if (!isMissingTable(e)) throw e;
  }
}

async function deleteSeriesTrailers(seriesTitle: string): Promise<void> {
  try {
    await db.delete(trailersTable).where(eq(trailersTable.seriesTitle, seriesTitle));
  } catch (e) {
    if (!isMissingTable(e)) throw e;
  }
  try {
    await db.delete(seriesMeta).where(eq(seriesMeta.seriesTitle, seriesTitle));
  } catch (e) {
    if (!isMissingTable(e)) throw e;
  }
}

export async function getFilms(): Promise<Film[]> {
  const rows = await filmsQuery();
  return attachRatingSummaries(rows.map(mapFilm));
}

export async function getComingSoonFilms(): Promise<Film[]> {
  const all = await getFilms();
  return splitComingSoon(all).comingSoon;
}

export async function getFilm(id: string): Promise<Film | undefined> {
  const [row] = await filmsQuery().where(eq(films.id, id));
  if (!row) return undefined;
  const [withRating] = await attachRatingSummaries([mapFilm(row)]);
  return withRating;
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

export async function getArtistStudios(
  artistId: string
): Promise<{ id: string; name: string; avatar: string; isOwner: boolean }[]> {
  const [artist] = await db.select({ userId: artists.userId }).from(artists).where(eq(artists.id, artistId));
  if (!artist?.userId) return [];

  const [owned, memberOf] = await Promise.all([
    getStudiosOwnedBy(artist.userId),
    getActiveStudioMemberships(artist.userId),
  ]);

  const seen = new Set<string>();
  const result: { id: string; name: string; avatar: string; isOwner: boolean }[] = [];
  for (const s of owned) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    result.push({ id: s.id, name: s.name, avatar: s.avatar, isOwner: true });
  }
  for (const s of memberOf) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    result.push({ id: s.id, name: s.name, avatar: s.avatar, isOwner: false });
  }
  return result;
}

export async function getSeriesEpisodeCounts(seriesTitles: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (seriesTitles.length === 0) return map;
  const rows = await db
    .select({ seriesTitle: films.seriesTitle, episodeKind: films.episodeKind })
    .from(films)
    .where(inArray(films.seriesTitle, seriesTitles));
  for (const r of rows) {
    if (!r.seriesTitle || toEpisodeKind(r.episodeKind) === "announcement") continue;
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
  episodeKind?: Film["episodeKind"];
  teaserVideoUrl?: string | null;
  premiereAt?: string | null;
  premiereBanner?: string | null;
  releaseBanner?: string | null;
  premiereAdUrl?: string | null;
  premiereAdDurationSeconds?: number | null;
  releaseAt?: string | null;
  videoDurationSeconds?: number | null;
};

export async function launchPremiere(id: string): Promise<void> {
  await db.update(films).set({ premiereAt: new Date().toISOString() }).where(eq(films.id, id));
}

// Ends a live premiere right now by moving premiereAt back so the live window
// (premiereAt + video length) closes this instant. Everything downstream --
// the post-premiere lock until releaseAt, or a normal release without one --
// then follows exactly as if the premiere had run to its natural end.
export async function stopPremiere(id: string): Promise<void> {
  const film = await getFilm(id);
  if (!film || getPremiereStatus(film) !== "preview") return;
  const premiereAt = new Date(Date.now() - liveSeconds(film) * 1000 - 1000).toISOString();
  await db.update(films).set({ premiereAt }).where(eq(films.id, id));
}

export async function isPremiereLive(id: string): Promise<boolean> {
  const film = await getFilm(id);
  return !!film && getPremiereStatus(film) === "preview";
}

const PREMIERE_VIEWER_TIMEOUT_MS = 30_000;

export async function heartbeatPremiereViewer(viewerId: string, filmId: string): Promise<number> {
  const now = new Date().toISOString();
  await db
    .insert(premiereViewers)
    .values({ id: viewerId, filmId, lastSeenAt: now })
    .onConflictDoUpdate({ target: premiereViewers.id, set: { filmId, lastSeenAt: now } });
  return getPremiereViewerCount(filmId);
}

export async function getPremiereViewerCount(filmId: string): Promise<number> {
  const cutoff = new Date(Date.now() - PREMIERE_VIEWER_TIMEOUT_MS).toISOString();
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(premiereViewers)
    .where(and(eq(premiereViewers.filmId, filmId), gt(premiereViewers.lastSeenAt, cutoff)));
  return row?.count ?? 0;
}

export async function createFilm(input: FilmInput): Promise<string> {
  const id = randomUUID();
  const { isNew, ...rest } = input;
  await db.insert(films).values({ id, ...rest, markedNewAt: isNew ? new Date().toISOString() : null });
  if (input.seriesTitle && (input.episodeKind ?? "episode") === "episode") {
    await absorbSeriesAnnouncement(input.seriesTitle, id);
  }
  return id;
}

// Poster, year and synopsis of an announced series' fiche, edited along with
// the series itself.
export async function updateSeriesAnnouncement(
  seriesTitle: string,
  input: { poster: string; year: number; synopsis: string }
): Promise<void> {
  await db
    .update(films)
    .set({ poster: input.poster, year: input.year, synopsis: input.synopsis })
    .where(and(eq(films.seriesTitle, seriesTitle), inArray(films.episodeKind, ["announcement", "teaser"])));
}

// Reviews open once the content is out: an announcement, an upcoming
// premiere or a scheduled release can't be rated or commented yet.
export async function isOpenForReviews(id: string): Promise<boolean> {
  const film = await getFilm(id);
  return !!film && isReleased(film);
}

// When an announced series gets its first real episode, the announcement
// fiche goes away and its favorites move to that episode (its trailers
// already belong to the series). An announcement carries no reviews.
async function absorbSeriesAnnouncement(seriesTitle: string, episodeId: string): Promise<void> {
  const fiches = await db
    .select({ id: films.id })
    .from(films)
    .where(and(eq(films.seriesTitle, seriesTitle), inArray(films.episodeKind, ["announcement", "teaser"])));
  for (const fiche of fiches) {
    const favs = await db.select({ userId: favorites.userId }).from(favorites).where(eq(favorites.filmId, fiche.id));
    for (const f of favs) {
      await db.insert(favorites).values({ id: randomUUID(), userId: f.userId, filmId: episodeId }).onConflictDoNothing();
    }
    await db.delete(films).where(eq(films.id, fiche.id));
  }
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

export async function getFilmCreatedAts(): Promise<Map<string, string>> {
  const rows = await db.select({ id: films.id, createdAt: films.createdAt }).from(films);
  return new Map(rows.map((r) => [r.id, r.createdAt]));
}

export async function setFilmsNew(ids: string[], isNew: boolean): Promise<void> {
  if (ids.length === 0) return;
  await db
    .update(films)
    .set({ markedNewAt: isNew ? new Date().toISOString() : null })
    .where(inArray(films.id, ids));
}

// Admin-side counterpart of updateSeriesInfo: not scoped to one creator.
export async function adminUpdateSeries(
  oldSeriesTitle: string,
  input: { seriesTitle: string; rating: string; category: string }
): Promise<void> {
  await db
    .update(films)
    .set({ seriesTitle: input.seriesTitle, rating: input.rating, category: input.category })
    .where(eq(films.seriesTitle, oldSeriesTitle));
  await renameSeriesTrailers(oldSeriesTitle, input.seriesTitle);
}

export async function deleteSeries(seriesTitle: string): Promise<void> {
  await db.delete(films).where(eq(films.seriesTitle, seriesTitle));
  await deleteSeriesTrailers(seriesTitle);
}

export async function updateSeriesInfo(
  artistId: string | null,
  studioId: string | null,
  oldSeriesTitle: string,
  input: { seriesTitle: string; rating: string; category: string }
): Promise<void> {
  const identityCondition = artistId ? eq(films.artistId, artistId) : eq(films.studioId, studioId!);
  await db
    .update(films)
    .set({ seriesTitle: input.seriesTitle, rating: input.rating, category: input.category })
    .where(and(identityCondition, eq(films.seriesTitle, oldSeriesTitle)));
  await renameSeriesTrailers(oldSeriesTitle, input.seriesTitle);
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

export type AdminArtistRow = {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  studios: { id: string; name: string; isOwner: boolean }[];
};

// Artists with their linked account and the studios that account owns or is
// an active member of.
export type AdminUserActivity = {
  views: number;
  ratings: number;
  comments: number;
  favorites: number;
  // Most recent watch, rating or comment.
  lastActivityAt: string | null;
  // Most recent sign-in (newest session).
  lastLoginAt: string | null;
  activeSessions: number;
  pendingAppeal: boolean;
};

// Per-user activity for the admin, computed with one grouped query per table.
export async function getUsersActivity(): Promise<Map<string, AdminUserActivity>> {
  const now = Math.floor(Date.now() / 1000);
  const [watchRows, ratingRows, commentRows, favoriteRows, sessionRows, appealRows] = await Promise.all([
    db
      .select({ userId: watchHistory.userId, n: sql<number>`count(*)`, last: sql<string>`max(${watchHistory.watchedAt})` })
      .from(watchHistory)
      .groupBy(watchHistory.userId),
    db
      .select({ userId: filmRatings.userId, n: sql<number>`count(*)`, last: sql<string>`max(${filmRatings.createdAt})` })
      .from(filmRatings)
      .groupBy(filmRatings.userId),
    db
      .select({ userId: comments.userId, n: sql<number>`count(*)`, last: sql<string>`max(${comments.createdAt})` })
      .from(comments)
      .groupBy(comments.userId),
    db.select({ userId: favorites.userId, n: sql<number>`count(*)` }).from(favorites).groupBy(favorites.userId),
    db
      .select({
        userId: sessions.userId,
        last: sql<string>`max(${sessions.createdAt})`,
        active: sql<number>`sum(case when ${sessions.expiresAt} > ${now} then 1 else 0 end)`,
      })
      .from(sessions)
      .groupBy(sessions.userId),
    db.select({ userId: banAppeals.userId }).from(banAppeals).where(eq(banAppeals.status, "pending")),
  ]);

  const map = new Map<string, AdminUserActivity>();
  const entry = (userId: string) => {
    let e = map.get(userId);
    if (!e) {
      e = {
        views: 0,
        ratings: 0,
        comments: 0,
        favorites: 0,
        lastActivityAt: null,
        lastLoginAt: null,
        activeSessions: 0,
        pendingAppeal: false,
      };
      map.set(userId, e);
    }
    return e;
  };
  // Dates come either as ISO strings or as SQLite "YYYY-MM-DD HH:MM:SS" (UTC).
  const iso = (at: string | null) => (at ? (at.includes("T") ? at : `${at.replace(" ", "T")}Z`) : null);
  const latest = (a: string | null, b: string | null) => (!a ? b : !b ? a : a > b ? a : b);

  for (const r of watchRows) {
    const e = entry(r.userId);
    e.views = r.n;
    e.lastActivityAt = latest(e.lastActivityAt, iso(r.last));
  }
  for (const r of ratingRows) {
    const e = entry(r.userId);
    e.ratings = r.n;
    e.lastActivityAt = latest(e.lastActivityAt, iso(r.last));
  }
  for (const r of commentRows) {
    const e = entry(r.userId);
    e.comments = r.n;
    e.lastActivityAt = latest(e.lastActivityAt, iso(r.last));
  }
  for (const r of favoriteRows) entry(r.userId).favorites = r.n;
  for (const r of sessionRows) {
    const e = entry(r.userId);
    e.lastLoginAt = iso(r.last);
    e.activeSessions = r.active ?? 0;
  }
  for (const r of appealRows) entry(r.userId).pendingAppeal = true;
  return map;
}

export async function getAdminArtists(): Promise<AdminArtistRow[]> {
  const [rows, studioRows, memberships] = await Promise.all([
    db
      .select({
        id: artists.id,
        name: artists.name,
        bio: artists.bio,
        avatar: artists.avatar,
        userId: artists.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(artists)
      .leftJoin(users, eq(artists.userId, users.id)),
    db.select({ id: studios.id, name: studios.name, ownerId: studios.ownerId }).from(studios),
    db
      .select({ studioId: studioMembers.studioId, userId: studioMembers.userId })
      .from(studioMembers)
      .where(eq(studioMembers.status, "active")),
  ]);
  const studioById = new Map(studioRows.map((s) => [s.id, s]));

  return rows.map((a) => {
    const list: AdminArtistRow["studios"] = [];
    if (a.userId) {
      for (const s of studioRows) if (s.ownerId === a.userId) list.push({ id: s.id, name: s.name, isOwner: true });
      for (const m of memberships) {
        const s = studioById.get(m.studioId);
        if (m.userId === a.userId && s && !list.some((x) => x.id === s.id)) {
          list.push({ id: s.id, name: s.name, isOwner: false });
        }
      }
    }
    return { ...a, studios: list };
  });
}

// Links an artist profile to a user account. Every profile belongs to an
// account, and an account can only carry one artist profile.
export async function setArtistUser(artistId: string, userId: string): Promise<void> {
  if (!userId) throw new Error("Choisis le compte auquel appartient ce profil d'artiste.");
  const [account] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId));
  if (!account) throw new Error("Ce compte n'existe pas.");
  const [taken] = await db
    .select({ id: artists.id, name: artists.name })
    .from(artists)
    .where(and(eq(artists.userId, userId), ne(artists.id, artistId)));
  if (taken) throw new Error(`Ce compte est déjà lié à l'artiste ${taken.name}.`);
  await db.update(artists).set({ userId }).where(eq(artists.id, artistId));
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
  banned: boolean;
  banReason: string | null;
  bannedAt: string | null;
  avatarUrl: string | null;
  mustChangePassword: boolean;
};

export async function getUsers(): Promise<AdminUser[]> {
  return db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
      banned: users.banned,
      banReason: users.banReason,
      bannedAt: users.bannedAt,
      avatarUrl: users.avatarUrl,
      mustChangePassword: users.mustChangePassword,
    })
    .from(users);
}

// Owner account: never editable/removable from the admin panel, no matter
// who's performing the action (including other admins).
export const PROTECTED_EMAIL = "dark.alv69@gmail.com";

async function assertNotProtectedUser(id: string): Promise<void> {
  const [row] = await db.select({ email: users.email }).from(users).where(eq(users.id, id));
  if (row?.email === PROTECTED_EMAIL) {
    throw new Error("Ce compte est protégé et ne peut pas être modifié depuis l'admin.");
  }
}

// Staff reset: replaces the password with a temporary one, forces a change at
// next sign-in, and signs the user out everywhere so the old password (and
// any session opened with it) stops working immediately.
export async function resetUserPassword(id: string, temporaryPasswordHash: string): Promise<void> {
  await assertNotProtectedUser(id);
  await db.update(users).set({ passwordHash: temporaryPasswordHash, mustChangePassword: true }).where(eq(users.id, id));
  await db.delete(sessions).where(eq(sessions.userId, id));
}

export async function updateUserRole(id: string, role: "user" | "admin"): Promise<void> {
  await assertNotProtectedUser(id);
  await db.update(users).set({ role }).where(eq(users.id, id));
}

// Every artist profile belongs to an account: an account carrying one can't
// be deleted until the profile is moved to another account or removed.
export async function getLinkedArtistName(userId: string): Promise<string | null> {
  const [row] = await db.select({ name: artists.name }).from(artists).where(eq(artists.userId, userId));
  return row?.name ?? null;
}

export async function getOwnedStudioNames(userId: string): Promise<string[]> {
  const rows = await db.select({ name: studios.name }).from(studios).where(eq(studios.ownerId, userId));
  return rows.map((r) => r.name);
}

export async function deleteUser(id: string): Promise<void> {
  await assertNotProtectedUser(id);
  const artistName = await getLinkedArtistName(id);
  if (artistName) {
    throw new Error(
      `Ce compte porte le profil d'artiste ${artistName} : relie-le à un autre compte ou supprime l'artiste d'abord.`
    );
  }
  const owned = await getOwnedStudioNames(id);
  if (owned.length) {
    throw new Error(`Ce compte a fondé ${owned.join(", ")} : transfère le studio à un autre fondateur d'abord.`);
  }
  await db.delete(users).where(eq(users.id, id));
}

export async function banUser(id: string, reason: string | null): Promise<void> {
  await assertNotProtectedUser(id);
  await db
    .update(users)
    .set({ banned: true, banReason: reason, bannedAt: new Date().toISOString() })
    .where(eq(users.id, id));
  // Sessions are kept alive on purpose: validateSession still resolves them
  // (now flagged banned), so the next request/reload shows the ban page
  // instead of silently logging them out into an anonymous guest.
}

export async function unbanUser(id: string): Promise<void> {
  await db.update(users).set({ banned: false, banReason: null, bannedAt: null }).where(eq(users.id, id));
}

export type BanAppeal = {
  id: string;
  userId: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  reviewedAt: string | null;
};

export async function createBanAppeal(userId: string, message: string): Promise<void> {
  const [existing] = await db
    .select({ id: banAppeals.id })
    .from(banAppeals)
    .where(and(eq(banAppeals.userId, userId), eq(banAppeals.status, "pending")));
  if (existing) throw new Error("Tu as déjà une demande en cours d'examen.");

  await db.insert(banAppeals).values({ id: randomUUID(), userId, message, status: "pending" });
}

export async function getLatestBanAppeal(userId: string): Promise<BanAppeal | null> {
  const [row] = await db
    .select()
    .from(banAppeals)
    .where(eq(banAppeals.userId, userId))
    .orderBy(desc(banAppeals.createdAt))
    .limit(1);
  return row ? (row as BanAppeal) : null;
}

export type PendingBanAppeal = BanAppeal & { userName: string; userEmail: string; banReason: string | null };

export async function getPendingBanAppeals(): Promise<PendingBanAppeal[]> {
  const rows = await db
    .select({
      id: banAppeals.id,
      userId: banAppeals.userId,
      message: banAppeals.message,
      status: banAppeals.status,
      createdAt: banAppeals.createdAt,
      reviewedAt: banAppeals.reviewedAt,
      userName: users.name,
      userEmail: users.email,
      banReason: users.banReason,
    })
    .from(banAppeals)
    .innerJoin(users, eq(banAppeals.userId, users.id))
    .where(eq(banAppeals.status, "pending"))
    .orderBy(desc(banAppeals.createdAt));
  return rows as PendingBanAppeal[];
}

export type AdminFilmRequest = FilmSubmission & {
  accountName: string | null;
  accountEmail: string | null;
  releaseRequest: ReleaseRequest;
};
export type AdminArtistRequest = ArtistSubmission & { accountName: string | null; accountEmail: string | null };
export type AdminBanAppeal = BanAppeal & {
  userName: string;
  userEmail: string;
  banReason: string | null;
  stillBanned: boolean;
};

// Every request (pending and already handled), newest first, with the
// account that sent it.
export async function getAdminRequests(): Promise<{
  films: AdminFilmRequest[];
  artists: AdminArtistRequest[];
  appeals: AdminBanAppeal[];
}> {
  const [filmRows, artistRows, appealRows] = await Promise.all([
    db
      .select({ s: filmSubmissions, accountName: users.name, accountEmail: users.email })
      .from(filmSubmissions)
      .leftJoin(users, eq(filmSubmissions.userId, users.id))
      .orderBy(desc(filmSubmissions.createdAt)),
    db
      .select({ s: artistSubmissions, accountName: users.name, accountEmail: users.email })
      .from(artistSubmissions)
      .leftJoin(users, eq(artistSubmissions.userId, users.id))
      .orderBy(desc(artistSubmissions.createdAt)),
    db
      .select({
        id: banAppeals.id,
        userId: banAppeals.userId,
        message: banAppeals.message,
        status: banAppeals.status,
        createdAt: banAppeals.createdAt,
        reviewedAt: banAppeals.reviewedAt,
        userName: users.name,
        userEmail: users.email,
        banReason: users.banReason,
        stillBanned: users.banned,
      })
      .from(banAppeals)
      .innerJoin(users, eq(banAppeals.userId, users.id))
      .orderBy(desc(banAppeals.createdAt)),
  ]);
  const releases = await getReleaseRequests(filmRows.map((r) => r.s.id));
  return {
    films: filmRows.map((r) => ({
      ...r.s,
      accountName: r.accountName,
      accountEmail: r.accountEmail,
      releaseRequest: releases.get(r.s.id) ?? parseReleaseRequest(null),
    })),
    artists: artistRows.map((r) => ({ ...r.s, accountName: r.accountName, accountEmail: r.accountEmail })),
    appeals: appealRows as AdminBanAppeal[],
  };
}

export async function resolveBanAppeal(appealId: string, accept: boolean): Promise<void> {
  const [appeal] = await db.select({ userId: banAppeals.userId }).from(banAppeals).where(eq(banAppeals.id, appealId));
  if (!appeal) return;

  await db
    .update(banAppeals)
    .set({ status: accept ? "accepted" : "rejected", reviewedAt: new Date().toISOString() })
    .where(eq(banAppeals.id, appealId));

  if (accept) await unbanUser(appeal.userId);
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

  // Release asked for by the creator, possibly changed by the admin.
  const release = (await getReleaseRequests([id])).get(id) ?? parseReleaseRequest(null);
  const isAnnouncementRequest = release.mode === "announcement";

  // Content proposed for an announcement fiche: the fiche becomes the film.
  const replaced = release.replacesId ? await getFilm(release.replacesId) : undefined;
  const fillsAnnouncement = !!replaced && replaced.episodeKind === "announcement" && !isAnnouncementRequest;

  const input: FilmInput = {
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
    episodeKind: isAnnouncementRequest ? "announcement" : toEpisodeKind(submission.episodeKind),
    teaserVideoUrl: submission.teaserVideoUrl,
    premiereAt: release.premiereAt,
    releaseAt: release.releaseAt,
    premiereBanner: release.premiereBanner ?? null,
    releaseBanner: release.releaseBanner ?? null,
    premiereAdUrl: release.premiereAdUrl ?? null,
    premiereAdDurationSeconds: release.premiereAdDurationSeconds ?? null,
  };
  let filmId: string;
  if (fillsAnnouncement) {
    filmId = replaced!.id;
    await updateFilm(filmId, input);
  } else {
    filmId = await createFilm(input);
  }

  // An announced series carries its trailers and synopsis at series level;
  // an announced film carries them itself.
  if (isAnnouncementRequest) {
    if (submission.seriesTitle) {
      if (release.trailers?.length) await setTrailers({ seriesTitle: submission.seriesTitle }, release.trailers);
      if (submission.synopsis.trim()) await setSeriesSynopsis(submission.seriesTitle, submission.synopsis);
    } else if (release.trailers?.length) {
      await setTrailers({ filmId }, release.trailers);
    }
  }

  await db.update(filmSubmissions).set({ status: "accepted" }).where(eq(filmSubmissions.id, id));

  if (submission.userId) {
    const name =
      submission.seriesTitle && !isAnnouncementRequest
        ? `${submission.seriesTitle} · ${submission.title}`
        : (submission.seriesTitle ?? submission.title);
    const when =
      release.mode === "now"
        ? "Il est en ligne."
        : isAnnouncementRequest
          ? "L'annonce est visible dans « Bientôt sur ZorAnim »."
          : `${describeReleaseRequest(release)}.`;
    await createNotification(
      submission.userId,
      "film_submission_accepted",
      `« ${name} » a été accepté. ${when}`,
      "/mon-espace"
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
  // An artist profile always belongs to an account.
  if (!submission.userId) throw new Error("Le compte à l'origine de cette demande n'existe plus.");

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

// A series goes into the list as a whole: whichever episode was added, every
// episode of that series counts as in the list.
async function seriesFilmIds(filmId: string): Promise<string[]> {
  const [row] = await db.select({ seriesTitle: films.seriesTitle }).from(films).where(eq(films.id, filmId));
  if (!row?.seriesTitle) return [filmId];
  const rows = await db.select({ id: films.id }).from(films).where(eq(films.seriesTitle, row.seriesTitle));
  return rows.length ? rows.map((r) => r.id) : [filmId];
}

export async function getFavoriteFilmIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ filmId: favorites.filmId, seriesTitle: films.seriesTitle })
    .from(favorites)
    .innerJoin(films, eq(films.id, favorites.filmId))
    .where(eq(favorites.userId, userId));
  const ids = new Set(rows.map((r) => r.filmId));
  const titles = [...new Set(rows.map((r) => r.seriesTitle).filter((t): t is string => !!t))];
  if (titles.length) {
    const episodes = await db.select({ id: films.id }).from(films).where(inArray(films.seriesTitle, titles));
    for (const e of episodes) ids.add(e.id);
  }
  return ids;
}

export async function isFilmFavorite(userId: string, filmId: string): Promise<boolean> {
  const ids = await seriesFilmIds(filmId);
  const [row] = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), inArray(favorites.filmId, ids)));
  return !!row;
}

// For a series, removing takes out every episode that was added (older lists
// could hold several), and adding stores a single row for the whole series.
export async function toggleFavorite(userId: string, filmId: string): Promise<boolean> {
  const ids = await seriesFilmIds(filmId);
  const existing = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), inArray(favorites.filmId, ids)));

  if (existing.length) {
    await db.delete(favorites).where(inArray(favorites.id, existing.map((e) => e.id)));
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

export async function incrementGuestView(filmId: string): Promise<void> {
  await db
    .update(films)
    .set({ guestViewCount: sql`${films.guestViewCount} + 1` })
    .where(eq(films.id, filmId));
}

export async function getFilmEngagement(filmIds: string[]): Promise<Map<string, { views: number; comments: number }>> {
  const map = new Map<string, { views: number; comments: number }>();
  if (filmIds.length === 0) return map;

  const [viewRows, commentRows, guestViewRows] = await Promise.all([
    db.select({ filmId: watchHistory.filmId }).from(watchHistory).where(inArray(watchHistory.filmId, filmIds)),
    db.select({ filmId: comments.filmId }).from(comments).where(inArray(comments.filmId, filmIds)),
    db.select({ id: films.id, guestViewCount: films.guestViewCount }).from(films).where(inArray(films.id, filmIds)),
  ]);

  for (const id of filmIds) map.set(id, { views: 0, comments: 0 });
  for (const r of viewRows) map.get(r.filmId)!.views += 1;
  for (const r of commentRows) map.get(r.filmId)!.comments += 1;
  for (const r of guestViewRows) map.get(r.id)!.views += r.guestViewCount;
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

// Marks a message as handled (or opens it again) without sending a reply.
export async function setContactMessageStatus(id: string, status: "open" | "closed"): Promise<void> {
  await db.update(contactMessages).set({ status }).where(eq(contactMessages.id, id));
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

export async function inviteToStudio(studioId: string, artistId: string, requesterUserId: string): Promise<void> {
  const [owned] = await db.select({ ownerId: studios.ownerId }).from(studios).where(eq(studios.id, studioId));
  if (!owned) throw new Error("Studio introuvable.");
  if (owned.ownerId !== requesterUserId) throw new Error("Non autorisé.");

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

export async function respondToStudioInvite(
  memberId: string,
  userId: string,
  accept: boolean
): Promise<{ studioId: string } | null> {
  const [row] = await db.select().from(studioMembers).where(eq(studioMembers.id, memberId));
  if (!row || row.userId !== userId) return null;

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

  return { studioId: row.studioId };
}

// Owner-initiated invites use status "invited"; artist-initiated requests to
// join use status "requested" -- same table, same accept/decline shape,
// just who started it and who has to respond.
export async function requestToJoinStudio(studioId: string, userId: string): Promise<void> {
  const [existing] = await db
    .select({ id: studioMembers.id })
    .from(studioMembers)
    .where(and(eq(studioMembers.studioId, studioId), eq(studioMembers.userId, userId)));
  if (existing) return;

  await db.insert(studioMembers).values({ id: randomUUID(), studioId, userId, status: "requested" });

  const [studio] = await db.select({ name: studios.name, ownerId: studios.ownerId }).from(studios).where(eq(studios.id, studioId));
  const [user] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId));
  if (studio?.ownerId && user) {
    await createNotification(
      studio.ownerId,
      "studio_join_request",
      `${user.name} souhaite rejoindre le studio "${studio.name}".`,
      "/profil"
    );
  }
}

export async function getPendingJoinRequests(
  ownerId: string
): Promise<(StudioMember & { studioName: string; requesterName: string })[]> {
  return db
    .select({
      id: studioMembers.id,
      studioId: studioMembers.studioId,
      userId: studioMembers.userId,
      status: studioMembers.status,
      createdAt: studioMembers.createdAt,
      studioName: studios.name,
      requesterName: users.name,
    })
    .from(studioMembers)
    .innerJoin(studios, eq(studioMembers.studioId, studios.id))
    .innerJoin(users, eq(studioMembers.userId, users.id))
    .where(and(eq(studios.ownerId, ownerId), eq(studioMembers.status, "requested")));
}

export async function respondToJoinRequest(
  memberId: string,
  ownerId: string,
  accept: boolean
): Promise<{ studioId: string } | null> {
  const [row] = await db.select().from(studioMembers).where(eq(studioMembers.id, memberId));
  if (!row) return null;

  const [studio] = await db.select({ name: studios.name, ownerId: studios.ownerId }).from(studios).where(eq(studios.id, row.studioId));
  if (!studio || studio.ownerId !== ownerId) return null;

  if (accept) {
    await db.update(studioMembers).set({ status: "active" }).where(eq(studioMembers.id, memberId));
  } else {
    await db.delete(studioMembers).where(eq(studioMembers.id, memberId));
  }

  await createNotification(
    row.userId,
    "studio_join_request_response",
    accept
      ? `Ta demande pour rejoindre le studio "${studio.name}" a été acceptée.`
      : `Ta demande pour rejoindre le studio "${studio.name}" a été refusée.`,
    "/profil"
  );

  return { studioId: row.studioId };
}

export async function getStudioMembershipStatus(
  studioId: string,
  userId: string
): Promise<"owner" | "active" | "invited" | "requested" | null> {
  const [studio] = await db.select({ ownerId: studios.ownerId }).from(studios).where(eq(studios.id, studioId));
  if (studio?.ownerId === userId) return "owner";

  const [member] = await db
    .select({ status: studioMembers.status })
    .from(studioMembers)
    .where(and(eq(studioMembers.studioId, studioId), eq(studioMembers.userId, userId)));
  return (member?.status as "active" | "invited" | "requested" | undefined) ?? null;
}

export type StudioMemberInfo = { id: string; name: string; email: string; status: string; avatar: string | null };

export async function getStudioMembers(studioId: string): Promise<StudioMemberInfo[]> {
  const rows = await db
    .select({
      id: studioMembers.id,
      status: studioMembers.status,
      userName: users.name,
      userEmail: users.email,
      artistName: artists.name,
      artistAvatar: artists.avatar,
      userAvatar: users.avatarUrl,
    })
    .from(studioMembers)
    .innerJoin(users, eq(studioMembers.userId, users.id))
    .leftJoin(artists, eq(artists.userId, studioMembers.userId))
    .where(eq(studioMembers.studioId, studioId));
  return rows.map((r) => ({
    id: r.id,
    name: r.artistName ?? r.userName,
    email: r.userEmail,
    status: r.status,
    avatar: r.artistAvatar || r.userAvatar || null,
  }));
}

export async function getStudioTeamDisplay(
  studioId: string
): Promise<{ name: string; isOwner: boolean; artistId: string | null; avatar: string | null }[]> {
  const [studio] = await db.select({ ownerId: studios.ownerId }).from(studios).where(eq(studios.id, studioId));

  const result: { name: string; isOwner: boolean; artistId: string | null; avatar: string | null }[] = [];

  if (studio?.ownerId) {
    const [ownerRow] = await db
      .select({
        userName: users.name,
        artistId: artists.id,
        artistName: artists.name,
        artistAvatar: artists.avatar,
        userAvatar: users.avatarUrl,
      })
      .from(users)
      .leftJoin(artists, eq(artists.userId, users.id))
      .where(eq(users.id, studio.ownerId));
    if (ownerRow) {
      result.push({
        name: ownerRow.artistName ?? ownerRow.userName,
        isOwner: true,
        artistId: ownerRow.artistId ?? null,
        avatar: ownerRow.artistAvatar || ownerRow.userAvatar || null,
      });
    }
  }

  const memberRows = await db
    .select({
      userName: users.name,
      artistId: artists.id,
      artistName: artists.name,
      artistAvatar: artists.avatar,
      userAvatar: users.avatarUrl,
    })
    .from(studioMembers)
    .innerJoin(users, eq(studioMembers.userId, users.id))
    .leftJoin(artists, eq(artists.userId, studioMembers.userId))
    .where(and(eq(studioMembers.studioId, studioId), eq(studioMembers.status, "active")));

  for (const r of memberRows) {
    result.push({
      name: r.artistName ?? r.userName,
      isOwner: false,
      artistId: r.artistId ?? null,
      avatar: r.artistAvatar || r.userAvatar || null,
    });
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
  if (filmRow) throw new Error("Impossible de supprimer un studio qui a des films ou séries au catalogue.");

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
  userAvatarUrl: string | null;
  body: string;
  createdAt: string;
  parentId: string | null;
  filmId: string;
  // The film's title, or the series' for an episode.
  filmTitle: string;
  // "S1E2" and the episode's own title, for a series episode.
  episodeTag: string | null;
  episodeTitle: string | null;
  upCount: number;
  downCount: number;
};

export async function getAllCommentsWithStats(): Promise<AdminComment[]> {
  const rows = await db
    .select({
      id: comments.id,
      userId: comments.userId,
      userName: users.name,
      userAvatarUrl: users.avatarUrl,
      body: comments.body,
      createdAt: comments.createdAt,
      parentId: comments.parentId,
      filmId: comments.filmId,
      title: films.title,
      seriesTitle: films.seriesTitle,
      seasonNumber: films.seasonNumber,
      episodeNumber: films.episodeNumber,
      episodeKind: films.episodeKind,
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

  return rows.map(({ title, seriesTitle, seasonNumber, episodeNumber, episodeKind, ...r }) => {
    const c = counts.get(r.id) ?? { up: 0, down: 0 };
    const isEpisode = !!seriesTitle && toEpisodeKind(episodeKind) === "episode";
    return {
      ...r,
      filmTitle: seriesTitle ?? title,
      episodeTag: isEpisode ? formatEpisodeTag({ episodeKind: "episode", seasonNumber, episodeNumber }) : null,
      episodeTitle: isEpisode ? title : null,
      upCount: c.up,
      downCount: c.down,
    };
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

export async function adminDeleteStudio(studioId: string): Promise<void> {
  await db.delete(studios).where(eq(studios.id, studioId));
}

export async function adminRemoveStudioMember(memberRowId: string): Promise<void> {
  await db.delete(studioMembers).where(eq(studioMembers.id, memberRowId));
}

export type AdminStudioMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  status: "active" | "invited" | "requested";
  createdAt: string;
};

export type AdminStudioRow = {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  createdAt: string;
  ownerId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  members: AdminStudioMember[];
};

// Studios with their founder and every membership (active, invited,
// requested); names are the artist name when the account has one.
export async function getAdminStudios(): Promise<AdminStudioRow[]> {
  const [rows, memberRows, artistRows] = await Promise.all([
    db
      .select({
        id: studios.id,
        name: studios.name,
        bio: studios.bio,
        avatar: studios.avatar,
        createdAt: studios.createdAt,
        ownerId: studios.ownerId,
        ownerUserName: users.name,
        ownerEmail: users.email,
      })
      .from(studios)
      .leftJoin(users, eq(studios.ownerId, users.id)),
    db
      .select({
        id: studioMembers.id,
        studioId: studioMembers.studioId,
        userId: studioMembers.userId,
        status: studioMembers.status,
        createdAt: studioMembers.createdAt,
        userName: users.name,
        email: users.email,
      })
      .from(studioMembers)
      .innerJoin(users, eq(studioMembers.userId, users.id)),
    db.select({ userId: artists.userId, name: artists.name }).from(artists),
  ]);
  const artistNameByUser = new Map(artistRows.filter((a) => a.userId).map((a) => [a.userId!, a.name]));

  return rows.map(({ ownerUserName, ...s }) => ({
    ...s,
    ownerName: s.ownerId ? (artistNameByUser.get(s.ownerId) ?? ownerUserName) : null,
    members: memberRows
      .filter((m) => m.studioId === s.id)
      .map((m) => ({
        id: m.id,
        userId: m.userId,
        name: artistNameByUser.get(m.userId) ?? m.userName,
        email: m.email,
        status: m.status as AdminStudioMember["status"],
        createdAt: m.createdAt,
      })),
  }));
}

// Admin edit of a studio, including handing it over to another founder: the
// new founder's membership row goes away (founders aren't members) and the
// previous founder stays in the studio as an active member.
export async function adminUpdateStudio(id: string, input: ArtistInput, ownerId: string): Promise<void> {
  if (!ownerId) throw new Error("Choisis le fondateur du studio.");
  const [studio] = await db.select({ id: studios.id }).from(studios).where(eq(studios.id, id));
  if (!studio) throw new Error("Studio introuvable.");
  await db.update(studios).set(input).where(eq(studios.id, id));
  await adminTransferStudio(id, ownerId);
}

// Hands a studio over to another account: the new founder's membership row
// goes away (founders aren't members) and the previous founder stays in the
// studio as an active member. Both are notified.
export async function adminTransferStudio(studioId: string, newOwnerId: string): Promise<void> {
  const [owner] = await db.select({ id: users.id }).from(users).where(eq(users.id, newOwnerId));
  if (!owner) throw new Error("Ce compte n'existe pas.");
  const [studio] = await db
    .select({ ownerId: studios.ownerId, name: studios.name })
    .from(studios)
    .where(eq(studios.id, studioId));
  if (!studio) throw new Error("Studio introuvable.");
  if (studio.ownerId === newOwnerId) return;

  await db.update(studios).set({ ownerId: newOwnerId }).where(eq(studios.id, studioId));
  await db.delete(studioMembers).where(and(eq(studioMembers.studioId, studioId), eq(studioMembers.userId, newOwnerId)));
  if (studio.ownerId) {
    await db
      .insert(studioMembers)
      .values({ id: randomUUID(), studioId, userId: studio.ownerId, status: "active" })
      .onConflictDoUpdate({
        target: [studioMembers.studioId, studioMembers.userId],
        set: { status: "active" },
      });
    await createNotification(
      studio.ownerId,
      "studio_owner",
      `Le studio "${studio.name}" a un nouveau fondateur. Tu en restes membre.`,
      "/profil"
    );
  }
  await createNotification(newOwnerId, "studio_owner", `Tu es maintenant fondateur du studio "${studio.name}".`, "/profil");
}

// Admin answer to a pending join request or invitation.
export async function adminSetStudioMemberActive(memberRowId: string): Promise<void> {
  const [row] = await db.select().from(studioMembers).where(eq(studioMembers.id, memberRowId));
  if (!row || row.status === "active") return;
  await db.update(studioMembers).set({ status: "active" }).where(eq(studioMembers.id, memberRowId));
  const [studio] = await db.select({ name: studios.name }).from(studios).where(eq(studios.id, row.studioId));
  await createNotification(
    row.userId,
    "studio_join_request_response",
    `Tu fais maintenant partie du studio "${studio?.name ?? ""}".`,
    "/profil"
  );
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

export type Trend = { current: number; previous: number };

export type RankedContent = {
  id: string;
  title: string;
  kind: "film" | "series";
  creator: string;
  category: string;
  year: number;
  episodeCount: number;
};

export type RankedEpisode = {
  id: string;
  seriesTitle: string;
  episodeTag: string;
  episodeTitle: string;
  creator: string;
};

export type DashboardStats = {
  filmCount: number;
  episodeCount: number;
  artistCount: number;
  studioCount: number;
  userCount: number;
  pendingCount: number;
  openMessageCount: number;
  pendingInviteCount: number;
  totalViews: number;
  memberViews: number;
  guestViews: number;
  totalFavorites: number;
  ratingCount: number;
  averageRating: number | null;
  ratingDistribution: number[];
  commentCount: number;
  reactionUpCount: number;
  reactionDownCount: number;
  activeUsers7d: number;
  activeUsers30d: number;
  trends: { views: Trend; signups: Trend; comments: Trend; ratings: Trend };
  daily: { date: string; views: number; interactions: number; signups: number }[];
  topContents: (RankedContent & { views: number; memberViews: number; guestViews: number; viewers: number })[];
  topEpisodes: (RankedEpisode & { views: number; memberViews: number; guestViews: number })[];
  topRatedContents: (RankedContent & { average: number; voters: number; ratingCount: number })[];
  topRatedEpisodes: (RankedEpisode & { average: number; count: number })[];
  topCommentedContents: (RankedContent & {
    count: number;
    replies: number;
    commenters: number;
    topEpisode: (RankedEpisode & { count: number }) | null;
  })[];
  topMembers: {
    id: string;
    name: string;
    joinedAt: string;
    comments: number;
    ratings: number;
    views: number;
    favorites: number;
    averageGiven: number | null;
  }[];
  topArtists: { id: string; name: string; contentCount: number; films: number; series: number; episodes: number }[];
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
  recentFilms: {
    id: string;
    title: string;
    artistName: string;
    poster: string;
    kind: "film" | "series";
    episodeCount: number;
    // Added as an announcement (no video / no episode yet).
    announced: boolean;
    latestEpisode: RankedEpisode | null;
    createdAt: string;
  }[];
  recentComments: {
    id: string;
    userName: string;
    userAvatarUrl: string | null;
    contentTitle: string;
    episode: RankedEpisode | null;
    isReply: boolean;
    body: string;
    createdAt: string;
  }[];
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
    activeMemberships,
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
        year: films.year,
        seriesTitle: films.seriesTitle,
        seasonNumber: films.seasonNumber,
        episodeNumber: films.episodeNumber,
        episodeKind: films.episodeKind,
        guestViewCount: films.guestViewCount,
        poster: films.poster,
      })
      .from(films),
    db.select({ id: artists.id, name: artists.name, userId: artists.userId }).from(artists),
    db.select({ id: studios.id, name: studios.name, ownerId: studios.ownerId }).from(studios),
    db.select({ id: users.id, name: users.name, createdAt: users.createdAt }).from(users),
    getPendingFilmSubmissions(),
    getPendingArtistSubmissions(),
    getContactMessages(),
    db.select({ filmId: watchHistory.filmId, userId: watchHistory.userId, at: watchHistory.watchedAt }).from(watchHistory),
    db.select({ filmId: favorites.filmId, userId: favorites.userId }).from(favorites),
    db
      .select({ filmId: filmRatings.filmId, userId: filmRatings.userId, value: filmRatings.value, at: filmRatings.createdAt })
      .from(filmRatings),
    db
      .select({ filmId: comments.filmId, userId: comments.userId, parentId: comments.parentId, at: comments.createdAt })
      .from(comments),
    db.select({ type: commentReactions.type }).from(commentReactions),
    db.select({ id: studioMembers.id }).from(studioMembers).where(eq(studioMembers.status, "invited")),
    db
      .select({ studioId: studioMembers.studioId, userId: studioMembers.userId })
      .from(studioMembers)
      .where(eq(studioMembers.status, "active")),
    db.select({ status: filmSubmissions.status }).from(filmSubmissions),
    db.select({ status: artistSubmissions.status }).from(artistSubmissions),
    db
      .select({
        id: comments.id,
        userName: users.name,
        userAvatarUrl: users.avatarUrl,
        filmId: comments.filmId,
        parentId: comments.parentId,
        body: comments.body,
        createdAt: comments.createdAt,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .innerJoin(films, eq(comments.filmId, films.id))
      .orderBy(desc(comments.createdAt))
      .limit(40),
  ]);

  const filmMap = new Map(filmRows.map((f) => [f.id, f]));
  const creatorMap = new Map<string, { name: string; isStudio: boolean }>([
    ...artistRows.map((a): [string, { name: string; isStudio: boolean }] => [a.id, { name: a.name, isStudio: false }]),
    ...studioRows.map((s): [string, { name: string; isStudio: boolean }] => [s.id, { name: s.name, isStudio: true }]),
  ]);
  const creatorIdOf = (f: { artistId: string | null; studioId: string | null }) => f.artistId ?? f.studioId ?? "";

  // Group raw film rows by content (a series' episodes collapse into a single
  // entry) so dashboard counts reflect distinct films/series, not episode rows.
  const contentGroups = new Map<string, typeof filmRows>();
  for (const f of filmRows) {
    const key = f.seriesTitle ?? f.id;
    const arr = contentGroups.get(key) ?? [];
    arr.push(f);
    contentGroups.set(key, arr);
  }
  const contentRepresentatives = [...contentGroups.values()].map((group) =>
    group.reduce((latest, f) => (new Date(f.createdAt) > new Date(latest.createdAt) ? f : latest))
  );

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const since = (days: number) => now - days * DAY;
  const newUsers7d = userRows.filter((u) => new Date(u.createdAt).getTime() >= since(7)).length;
  const newUsers30d = userRows.filter((u) => new Date(u.createdAt).getTime() >= since(30)).length;
  const newFilms7d = contentRepresentatives.filter((f) => new Date(f.createdAt).getTime() >= since(7)).length;
  const newFilms30d = contentRepresentatives.filter((f) => new Date(f.createdAt).getTime() >= since(30)).length;

  const categoryCounts = new Map<string, number>();
  for (const f of contentRepresentatives) categoryCounts.set(f.category, (categoryCounts.get(f.category) ?? 0) + 1);
  const categoryBreakdown = [...categoryCounts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  const viewsByFilm = new Map<string, number>();
  for (const w of watchRows) viewsByFilm.set(w.filmId, (viewsByFilm.get(w.filmId) ?? 0) + 1);
  for (const f of filmRows) {
    if (f.guestViewCount > 0) viewsByFilm.set(f.id, (viewsByFilm.get(f.id) ?? 0) + f.guestViewCount);
  }

  // Content credited to a studio also counts toward each of that studio's
  // active member artists AND its owner, so a member's or owner's personal +
  // studio work both show up.
  const artistIdByUserId = new Map(artistRows.filter((a) => a.userId).map((a) => [a.userId as string, a.id]));
  const memberArtistIdsByStudio = new Map<string, string[]>();
  for (const m of activeMemberships) {
    const memberArtistId = artistIdByUserId.get(m.userId);
    if (!memberArtistId) continue;
    const arr = memberArtistIdsByStudio.get(m.studioId) ?? [];
    arr.push(memberArtistId);
    memberArtistIdsByStudio.set(m.studioId, arr);
  }
  for (const s of studioRows) {
    if (!s.ownerId) continue;
    const ownerArtistId = artistIdByUserId.get(s.ownerId);
    if (!ownerArtistId) continue;
    const arr = memberArtistIdsByStudio.get(s.id) ?? [];
    if (!arr.includes(ownerArtistId)) arr.push(ownerArtistId);
    memberArtistIdsByStudio.set(s.id, arr);
  }

  const artistCounts = new Map<string, { films: number; series: number; episodes: number }>();
  const seenContentByArtist = new Set<string>();
  const countFor = (id: string, f: (typeof filmRows)[number]) => {
    const counts = artistCounts.get(id) ?? { films: 0, series: 0, episodes: 0 };
    artistCounts.set(id, counts);
    if (f.seriesTitle) counts.episodes += 1;
    const contentKey = `${id}::${f.seriesTitle ?? f.id}`;
    if (seenContentByArtist.has(contentKey)) return;
    seenContentByArtist.add(contentKey);
    if (f.seriesTitle) counts.series += 1;
    else counts.films += 1;
  };
  for (const f of filmRows) {
    countFor(creatorIdOf(f), f);
    if (f.studioId) {
      for (const memberArtistId of memberArtistIdsByStudio.get(f.studioId) ?? []) {
        countFor(memberArtistId, f);
      }
    }
  }

  const episodeOf = (id: string): RankedEpisode | null => {
    const f = filmMap.get(id);
    if (!f?.seriesTitle) return null;
    return {
      id,
      seriesTitle: f.seriesTitle,
      episodeTag: formatEpisodeTag({ ...f, episodeKind: toEpisodeKind(f.episodeKind) }),
      episodeTitle: f.title,
      creator: creatorMap.get(creatorIdOf(f))?.name ?? "?",
    };
  };

  // A series counts as one content: its episodes' numbers are pooled.
  const contentKeyOf = (filmId: string) => {
    const f = filmMap.get(filmId);
    return f?.seriesTitle ?? filmId;
  };
  const contentOf = (key: string): RankedContent => {
    const group = contentGroups.get(key) ?? [];
    const f = group[0] ?? filmMap.get(key);
    const isSeries = !!f?.seriesTitle;
    return {
      id: key,
      title: isSeries ? key : f?.title ?? key,
      kind: isSeries ? "series" : "film",
      creator: f ? creatorMap.get(creatorIdOf(f))?.name ?? "?" : "?",
      category: f?.category ?? "",
      year: f?.year ?? 0,
      episodeCount: isSeries ? group.filter((e) => toEpisodeKind(e.episodeKind) === "episode").length : 0,
    };
  };

  const memberViewsByFilm = new Map<string, number>();
  for (const w of watchRows) memberViewsByFilm.set(w.filmId, (memberViewsByFilm.get(w.filmId) ?? 0) + 1);

  const viewStatsByContent = new Map<string, { memberViews: number; guestViews: number; viewers: Set<string> }>();
  const viewStatsOf = (key: string) => {
    const e = viewStatsByContent.get(key) ?? { memberViews: 0, guestViews: 0, viewers: new Set<string>() };
    viewStatsByContent.set(key, e);
    return e;
  };
  for (const w of watchRows) {
    const e = viewStatsOf(contentKeyOf(w.filmId));
    e.memberViews += 1;
    e.viewers.add(w.userId);
  }
  for (const f of filmRows) if (f.guestViewCount > 0) viewStatsOf(contentKeyOf(f.id)).guestViews += f.guestViewCount;

  const topContents = [...viewStatsByContent.entries()]
    .map(([key, e]) => ({
      ...contentOf(key),
      views: e.memberViews + e.guestViews,
      memberViews: e.memberViews,
      guestViews: e.guestViews,
      viewers: e.viewers.size,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  const topEpisodes = [...viewsByFilm.entries()]
    .filter(([id]) => {
      const f = filmMap.get(id);
      return !!f?.seriesTitle && toEpisodeKind(f.episodeKind) === "episode";
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, views]) => ({
      ...episodeOf(id)!,
      views,
      memberViews: memberViewsByFilm.get(id) ?? 0,
      guestViews: filmMap.get(id)?.guestViewCount ?? 0,
    }));

  // Ratings per content: a film's own ratings; for a series, each user's
  // mean over its episodes, averaged (seriesRatingSummary).
  const ratingsByContent = new Map<string, typeof ratingRows>();
  const ratingsByEpisode = new Map<string, typeof ratingRows>();
  for (const r of ratingRows) {
    const key = contentKeyOf(r.filmId);
    ratingsByContent.set(key, [...(ratingsByContent.get(key) ?? []), r]);
    if (filmMap.get(r.filmId)?.seriesTitle) ratingsByEpisode.set(r.filmId, [...(ratingsByEpisode.get(r.filmId) ?? []), r]);
  }
  const ratingTotal = ratingRows.reduce((sum, r) => sum + r.value, 0);
  const globalAverage = ratingRows.length > 0 ? ratingTotal / ratingRows.length : 0;
  // Bayesian ranking: pull small samples toward the global mean so a single
  // 5★ can't top contents rated by many people.
  const PRIOR_WEIGHT = 3;
  const bayes = (avg: number, n: number) => (avg * n + globalAverage * PRIOR_WEIGHT) / (n + PRIOR_WEIGHT);

  const topRatedContents = [...ratingsByContent.entries()]
    .map(([key, rows]) => {
      const summary = seriesRatingSummary(rows)!;
      return {
        ...contentOf(key),
        average: summary.avg,
        voters: summary.count,
        ratingCount: rows.length,
      };
    })
    .sort((a, b) => bayes(b.average, b.voters) - bayes(a.average, a.voters) || b.voters - a.voters)
    .slice(0, 5);

  const topRatedEpisodes = [...ratingsByEpisode.entries()]
    .map(([id, rows]) => {
      const average = rows.reduce((sum, r) => sum + r.value, 0) / rows.length;
      return { ...episodeOf(id)!, average, count: rows.length };
    })
    .sort((a, b) => bayes(b.average, b.count) - bayes(a.average, a.count) || b.count - a.count)
    .slice(0, 5);

  const commentStatsByContent = new Map<
    string,
    { count: number; replies: number; commenters: Set<string>; byEpisode: Map<string, number> }
  >();
  for (const c of commentRows) {
    const key = contentKeyOf(c.filmId);
    const e = commentStatsByContent.get(key) ?? { count: 0, replies: 0, commenters: new Set<string>(), byEpisode: new Map() };
    commentStatsByContent.set(key, e);
    e.count += 1;
    if (c.parentId) e.replies += 1;
    e.commenters.add(c.userId);
    if (filmMap.get(c.filmId)?.seriesTitle) e.byEpisode.set(c.filmId, (e.byEpisode.get(c.filmId) ?? 0) + 1);
  }
  const topCommentedContents = [...commentStatsByContent.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([key, e]) => {
      const [topEpisodeId, topEpisodeCount] = [...e.byEpisode.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
      return {
        ...contentOf(key),
        count: e.count,
        replies: e.replies,
        commenters: e.commenters.size,
        topEpisode: topEpisodeId ? { ...episodeOf(topEpisodeId)!, count: topEpisodeCount } : null,
      };
    });

  const userById = new Map(userRows.map((u) => [u.id, u]));
  const memberActivity = new Map<
    string,
    { comments: number; ratings: number; ratingSum: number; views: number; favorites: number }
  >();
  const activityOf = (userId: string) => {
    const e = memberActivity.get(userId) ?? { comments: 0, ratings: 0, ratingSum: 0, views: 0, favorites: 0 };
    memberActivity.set(userId, e);
    return e;
  };
  for (const c of commentRows) activityOf(c.userId).comments += 1;
  for (const r of ratingRows) {
    const e = activityOf(r.userId);
    e.ratings += 1;
    e.ratingSum += r.value;
  }
  for (const w of watchRows) activityOf(w.userId).views += 1;
  for (const f of favoriteRows) activityOf(f.userId).favorites += 1;
  const memberScore = (m: { comments: number; ratings: number; favorites: number; views: number }) =>
    m.comments * 3 + m.ratings * 2 + m.favorites + m.views;
  const topMembers = [...memberActivity.entries()]
    .map(([id, a]) => ({
      id,
      name: userById.get(id)?.name ?? "?",
      joinedAt: userById.get(id)?.createdAt ?? "",
      comments: a.comments,
      ratings: a.ratings,
      views: a.views,
      favorites: a.favorites,
      averageGiven: a.ratings > 0 ? a.ratingSum / a.ratings : null,
    }))
    // Writing a comment is worth more than a click.
    .sort((a, b) => memberScore(b) - memberScore(a))
    .slice(0, 5);

  const ratingDistribution = [1, 2, 3, 4, 5].map((v) => ratingRows.filter((r) => r.value === v).length);

  // Timestamps are either ISO strings or SQLite's "YYYY-MM-DD HH:MM:SS" (UTC).
  const timeOf = (at: string) => new Date(at.includes("T") ? at : at.replace(" ", "T") + "Z").getTime();
  const between = (at: string, fromDays: number, toDays: number) => {
    const t = timeOf(at);
    return t >= since(fromDays) && t < since(toDays);
  };
  const trendOf = (dates: string[]): Trend => ({
    current: dates.filter((at) => between(at, 30, 0)).length,
    previous: dates.filter((at) => between(at, 60, 30)).length,
  });

  const activeSince = (days: number) => {
    const ids = new Set<string>();
    for (const rows of [watchRows, commentRows, ratingRows]) {
      for (const r of rows) if (timeOf(r.at) >= since(days)) ids.add(r.userId);
    }
    return ids.size;
  };

  const DAYS = 30;
  const dayKey = (t: number) => new Date(t).toISOString().slice(0, 10);
  const daily = Array.from({ length: DAYS }, (_, i) => ({
    date: dayKey(now - (DAYS - 1 - i) * DAY),
    views: 0,
    interactions: 0,
    signups: 0,
  }));
  const dayIndex = new Map(daily.map((d, i) => [d.date, i]));
  const bump = (at: string, field: "views" | "interactions" | "signups") => {
    const i = dayIndex.get(dayKey(timeOf(at)));
    if (i !== undefined) daily[i][field] += 1;
  };
  for (const w of watchRows) bump(w.at, "views");
  for (const c of commentRows) bump(c.at, "interactions");
  for (const r of ratingRows) bump(r.at, "interactions");
  for (const u of userRows) bump(u.createdAt, "signups");

  const topArtists = [...artistCounts.entries()]
    .filter(([id]) => !creatorMap.get(id)?.isStudio)
    .map(([id, c]) => ({ id, name: creatorMap.get(id)?.name ?? "?", contentCount: c.films + c.series, ...c }))
    .sort((a, b) => b.contentCount - a.contentCount || b.episodes - a.episodes)
    .slice(0, 5);

  const recentFilms = [...contentRepresentatives]
    .sort((a, b) => timeOf(b.createdAt) - timeOf(a.createdAt))
    .slice(0, 40)
    .map((f) => ({
      id: f.id,
      title: f.seriesTitle ?? f.title,
      artistName: creatorMap.get(creatorIdOf(f))?.name ?? "?",
      poster: f.poster,
      kind: (f.seriesTitle ? "series" : "film") as "film" | "series",
      episodeCount: f.seriesTitle
        ? (contentGroups.get(f.seriesTitle) ?? []).filter((e) => toEpisodeKind(e.episodeKind) === "episode").length
        : 0,
      announced: toEpisodeKind(f.episodeKind) === "announcement",
      // For a series, the representative is its most recently added episode.
      // An announcement fiche isn't an episode: no "latest episode" line.
      latestEpisode: toEpisodeKind(f.episodeKind) === "episode" ? episodeOf(f.id) : null,
      createdAt: f.createdAt,
    }));

  const guestViews = filmRows.reduce((sum, f) => sum + f.guestViewCount, 0);

  return {
    filmCount: contentRepresentatives.length,
    episodeCount: filmRows.filter((f) => f.seriesTitle && toEpisodeKind(f.episodeKind) === "episode").length,
    artistCount: artistRows.length,
    studioCount: studioRows.length,
    userCount: userRows.length,
    pendingCount: filmSubs.length + artistSubs.length,
    openMessageCount: messages.filter((m) => m.status === "open").length,
    pendingInviteCount: inviteRows.length,
    totalViews: watchRows.length + guestViews,
    memberViews: watchRows.length,
    guestViews,
    totalFavorites: favoriteRows.length,
    ratingCount: ratingRows.length,
    averageRating: ratingRows.length > 0 ? globalAverage : null,
    ratingDistribution,
    commentCount: commentRows.length,
    reactionUpCount: reactionRows.filter((r) => r.type === "up").length,
    reactionDownCount: reactionRows.filter((r) => r.type === "down").length,
    activeUsers7d: activeSince(7),
    activeUsers30d: activeSince(30),
    trends: {
      views: trendOf(watchRows.map((w) => w.at)),
      signups: trendOf(userRows.map((u) => u.createdAt)),
      comments: trendOf(commentRows.map((c) => c.at)),
      ratings: trendOf(ratingRows.map((r) => r.at)),
    },
    daily,
    topContents,
    topEpisodes,
    topRatedContents,
    topRatedEpisodes,
    topCommentedContents,
    topMembers,
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
    recentComments: recentCommentRows.map(({ filmId, parentId, ...c }) => ({
      ...c,
      contentTitle: contentOf(contentKeyOf(filmId)).title,
      episode: episodeOf(filmId),
      isReply: !!parentId,
    })),
  };
}

const SITE_SETTINGS_ID = "main";

// The countdown columns (reveal_enabled, reveal_at) stay in the table but are no longer used.
export type SiteSettings = {
  maintenanceEnabled: boolean;
  patchNoteEnabled: boolean;
  patchNoteTitle: string | null;
  patchNoteMessage: string | null;
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, SITE_SETTINGS_ID));
  if (!row) {
    return {
      maintenanceEnabled: false,
      patchNoteEnabled: false,
      patchNoteTitle: null,
      patchNoteMessage: null,
    };
  }
  return {
    maintenanceEnabled: row.maintenanceEnabled,
    patchNoteEnabled: row.patchNoteEnabled,
    patchNoteTitle: row.patchNoteTitle,
    patchNoteMessage: row.patchNoteMessage,
  };
}

export async function updateSiteSettings(input: Partial<SiteSettings>): Promise<void> {
  const [existing] = await db.select({ id: siteSettings.id }).from(siteSettings).where(eq(siteSettings.id, SITE_SETTINGS_ID));
  if (existing) {
    await db.update(siteSettings).set(input).where(eq(siteSettings.id, SITE_SETTINGS_ID));
  } else {
    await db.insert(siteSettings).values({
      id: SITE_SETTINGS_ID,
      maintenanceEnabled: false,
      patchNoteEnabled: false,
      patchNoteTitle: null,
      patchNoteMessage: null,
      ...input,
    });
  }
}

export type UserProfileStats = {
  watchedCount: number;
  watchMinutes: number;
  favoritesCount: number;
  commentsCount: number;
  ratingsCount: number;
  avgRatingGiven: number | null;
};

// Activity totals shown at the top of the profile page.
export async function getUserProfileStats(userId: string): Promise<UserProfileStats> {
  const [[watched], [favs], [comms], [rates]] = await Promise.all([
    db
      .select({
        count: sql<number>`count(*)`,
        minutes: sql<number>`coalesce(sum(coalesce(${films.videoDurationSeconds} / 60.0, ${films.durationMinutes})), 0)`,
      })
      .from(watchHistory)
      .innerJoin(films, eq(films.id, watchHistory.filmId))
      .where(eq(watchHistory.userId, userId)),
    db
      .select({ count: sql<number>`count(distinct coalesce(${films.seriesTitle}, ${films.id}))` })
      .from(favorites)
      .innerJoin(films, eq(films.id, favorites.filmId))
      .where(eq(favorites.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(comments).where(eq(comments.userId, userId)),
    db
      .select({ count: sql<number>`count(*)`, avg: sql<number | null>`avg(${filmRatings.value})` })
      .from(filmRatings)
      .where(eq(filmRatings.userId, userId)),
  ]);
  return {
    watchedCount: Number(watched?.count ?? 0),
    watchMinutes: Math.round(Number(watched?.minutes ?? 0)),
    favoritesCount: Number(favs?.count ?? 0),
    commentsCount: Number(comms?.count ?? 0),
    ratingsCount: Number(rates?.count ?? 0),
    avgRatingGiven: rates?.avg == null ? null : Number(rates.avg),
  };
}

// When each content reached the catalogue: its scheduled release or premiere
// if any, its creation otherwise. ISO strings, keyed by film id.
export async function getFilmAddedDates(): Promise<Map<string, string>> {
  const rows = await db
    .select({
      id: films.id,
      createdAt: films.createdAt,
      releaseAt: films.releaseAt,
      premiereAt: films.premiereAt,
    })
    .from(films);
  const toIso = (value: string) => (value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  return new Map(rows.map((r) => [r.id, toIso(r.releaseAt ?? r.premiereAt ?? r.createdAt)]));
}

// When the user last watched each content (ISO string), keyed by film id.
export async function getWatchActivity(userId: string): Promise<Map<string, string>> {
  const rows = await db
    .select({ filmId: watchHistory.filmId, watchedAt: watchHistory.watchedAt })
    .from(watchHistory)
    .where(eq(watchHistory.userId, userId));
  const toIso = (value: string) => (value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  return new Map(rows.map((r) => [r.filmId, toIso(r.watchedAt)]));
}

// When each content was added to the user's list (ISO string), keyed by film id.
export async function getFavoriteDates(userId: string): Promise<Map<string, string>> {
  const rows = await db
    .select({ filmId: favorites.filmId, createdAt: favorites.createdAt })
    .from(favorites)
    .where(eq(favorites.userId, userId));
  const toIso = (value: string) => (value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  return new Map(rows.map((r) => [r.filmId, toIso(r.createdAt)]));
}

export type WatchEntry = {
  // Last time the user watched it (ISO).
  at: string;
  // Where they stopped, in seconds; 0 when finished or barely started.
  position: number;
};

// The user's viewing history with stopping points, keyed by film id.
export async function getWatchEntries(userId: string): Promise<Map<string, WatchEntry>> {
  const rows = await db
    .select({ filmId: watchHistory.filmId, watchedAt: watchHistory.watchedAt, position: watchHistory.positionSeconds })
    .from(watchHistory)
    .where(eq(watchHistory.userId, userId));
  const toIso = (value: string) => (value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  return new Map(rows.map((r) => [r.filmId, { at: toIso(r.watchedAt), position: r.position ?? 0 }]));
}

export async function getWatchPosition(userId: string, filmId: string): Promise<number> {
  const [row] = await db
    .select({ position: watchHistory.positionSeconds })
    .from(watchHistory)
    .where(and(eq(watchHistory.userId, userId), eq(watchHistory.filmId, filmId)));
  return row?.position ?? 0;
}

// Stores where the user stopped (0 once finished) and bumps the activity date
// so the content comes first in "Reprendre".
export async function saveWatchPosition(userId: string, filmId: string, position: number): Promise<void> {
  const value = Math.max(0, Math.round(position));
  const now = new Date().toISOString();
  const [existing] = await db
    .select({ id: watchHistory.id })
    .from(watchHistory)
    .where(and(eq(watchHistory.userId, userId), eq(watchHistory.filmId, filmId)));
  if (existing) {
    await db.update(watchHistory).set({ positionSeconds: value, watchedAt: now }).where(eq(watchHistory.id, existing.id));
  } else {
    await db.insert(watchHistory).values({ id: randomUUID(), userId, filmId, positionSeconds: value, watchedAt: now });
  }
}

// ----- Banners of artists and studios (migration 0043) -----
// The banner column is read and written with raw SQL, outside the Drizzle
// schema: before the migration runs, pages show no banner and saving one
// returns a clear error instead of breaking the site.

export const BANNER_MIGRATION_MESSAGE =
  "Les bannières ne sont pas encore activées : lance la migration 0043 (scripts/apply-0043.ts).";

export async function getBanner(kind: "artist" | "studio", id: string): Promise<string | null> {
  try {
    const rows =
      kind === "artist"
        ? await db.all<{ banner: string | null }>(sql`SELECT banner FROM artists WHERE id = ${id}`)
        : await db.all<{ banner: string | null }>(sql`SELECT banner FROM studios WHERE id = ${id}`);
    return rows[0]?.banner || null;
  } catch (e) {
    if (!isMissingColumn(e)) throw e;
    return null;
  }
}

export async function setBanner(kind: "artist" | "studio", id: string, banner: string | null): Promise<void> {
  const value = banner?.trim() || null;
  try {
    if (kind === "artist") await db.run(sql`UPDATE artists SET banner = ${value} WHERE id = ${id}`);
    else await db.run(sql`UPDATE studios SET banner = ${value} WHERE id = ${id}`);
  } catch (e) {
    if (isMissingColumn(e)) throw new Error(BANNER_MIGRATION_MESSAGE);
    throw e;
  }
}

// ----- Release requested in submissions (migration 0044) -----
// Read and written with raw SQL, outside the Drizzle schema: before the
// migration runs, every submission reads as "immediate release".

export const RELEASE_REQUEST_MIGRATION_MESSAGE =
  "Le choix de la date de sortie n'est pas encore activé : lance la migration 0044 (scripts/apply-0044.ts).";

export async function getReleaseRequests(ids: string[]): Promise<Map<string, ReleaseRequest>> {
  const map = new Map<string, ReleaseRequest>();
  if (ids.length === 0) return map;
  try {
    const rows = await db.all<{ id: string; release_request: string | null }>(
      sql`SELECT id, release_request FROM film_submissions WHERE id IN (${sql.join(
        ids.map((id) => sql`${id}`),
        sql`, `
      )})`
    );
    for (const r of rows) map.set(r.id, parseReleaseRequest(r.release_request));
  } catch (e) {
    if (!isMissingColumn(e)) throw e;
  }
  return map;
}

export async function setReleaseRequest(id: string, request: ReleaseRequest): Promise<void> {
  try {
    await db.run(sql`UPDATE film_submissions SET release_request = ${JSON.stringify(request)} WHERE id = ${id}`);
  } catch (e) {
    if (!isMissingColumn(e)) throw e;
    // Without the column only an immediate release without message can be kept.
    if (request.mode !== "now" || request.note) throw new Error(RELEASE_REQUEST_MIGRATION_MESSAGE);
  }
}

export type PendingSubmission = FilmSubmission & { releaseRequest: ReleaseRequest };

export async function getPendingSubmissionsWithRelease(userId: string): Promise<PendingSubmission[]> {
  const rows = await getPendingFilmSubmissionsByUser(userId);
  const releases = await getReleaseRequests(rows.map((r) => r.id));
  return rows
    .map((r) => ({ ...r, releaseRequest: releases.get(r.id) ?? parseReleaseRequest(null) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteFilmSubmission(id: string): Promise<void> {
  await db.delete(filmSubmissions).where(eq(filmSubmissions.id, id));
}
