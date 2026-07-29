"use client";

import { useState } from "react";
import Image from "next/image";
import type { Film } from "@/data/types";
import FilmModal from "@/components/FilmModal/FilmModal";
import styles from "./Card.module.css";

export default function Card({
  film,
  isFavorite = false,
  isWatched = false,
  episodeCount = 1,
}: {
  film: Film;
  isFavorite?: boolean;
  isWatched?: boolean;
  episodeCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const isSeries = !!film.seriesTitle;

  return (
    <>
      <button className={styles.card} onClick={() => setOpen(true)}>
        <Image
          src={film.poster}
          alt={isSeries ? film.seriesTitle! : film.title}
          fill
          sizes="340px"
          className={styles.bg}
          unoptimized
        />
        <div className={styles.badgeStack}>
          {isWatched && <span className={styles.watchedBadge}>Vu</span>}
          {film.ratingCount > 0 && (
            <span className={styles.ratingBadge}>
              <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
                <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7L18.2 21 12 17.3 5.8 21l1.6-6.8L2 9.5l7.1-.6z" />
              </svg>
              {film.avgRating!.toFixed(1)}
            </span>
          )}
          {isFavorite && (
            <span className={styles.favBadge} aria-label="Dans ma liste">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </span>
          )}
        </div>
        {isSeries ? (
          <span className={styles.title}>
            <span className={styles.titleText}>{film.seriesTitle}</span>
            <span className={styles.seriesSubtitle}>
              Série ({episodeCount} ép{episodeCount > 1 ? "s" : ""}.)
            </span>
          </span>
        ) : (
          <span className={styles.title}>
            <span className={styles.titleText}>{film.title}</span>
          </span>
        )}
      </button>
      {open && <FilmModal film={film} onClose={() => setOpen(false)} isFavorite={isFavorite} />}
    </>
  );
}
