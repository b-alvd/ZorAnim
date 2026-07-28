import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Card from "@/components/Card/Card";
import {
  getArtist,
  getArtists,
  getFavoriteFilmIds,
  getFilmsByArtist,
  getStudioMembers,
  getWatchedFilmIds,
} from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import styles from "./artist.module.css";

export async function generateStaticParams() {
  const artists = await getArtists();
  return artists.map((a) => ({ id: a.id }));
}

export default async function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const { id } = await params;
  const artist = await getArtist(id);
  if (!artist) notFound();

  const [artistFilms, favoriteIds, watchedIds, members] = await Promise.all([
    getFilmsByArtist(artist.id),
    getFavoriteFilmIds(user.id),
    getWatchedFilmIds(user.id),
    artist.isStudio ? getStudioMembers(artist.id) : Promise.resolve([]),
  ]);
  const activeMembers = members.filter((m) => m.status === "active");

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div className={styles.avatarWrap}>
          <Image src={artist.avatar} alt={artist.name} fill sizes="140px" unoptimized />
        </div>
        <div>
          <div className={styles.nameRow}>
            <h1 className={styles.name}>{artist.name}</h1>
            {artist.isStudio && <span className={styles.studioBadge}>Studio</span>}
          </div>
          <p className={styles.bio}>{artist.bio}</p>
          <p className={styles.count}>
            {artistFilms.length} film{artistFilms.length > 1 ? "s" : ""} sur ZorAnim
          </p>
          {artist.isStudio && activeMembers.length > 0 && (
            <div className={styles.members}>
              <span className={styles.membersLabel}>Membres :</span>{" "}
              {activeMembers.map((m) => m.name).join(", ")}
            </div>
          )}
        </div>
      </div>

      <div className={styles.filmsSection}>
        <h2 className={styles.filmsTitle}>Films</h2>
        <div className={styles.grid}>
          {artistFilms.map((f) => (
            <Card key={f.id} film={f} isFavorite={favoriteIds.has(f.id)} isWatched={watchedIds.has(f.id)} />
          ))}
        </div>
      </div>
    </main>
  );
}
