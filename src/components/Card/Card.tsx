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
}: {
  film: Film;
  isFavorite?: boolean;
  isWatched?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className={styles.card} onClick={() => setOpen(true)}>
        <Image
          src={film.poster}
          alt={film.title}
          fill
          sizes="340px"
          className={styles.bg}
          unoptimized
        />
        {isWatched && <span className={styles.watchedBadge}>Vu</span>}
        {isFavorite && (
          <span className={styles.favBadge} aria-label="Dans ma liste">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M12 21s-7.5-4.7-10-9.3C.5 8.4 2.3 5 5.6 5c1.9 0 3.4 1 4.4 2.4C11 6 12.5 5 14.4 5c3.3 0 5.1 3.4 3.6 6.7C19.5 16.3 12 21 12 21z" />
            </svg>
          </span>
        )}
        <span className={styles.title}>{film.title}</span>
      </button>
      {open && <FilmModal film={film} onClose={() => setOpen(false)} isFavorite={isFavorite} />}
    </>
  );
}
