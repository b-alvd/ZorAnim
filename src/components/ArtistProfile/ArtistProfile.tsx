import Image from "next/image";
import Card from "@/components/Card/Card";
import type { Artist, Film } from "@/data/types";
import type { StudioMemberInfo } from "@/db/queries";
import { collapseSeries } from "@/lib/series";
import styles from "./ArtistProfile.module.css";

export default function ArtistProfile({
  artist,
  artistFilms,
  favoriteIds,
  watchedIds,
  members,
}: {
  artist: Artist;
  artistFilms: Film[];
  favoriteIds: Set<string>;
  watchedIds: Set<string>;
  members: StudioMemberInfo[];
}) {
  const activeMembers = members.filter((m) => m.status === "active");
  const collapsedFilms = collapseSeries(artistFilms);

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
            {collapsedFilms.length} film{collapsedFilms.length > 1 ? "s" : ""} sur ZorAnim
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
          {collapsedFilms.map((f) => (
            <Card
              key={f.id}
              film={f}
              isFavorite={favoriteIds.has(f.id)}
              isWatched={watchedIds.has(f.id)}
              episodeCount={f.episodeCount}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
