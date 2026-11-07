"use client";

import Image from "next/image";
import Link from "next/link";
import type { Film } from "@/data/types";
import { episodeName, formatEpisodeTag } from "@/lib/series";
import { formatRemaining } from "@/lib/watch-progress";
import styles from "./PauseScreen.module.css";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s}` : `${m}:${s}`;
}

// Overlay shown while the video is paused: the paused image stays visible
// behind a gradient, with the content's info, where you are, the actions,
// and for a series its episodes. Clicking the empty area resumes.
export default function PauseScreen({
  film,
  episodes,
  episodeProgress,
  lockedEpisodeIds,
  current,
  duration,
  started,
  onResume,
  onRestart,
}: {
  film: Film;
  episodes: Film[];
  episodeProgress: Record<string, number>;
  lockedEpisodeIds: string[];
  current: number;
  duration: number;
  started: boolean;
  onResume: () => void;
  onRestart: () => void;
}) {
  const isSeries = !!film.seriesTitle && episodes.length > 0;
  const locked = new Set(lockedEpisodeIds);
  const pct = duration ? Math.min(100, (current / duration) * 100) : 0;
  const meta = [String(film.year), film.duration, film.rating].filter(Boolean);
  const artistHref = film.isStudioAttribution ? `/studios/${film.artistId}` : `/artistes/${film.artistId}`;

  return (
    <div className={styles.overlay} onClick={onResume}>
      <div className={styles.shade} aria-hidden="true" />

      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <div className={styles.info}>
          <span className={styles.kicker}>En pause</span>
          <h1 className={styles.title}>{film.seriesTitle ?? film.title}</h1>
          {isSeries && (
            <p className={styles.episode}>
              <span className={styles.episodeTag}>{formatEpisodeTag(film)}</span>
              {episodeName(film.title, film.seriesTitle!)}
            </p>
          )}
          <p className={styles.meta}>
            {meta.map((m) => (
              <span key={m} className={styles.metaItem}>
                {m}
              </span>
            ))}
            <Link href={artistHref} className={styles.metaItem}>
              Par <span className={styles.artist}>{film.artistName}</span>
            </Link>
          </p>
          {film.synopsis && <p className={styles.synopsis}>{film.synopsis}</p>}

          {started && duration > 0 && (
            <div className={styles.progress}>
              <span className={styles.bar}>
                <span style={{ width: `${pct}%` }} />
              </span>
              <span className={styles.time}>
                {formatTime(current)} / {formatTime(duration)}
                <span className={styles.remaining}>{formatRemaining(duration - current)}</span>
              </span>
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.primaryBtn} onClick={onResume} autoFocus>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              {started ? "Reprendre" : "Lecture"}
            </button>
            {started && current > 10 && (
              <button type="button" className={styles.ghostBtn} onClick={onRestart}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 12a8 8 0 1 0 2.34-5.66" />
                  <path d="M4 4v5h5" />
                </svg>
                Recommencer
              </button>
            )}
          </div>
        </div>

        {isSeries && (
          <section className={styles.episodes}>
            <h2 className={styles.label}>Épisodes</h2>
            <div className={styles.rail}>
              {episodes.map((ep) => {
                const isCurrent = ep.id === film.id;
                const isLocked = locked.has(ep.id);
                const progress = isCurrent ? current : episodeProgress[ep.id];
                const total = isCurrent && duration ? duration : (ep.videoDurationSeconds ?? ep.durationMinutes * 60);
                const body = (
                  <>
                    <span className={styles.thumb}>
                      <Image src={ep.poster} alt="" fill sizes="220px" unoptimized />
                      {isCurrent && <span className={styles.nowBadge}>En cours</span>}
                      {progress !== undefined && progress > 0 && (
                        <span className={styles.thumbBar}>
                          <span style={{ width: `${Math.min(100, (progress / total) * 100)}%` }} />
                        </span>
                      )}
                    </span>
                    <span className={styles.epLine}>
                      <span className={styles.epTag}>{formatEpisodeTag(ep)}</span>
                      {isLocked ? (
                        <span className={styles.state}>Bientôt</span>
                      ) : (
                        !isCurrent && episodeProgress[ep.id] === 0 && <span className={`${styles.state} ${styles.stateDone}`}>Vu</span>
                      )}
                    </span>
                    <span className={styles.epTitle}>{episodeName(ep.title, film.seriesTitle!)}</span>
                  </>
                );
                if (isCurrent) {
                  return (
                    <button key={ep.id} type="button" className={`${styles.ep} ${styles.epCurrent}`} onClick={onResume}>
                      {body}
                    </button>
                  );
                }
                return isLocked ? (
                  <div key={ep.id} className={`${styles.ep} ${styles.epLocked}`}>
                    {body}
                  </div>
                ) : (
                  <Link key={ep.id} href={`/watch/${ep.id}?autoplay=1`} className={styles.ep}>
                    {body}
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
