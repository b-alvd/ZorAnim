import { eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { films, artists } from "@/db/schema";
import type { Film, Artist } from "@/data/types";

const filmSelection = {
  id: films.id,
  title: films.title,
  synopsis: films.synopsis,
  year: films.year,
  duration: films.duration,
  rating: films.rating,
  category: films.category,
  artistId: films.artistId,
  artistName: artists.name,
  isNew: films.isNew,
  poster: films.poster,
  videoUrl: films.videoUrl,
};

function filmsQuery() {
  return db.select(filmSelection).from(films).innerJoin(artists, eq(films.artistId, artists.id));
}

export async function getFilms(): Promise<Film[]> {
  return filmsQuery();
}

export async function getFilm(id: string): Promise<Film | undefined> {
  const [film] = await filmsQuery().where(eq(films.id, id));
  return film;
}

export async function getNewFilms(): Promise<Film[]> {
  return filmsQuery().where(eq(films.isNew, true));
}

export async function getFilmsByCategory(category: string): Promise<Film[]> {
  return filmsQuery().where(eq(films.category, category));
}

export async function getFilmsByArtist(artistId: string): Promise<Film[]> {
  return filmsQuery().where(eq(films.artistId, artistId));
}

export async function getSuggestions(excludeId: string, limit = 4): Promise<Film[]> {
  const rows = await filmsQuery().where(ne(films.id, excludeId));
  return rows.slice(0, limit);
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
