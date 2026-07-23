"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Film } from "@/data/mock";
import FilmModal from "@/components/FilmModal/FilmModal";
import styles from "./Hero.module.css";

const INTERVAL_MS = 6000;
const FADE_MS = 500;

export default function Hero({ films }: { films: Film[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (films.length <= 1) return;
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % films.length);
        setVisible(true);
      }, FADE_MS);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [films.length]);

  const film = films[index];

  return (
    <section className={styles.hero}>
      <Image
        src={film.poster}
        alt=""
        fill
        priority
        sizes="100vw"
        className={`${styles.backdrop} ${visible ? styles.visible : ""}`}
        unoptimized
      />
      <div className={styles.shade} />
      <div className={`${styles.content} ${visible ? styles.visible : ""}`}>
        <h1 className={styles.title}>{film.title}</h1>
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
          <button className={styles.infoBtn} onClick={() => setShowModal(true)}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-5" />
              <circle cx="12" cy="8" r="0.5" fill="currentColor" />
            </svg>
            Plus d&apos;infos
          </button>
        </div>
      </div>
      {showModal && <FilmModal film={film} onClose={() => setShowModal(false)} />}
    </section>
  );
}
