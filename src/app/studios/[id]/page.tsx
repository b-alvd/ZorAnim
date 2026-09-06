import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArtistProfile from "@/components/ArtistProfile/ArtistProfile";
import RequestToJoinButton from "@/components/RequestToJoinButton/RequestToJoinButton";
import {
  getArtistByUserId,
  getFavoriteFilmIds,
  getFilmsByStudio,
  getStudio,
  getStudioMembershipStatus,
  getStudios,
  getWatchedFilmIds,
} from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function generateStaticParams() {
  const studioList = await getStudios();
  return studioList.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const studio = await getStudio(id);
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

  const { id } = await params;
  const studio = await getStudio(id);
  if (!studio) notFound();

  const [studioFilms, favoriteIds, watchedIds, personalArtist, membershipStatus] = await Promise.all([
    getFilmsByStudio(studio.id),
    user ? getFavoriteFilmIds(user.id) : Promise.resolve(new Set<string>()),
    user ? getWatchedFilmIds(user.id) : Promise.resolve(new Set<string>()),
    user ? getArtistByUserId(user.id) : Promise.resolve(undefined),
    user ? getStudioMembershipStatus(studio.id, user.id) : Promise.resolve(null),
  ]);

  return (
    <ArtistProfile
      artist={studio}
      artistFilms={studioFilms}
      favoriteIds={favoriteIds}
      watchedIds={watchedIds}
      joinButton={
        <RequestToJoinButton
          studioId={studio.id}
          isLoggedIn={!!user}
          hasArtistProfile={!!personalArtist}
          membershipStatus={membershipStatus}
        />
      }
    />
  );
}
