"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Film } from "@/data/types";
import { episodeName, formatEpisodeTag } from "@/lib/series";
import styles from "./EndScreen.module.css";

// Seconds before the next episode starts by itself.
const AUTOPLAY_SECONDS = 10;
const ROW_SIZE = 4;

type Suggestion = Film & { episodeCount?: number };

const ReplayIcon = (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M4 12a8 8 0 1 0 2.34-5.66" />
    <path d="M4 4v5h5" />
  </svg>
);

const PlayIcon = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

// Screen shown when a film or an episode ends. It fits on one screen:
// a header (what ended + Revoir / Retour), then a single row:
// - the next episode, started automatically after a countdown;
// - otherwise the series' episodes not watched yet, if any;
// - otherwise suggestions.
export default function EndScreen({
  film,
  episodes,
  episodeProgress,
  lockedEpisodeIds,
  suggestions,
  onReplay,
}: {
  film: Film;
  episodes: Film[];
  episodeProgress: Record<string, number>;
  lockedEpisodeIds: string[];
  suggestions: Suggestion[];
  onReplay: () => void;
}) {
  const router = useRouter();
  const locked = new Set(lockedEpisodeIds);
  const isSeries = !!film.seriesTitle && episodes.length > 0;
  const index = episodes.findIndex((e) => e.id === film.id);
  const next = index >= 0 ? episodes[index + 1] : undefined;
  const nextPlayable = next && !locked.has(next.id) ? next : undefined;
  // Released episodes never finished (skipped earlier, or left in the middle).
  const unwatched = episodes.filter(
    (e) => e.id !== film.id && !locked.has(e.id) && episodeProgress[e.id] !== 0
  );

  const [remaining, setRemaining] = useState(AUTOPLAY_SECONDS);
  const [autoplay, setAutoplay] = useState(!!nextPlayable);

  useEffect(() => {
    if (!autoplay || !nextPlayable) return;
    if (remaining <= 0) {
      router.push(`/watch/${nextPlayable.id}?autoplay=1`);
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [autoplay, remaining, nextPlayable, router]);

  const status = !isSeries
    ? null
    : nextPlayable
      ? null
      : next
        ? `Le prochain épisode, ${formatEpisodeTag(next)} « ${next.title} », arrive bientôt.`
        : unwatched.length > 0
          ? "C'était le dernier épisode sorti, mais il t'en reste à voir."
          : "Tu as vu tous les épisodes disponibles.";

  return (
    <div className={styles.screen}>
      <Image src={film.poster} alt="" fill sizes="100vw" unoptimized className={styles.backdrop} />
      <div className={styles.shade} />

      <div className={styles.inner}>
        <header className={styles.head}>
          <div className={styles.headText}>
            <span className={styles.kicker}>
              {isSeries ? `Épisode terminé · ${formatEpisodeTag(film)}` : "Film terminé"}
            </span>
            <h2 className={styles.title}>
              {film.seriesTitle ?? film.title}
              {isSeries && <span className={styles.titleEpisode}>{episodeName(film.title, film.seriesTitle!)}</span>}
            </h2>
            {status && (
              <p className={styles.status}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 12l5 5L20 7" />
                </svg>
                {status}
              </p>
            )}
          </div>
          <div className={styles.headActions}>
            <button type="button" className={styles.ghostBtn} onClick={onReplay}>
              {ReplayIcon}
              Revoir
            </button>
            <Link href="/" className={styles.ghostBtn}>
              Retour à l&apos;accueil
            </Link>
          </div>
        </header>

        {nextPlayable ? (
          <div className={styles.next}>
            <Link href={`/watch/${nextPlayable.id}?autoplay=1`} className={styles.nextThumb}>
              <Image src={nextPlayable.poster} alt="" fill sizes="440px" unoptimized />
              <span className={styles.nextPlay} aria-hidden="true">
                {PlayIcon}
              </span>
            </Link>
            <div className={styles.nextBody}>
              <span className={styles.label}>À suivre · {formatEpisodeTag(nextPlayable)}</span>
              <h3 className={styles.nextTitle}>{nextPlayable.title}</h3>
              <p className={styles.nextMeta}>{nextPlayable.duration}</p>
              {nextPlayable.synopsis && <p className={styles.nextSynopsis}>{nextPlayable.synopsis}</p>}
              <div className={styles.actions}>
                <Link href={`/watch/${nextPlayable.id}?autoplay=1`} className={styles.primaryBtn}>
                  {autoplay ? (
                    <span className={styles.ring} aria-hidden="true">
                      <svg viewBox="0 0 36 36" width="22" height="22">
                        <circle cx="18" cy="18" r="15" className={styles.ringTrack} />
                        <circle
                          cx="18"
                          cy="18"
                          r="15"
                          className={styles.ringFill}
                          style={{ animationDuration: `${AUTOPLAY_SECONDS}s` }}
                        />
                      </svg>
                    </span>
                  ) : (
                    PlayIcon
                  )}
                  {autoplay ? `Épisode suivant dans ${remaining} s` : "Regarder l'épisode suivant"}
                </Link>
                {autoplay && (
                  <button type="button" className={styles.ghostBtn} onClick={() => setAutoplay(false)}>
                    Annuler
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : unwatched.length > 0 ? (
          <section className={styles.section}>
            <h3 className={styles.label}>Épisodes pas encore vus</h3>
            <div className={styles.row}>
              {unwatched.slice(0, ROW_SIZE).map((ep) => {
                const progress = episodeProgress[ep.id];
                const total = ep.videoDurationSeconds ?? ep.durationMinutes * 60;
                return (
                  <Link key={ep.id} href={`/watch/${ep.id}?autoplay=1`} className={styles.item}>
                    <span className={styles.thumb}>
                      <Image src={ep.poster} alt="" fill sizes="280px" unoptimized />
                      {progress > 0 && (
                        <span className={styles.bar}>
                          <span style={{ width: `${Math.min(100, (progress / total) * 100)}%` }} />
                        </span>
                      )}
                    </span>
                    <span className={styles.itemTitle}>
                      {formatEpisodeTag(ep)} · {ep.title}
                    </span>
                    <span className={styles.itemMeta}>{progress > 0 ? "En cours" : ep.duration}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : (
          suggestions.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.label}>À voir ensuite</h3>
              <div className={styles.row}>
                {suggestions.slice(0, ROW_SIZE).map((s) => (
                  <Link key={s.id} href={`/watch/${s.id}?autoplay=1`} className={styles.item}>
                    <span className={styles.thumb}>
                      <Image src={s.poster} alt="" fill sizes="280px" unoptimized />
                      {s.ratingCount > 0 && (
                        <span className={styles.rating}>★ {s.avgRating!.toFixed(1).replace(".", ",")}</span>
                      )}
                    </span>
                    <span className={styles.itemTitle}>{s.seriesTitle ?? s.title}</span>
                    <span className={styles.itemMeta}>
                      {s.seriesTitle
                        ? `Série · ${s.episodeCount ?? 1} épisode${(s.episodeCount ?? 1) > 1 ? "s" : ""}`
                        : `Film · ${s.duration}`}{" "}
                      · {s.category}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )
        )}
      </div>
    </div>
  );
}
