import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import ArtistProfile from "@/components/ArtistProfile/ArtistProfile";
import {
  getArtist,
  getArtists,
  getFavoriteFilmIds,
  getFilmsByArtist,
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
  if (!user) redirect("/connexion");

  const { id } = await params;
  const artist = await getArtist(id);
  if (!artist) notFound();

  const [artistFilms, favoriteIds, watchedIds] = await Promise.all([
    getFilmsByArtist(artist.id),
    getFavoriteFilmIds(user.id),
    getWatchedFilmIds(user.id),
  ]);

  return (
    <ArtistProfile artist={artist} artistFilms={artistFilms} favoriteIds={favoriteIds} watchedIds={watchedIds} />
  );
}
