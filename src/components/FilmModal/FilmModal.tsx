"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Film } from "@/data/types";
import { toggleFavoriteAction } from "@/lib/actions";
import styles from "./FilmModal.module.css";

const ANIM_MS = 250;

export default function FilmModal({
  film,
  onClose,
  isFavorite = false,
}: {
  film: Film;
  onClose: () => void;
  isFavorite?: boolean;
}) {
  const [shown, setShown] = useState(false);
  const [favorite, setFavorite] = useState(isFavorite);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const requestClose = () => {
    setShown(false);
    setTimeout(onClose, ANIM_MS);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleFavorite = () => {
    startTransition(async () => {
      const result = await toggleFavoriteAction(film.id);
      setFavorite(result);
    });
  };

  return (
    <div className={`${styles.overlay} ${shown ? styles.shown : ""}`} onClick={requestClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={requestClose} aria-label="Fermer">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12" />
            <path d="M18 6L6 18" />
          </svg>
        </button>
        <div className={styles.banner}>
          <Image src={film.poster} alt={film.title} fill sizes="700px" className={styles.bannerImg} unoptimized />
          <div className={styles.bannerShade} />
        </div>
        <div className={styles.body}>
          <h2 className={styles.title}>{film.title}</h2>
          <Link href={`/artistes/${film.artistId}`} className={styles.artist}>
            Par {film.artistName}
          </Link>
          <div className={styles.badges}>
            {film.isNew && <span className={`${styles.badge} ${styles.newBadge}`}>Nouveau</span>}
            <span className={styles.badge}>{film.year}</span>
            <span className={styles.badge}>{film.duration}</span>
            <span className={styles.badge}>{film.rating}</span>
          </div>
          <p className={styles.synopsis}>{film.synopsis}</p>
          <div className={styles.actions}>
            <Link href={`/watch/${film.id}?autoplay=1`} className={styles.playBtn}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Lecture
            </Link>
            <button
              type="button"
              className={`${styles.favBtn} ${favorite ? styles.favActive : ""}`}
              onClick={handleToggleFavorite}
              disabled={isPending}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill={favorite ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 21s-7.5-4.7-10-9.3C.5 8.4 2.3 5 5.6 5c1.9 0 3.4 1 4.4 2.4C11 6 12.5 5 14.4 5c3.3 0 5.1 3.4 3.6 6.7C19.5 16.3 12 21 12 21z" />
              </svg>
              {favorite ? "Dans ma liste" : "Ajouter à ma liste"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
