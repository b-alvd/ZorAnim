import Image from "next/image";
import Link from "next/link";
import type { Artist } from "@/data/types";
import { formatCatalogCountLabel } from "@/lib/series";
import styles from "./ArtistCard.module.css";

export default function ArtistCard({
  artist,
  filmCount,
  seriesCount,
}: {
  artist: Artist;
  filmCount: number;
  seriesCount: number;
}) {
  const hasContent = filmCount + seriesCount > 0;
  return (
    <Link href={artist.isStudio ? `/studios/${artist.id}` : `/artistes/${artist.id}`} className={styles.card}>
      <div className={styles.avatarWrap}>
        {artist.avatar ? (
          <Image src={artist.avatar} alt={artist.name} fill sizes="140px" unoptimized className={styles.avatarImg} />
        ) : (
          <span className={styles.initial}>{artist.name.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <p className={styles.name}>{artist.name}</p>
      {artist.bio && <p className={styles.bio}>{artist.bio}</p>}
      <p className={styles.count}>
        {hasContent ? formatCatalogCountLabel(filmCount, seriesCount) : "Pas encore de contenu"}
      </p>
    </Link>
  );
}
