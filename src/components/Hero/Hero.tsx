"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Film } from "@/data/types";
import FilmModal from "@/components/FilmModal/FilmModal";
import styles from "./Hero.module.css";

const INTERVAL_MS = 7000;

export type HeroSlide = {
  film: Film & { episodeCount?: number };
  // Content played by "Lecture": for a series, the next episode to watch.
  playId: string;
  playLabel: string;
  kicker: string;
};

// Featured contents carousel at the top of the home page. The bars at the
// bottom show the position and let you jump to a slide.
//
// A single timer drives the slides. Opening "Plus d'infos" pauses it and
// keeps the time already spent on the slide (`elapsed`); closing resumes with
// only the remaining time. The bar's animation is restarted at that same
// point, so it always matches the timer.
export default function Hero({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const runStartRef = useRef(0);

  const goTo = (i: number) => {
    setIndex(i);
    setElapsed(0);
  };

  useEffect(() => {
    if (slides.length <= 1 || showModal) return;
    runStartRef.current = Date.now();
    const id = setTimeout(() => {
      setIndex((i) => (i + 1) % slides.length);
      setElapsed(0);
    }, Math.max(0, INTERVAL_MS - elapsed));
    return () => clearTimeout(id);
  }, [index, elapsed, showModal, slides.length]);

  const openModal = () => {
    setElapsed((e) => Math.min(INTERVAL_MS, e + Date.now() - runStartRef.current));
    setShowModal(true);
  };

  if (slides.length === 0) return null;
  const { film, playId, playLabel, kicker } = slides[index];
  const isSeries = !!film.seriesTitle;
  const synopsis = (isSeries && film.seriesSynopsis) || film.synopsis;
  const meta = [
    isSeries ? `Série · ${film.episodeCount ?? 1} épisode${(film.episodeCount ?? 1) > 1 ? "s" : ""}` : "Film",
    film.category,
    String(film.year),
    !isSeries && film.duration,
    film.rating,
  ].filter(Boolean);

  return (
    <section className={styles.hero}>
      {slides.map((s, i) => (
        <Image
          key={s.film.id}
          src={s.film.poster}
          alt=""
          fill
          priority={i === 0}
          sizes="100vw"
          className={`${styles.backdrop} ${i === index ? styles.visible : ""}`}
          unoptimized
        />
      ))}
      <div className={styles.shade} />
      <div key={film.id} className={styles.content}>
        <span className={styles.kicker}>{kicker}</span>
        <h1 className={styles.title}>{film.seriesTitle ?? film.title}</h1>
        <div className={styles.meta}>
          {film.ratingCount > 0 && (
            <span className={styles.rating}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7L18.2 21 12 17.3 5.8 21l1.6-6.8L2 9.5l7.1-.6z" />
              </svg>
              {film.avgRating!.toFixed(1).replace(".", ",")}
            </span>
          )}
          {meta.map((m) => (
            <span key={m as string} className={styles.metaItem}>
              {m}
            </span>
          ))}
        </div>
        <p className={styles.synopsis}>{synopsis}</p>
        <div className={styles.actions}>
          <Link href={`/watch/${playId}?autoplay=1`} className={styles.playBtn}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            {playLabel}
          </Link>
          <button className={styles.infoBtn} onClick={openModal}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-5" />
              <circle cx="12" cy="8" r="0.5" fill="currentColor" />
            </svg>
            Plus d&apos;infos
          </button>
        </div>
      </div>

      {slides.length > 1 && (
        <div className={styles.dots} role="tablist" aria-label="Contenus à la une">
          {slides.map((s, i) => (
            <button
              key={s.film.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={s.film.seriesTitle ?? s.film.title}
              className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
              onClick={() => goTo(i)}
            >
              {i === index && (
                // Display only: remounted at each slide and each resume, and
                // started `elapsed` ms in, so it follows the timer.
                <span
                  key={`${index}-${elapsed}`}
                  className={styles.dotFill}
                  style={{
                    animationDuration: `${INTERVAL_MS}ms`,
                    animationDelay: `-${elapsed}ms`,
                    animationPlayState: showModal ? "paused" : "running",
                  }}
                />
              )}
            </button>
          ))}
        </div>
      )}
      {showModal && <FilmModal film={film} onClose={() => setShowModal(false)} />}
    </section>
  );
}
