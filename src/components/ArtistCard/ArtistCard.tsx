import Image from "next/image";
import Link from "next/link";
import type { Artist } from "@/data/mock";
import styles from "./ArtistCard.module.css";

export default function ArtistCard({ artist, filmCount }: { artist: Artist; filmCount: number }) {
  return (
    <Link href={`/artistes/${artist.id}`} className={styles.card}>
      <div className={styles.avatarWrap}>
        <Image src={artist.avatar} alt={artist.name} fill sizes="140px" unoptimized />
      </div>
      <p className={styles.name}>{artist.name}</p>
      <p className={styles.count}>
        {filmCount} film{filmCount > 1 ? "s" : ""}
      </p>
    </Link>
  );
}
