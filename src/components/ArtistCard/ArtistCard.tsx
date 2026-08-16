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
  return (
    <Link href={artist.isStudio ? `/studios/${artist.id}` : `/artistes/${artist.id}`} className={styles.card}>
      <div className={styles.avatarWrap}>
        <Image src={artist.avatar} alt={artist.name} fill sizes="140px" unoptimized className={styles.avatarImg} />
      </div>
      <p className={styles.name}>{artist.name}</p>
      <p className={styles.count}>{formatCatalogCountLabel(filmCount, seriesCount)}</p>
    </Link>
  );
}
