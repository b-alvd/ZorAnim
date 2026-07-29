import Image from "next/image";
import Card from "@/components/Card/Card";
import type { Artist, Film } from "@/data/types";
import { getSeriesEpisodeIds, getStudioTeamDisplay } from "@/db/queries";
import { collapseSeries, computeEffectiveWatchedIds } from "@/lib/series";
import styles from "./ArtistProfile.module.css";

export default async function ArtistProfile({
  artist,
  artistFilms,
  favoriteIds,
  watchedIds,
}: {
  artist: Artist;
  artistFilms: Film[];
  favoriteIds: Set<string>;
  watchedIds: Set<string>;
}) {
  const team = artist.isStudio ? await getStudioTeamDisplay(artist.id) : [];
  const collapsedFilms = collapseSeries(artistFilms);
  const seriesTitles = [...new Set(collapsedFilms.filter((f) => f.seriesTitle).map((f) => f.seriesTitle!))];
  const episodeIdsMap = await getSeriesEpisodeIds(seriesTitles);
  const effectiveWatchedIds = computeEffectiveWatchedIds(collapsedFilms, watchedIds, episodeIdsMap);

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
          {artist.isStudio && team.length > 0 && (
            <div className={styles.members}>
              <span className={styles.membersLabel}>Membres :</span>{" "}
              {team.map((m) => (m.isOwner ? `${m.name} (fondateur)` : m.name)).join(", ")}
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
              isWatched={effectiveWatchedIds.has(f.id)}
              episodeCount={f.episodeCount}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
