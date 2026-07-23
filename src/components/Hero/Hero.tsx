"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
          <button className={styles.playBtn}>▶ Lecture</button>
          <button className={styles.infoBtn} onClick={() => setShowModal(true)}>
            ⓘ Plus d&apos;infos
          </button>
        </div>
      </div>
      {showModal && <FilmModal film={film} onClose={() => setShowModal(false)} />}
    </section>
  );
}
