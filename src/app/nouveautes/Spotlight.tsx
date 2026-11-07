"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import FilmModal from "@/components/FilmModal/FilmModal";
import type { Film } from "@/data/types";
import styles from "./nouveautes.module.css";

// Large card for the latest addition.
export default function Spotlight({
  film,
  playId,
  kicker,
  when,
  isFavorite,
}: {
  film: Film & { episodeCount?: number };
  playId: string;
  kicker: string;
  when: string;
  isFavorite: boolean;
}) {
  const [open, setOpen] = useState(false);
  const isSeries = !!film.seriesTitle;
  const synopsis = (isSeries && film.seriesSynopsis) || film.synopsis;

  return (
    <section className={styles.spotlight}>
      <div className={styles.spotlightMedia}>
        <Image src={film.poster} alt="" fill sizes="(max-width: 900px) 100vw, 60vw" unoptimized priority />
      </div>
      <div className={styles.spotlightBody}>
        <span className={styles.spotlightKicker}>
          {kicker} · {when}
        </span>
        <h2 className={styles.spotlightTitle}>{film.seriesTitle ?? film.title}</h2>
        <p className={styles.spotlightMeta}>
          {[isSeries ? "Série" : "Film", film.category, film.year, film.artistName].join(" · ")}
        </p>
        <p className={styles.spotlightSynopsis}>{synopsis}</p>
        <div className={styles.spotlightActions}>
          <Link href={`/watch/${playId}?autoplay=1`} className={styles.playBtn}>
            <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Regarder
          </Link>
          <button type="button" className={styles.infoBtn} onClick={() => setOpen(true)}>
            Plus d&apos;infos
          </button>
        </div>
      </div>
      {open && <FilmModal film={film} onClose={() => setOpen(false)} isFavorite={isFavorite} />}
    </section>
  );
}
