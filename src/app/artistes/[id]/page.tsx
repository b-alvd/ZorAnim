import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArtistProfile from "@/components/ArtistProfile/ArtistProfile";
import {
  getArtist,
  getArtists,
  getArtistStudios,
  getFavoriteFilmIds,
  getFilmsByArtist,
  getFilmsByStudio,
  getWatchedFilmIds,
} from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function generateStaticParams() {
  const artists = await getArtists();
  return artists.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const artist = await getArtist(id);
  if (!artist) return { title: "Artiste introuvable | ZorAnim" };

  const description = artist.bio.length > 160 ? `${artist.bio.slice(0, 157)}...` : artist.bio;
  return {
    title: `${artist.name} | ZorAnim`,
    description,
    openGraph: {
      title: artist.name,
      description,
      images: [{ url: artist.avatar }],
      type: "profile",
    },
  };
}

export default async function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();

  const { id } = await params;
  const artist = await getArtist(id);
  if (!artist) notFound();

  const [ownFilms, favoriteIds, watchedIds, artistStudios] = await Promise.all([
    getFilmsByArtist(artist.id),
    user ? getFavoriteFilmIds(user.id) : Promise.resolve(new Set<string>()),
    user ? getWatchedFilmIds(user.id) : Promise.resolve(new Set<string>()),
    getArtistStudios(artist.id),
  ]);

  const studioFilms = (await Promise.all(artistStudios.map((s) => getFilmsByStudio(s.id)))).flat();
  const artistFilms = [...ownFilms, ...studioFilms];

  return (
    <ArtistProfile
      artist={artist}
      artistFilms={artistFilms}
      favoriteIds={favoriteIds}
      watchedIds={watchedIds}
      studios={artistStudios}
    />
  );
}
