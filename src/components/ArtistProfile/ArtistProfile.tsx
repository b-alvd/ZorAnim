import Image from "next/image";
import Link from "next/link";
import Card from "@/components/Card/Card";
import type { Artist, Film } from "@/data/types";
import { getSeriesEpisodeIds, getStudioTeamDisplay } from "@/db/queries";
import {
  collapseSeries,
  computeEffectiveWatchedIds,
  countFilmsAndSeries,
  formatCatalogCountLabel,
  splitComingSoon,
} from "@/lib/series";
import styles from "./ArtistProfile.module.css";

export default async function ArtistProfile({
  artist,
  artistFilms,
  favoriteIds,
  watchedIds,
  studios = [],
}: {
  artist: Artist;
  artistFilms: Film[];
  favoriteIds: Set<string>;
  watchedIds: Set<string>;
  studios?: { id: string; name: string; isOwner: boolean }[];
}) {
  const team = artist.isStudio ? await getStudioTeamDisplay(artist.id) : [];
  const collapsedFilms = collapseSeries(splitComingSoon(artistFilms).released);
  const { filmCount, seriesCount } = countFilmsAndSeries(artistFilms);
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
          <p className={styles.count}>{formatCatalogCountLabel(filmCount, seriesCount)} sur ZorAnim</p>
          {artist.isStudio && team.length > 0 && (
            <div className={styles.members}>
              <span className={styles.membersLabel}>Membres :</span>{" "}
              {team.map((m, i) => (
                <span key={i}>
                  {m.artistId ? (
                    <Link href={`/artistes/${m.artistId}`} className={styles.memberLink}>
                      {m.name}
                    </Link>
                  ) : (
                    m.name
                  )}
                  {m.isOwner && " (fondateur)"}
                  {i < team.length - 1 && ", "}
                </span>
              ))}
            </div>
          )}
          {!artist.isStudio && studios.length > 0 && (
            <div className={styles.members}>
              <span className={styles.membersLabel}>Studio{studios.length > 1 ? "s" : ""} :</span>{" "}
              {studios.map((s, i) => (
                <span key={s.id}>
                  <Link href={`/studios/${s.id}`} className={styles.memberLink}>
                    {s.name}
                  </Link>
                  {s.isOwner && " (fondateur)"}
                  {i < studios.length - 1 && ", "}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.filmsSection}>
        <h2 className={styles.filmsTitle}>Films</h2>
        <div className={styles.grid}>
          {collapsedFilms.map((f) => (
            <div key={f.id} className={styles.filmSlot}>
              <Card
                film={f}
                isFavorite={favoriteIds.has(f.id)}
                isWatched={effectiveWatchedIds.has(f.id)}
                episodeCount={f.episodeCount}
              />
              {!artist.isStudio && f.isStudioAttribution && (
                <Link href={`/studios/${f.artistId}`} className={styles.filmStudioTag}>
                  Avec {f.artistName}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
