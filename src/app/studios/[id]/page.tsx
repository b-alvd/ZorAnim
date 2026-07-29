import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import ArtistProfile from "@/components/ArtistProfile/ArtistProfile";
import {
  getArtist,
  getArtists,
  getFavoriteFilmIds,
  getFilmsByArtist,
  getStudioMembers,
  getWatchedFilmIds,
} from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function generateStaticParams() {
  const artists = await getArtists();
  return artists.filter((a) => a.isStudio).map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const studio = await getArtist(id);
  if (!studio) return { title: "Studio introuvable | ZorAnim" };

  const description = studio.bio.length > 160 ? `${studio.bio.slice(0, 157)}...` : studio.bio;
  return {
    title: `${studio.name} | ZorAnim`,
    description,
    openGraph: {
      title: studio.name,
      description,
      images: [{ url: studio.avatar }],
      type: "profile",
    },
  };
}

export default async function StudioPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const { id } = await params;
  const studio = await getArtist(id);
  if (!studio) notFound();
  if (!studio.isStudio) redirect(`/artistes/${id}`);

  const [studioFilms, favoriteIds, watchedIds, members] = await Promise.all([
    getFilmsByArtist(studio.id),
    getFavoriteFilmIds(user.id),
    getWatchedFilmIds(user.id),
    getStudioMembers(studio.id),
  ]);

  return (
    <ArtistProfile artist={studio} artistFilms={studioFilms} favoriteIds={favoriteIds} watchedIds={watchedIds} members={members} />
  );
}
