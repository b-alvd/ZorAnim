"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getArtist, type Film } from "@/data/mock";
import styles from "./FilmModal.module.css";

const ANIM_MS = 250;

export default function FilmModal({ film, onClose }: { film: Film; onClose: () => void }) {
  const artist = getArtist(film.artistId);
  const [shown, setShown] = useState(false);

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

  return (
    <div className={`${styles.overlay} ${shown ? styles.shown : ""}`} onClick={requestClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={requestClose} aria-label="Fermer">
          ✕
        </button>
        <div className={styles.banner}>
          <Image src={film.poster} alt={film.title} fill sizes="700px" className={styles.bannerImg} unoptimized />
          <div className={styles.bannerShade} />
        </div>
        <div className={styles.body}>
          <h2 className={styles.title}>{film.title}</h2>
          {artist && (
            <Link href={`/artistes/${artist.id}`} className={styles.artist}>
              Par {artist.name}
            </Link>
          )}
          <div className={styles.badges}>
            {film.isNew && <span className={`${styles.badge} ${styles.newBadge}`}>Nouveau</span>}
            <span className={styles.badge}>{film.year}</span>
            <span className={styles.badge}>{film.duration}</span>
            <span className={styles.badge}>{film.rating}</span>
          </div>
          <p className={styles.synopsis}>{film.synopsis}</p>
          <div className={styles.actions}>
            <Link href={`/watch/${film.id}?autoplay=1`} className={styles.playBtn}>
              ▶ Lecture
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
