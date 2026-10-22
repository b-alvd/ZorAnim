"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { Film } from "@/data/types";
import { getPremiereLiveClock, pickFeaturedPremiere } from "@/lib/premiere";
import styles from "./PremiereBanner.module.css";

function pad(n: number) {
  return Math.floor(n).toString().padStart(2, "0");
}

function formatFull(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

const noopSubscribe = () => () => {};

export default function PremiereBanner({ films }: { films: Film[] }) {
  // The countdown depends on the current second, which the server and the
  // browser never agree on -- render it only once on the client, otherwise
  // hydration fails on the mismatched digits.
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  // Ticks every second so the banner picks up premiere start/end transitions
  // live, without a page reload -- the server only supplies the raw film
  // dates, the phase (upcoming/live/waiting) is derived fresh every tick.
  const [, forceTick] = useState(0);
  const [viewerCount, setViewerCount] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const featured = pickFeaturedPremiere(films);
  const filmId = featured?.phase === "live" ? featured.film.id : null;

  useEffect(() => {
    if (!filmId) {
      setViewerCount(null);
      return;
    }
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/watch/${filmId}/premiere-heartbeat`, { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && typeof data?.count === "number") setViewerCount(data.count);
      } catch {
        // Network hiccup — try again next tick.
      }
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [filmId]);

  if (!featured) return null;
  const { film, phase } = featured;
  const title = film.seriesTitle ?? film.title;

  if (phase === "live") {
    const clock = isClient ? getPremiereLiveClock(film) : null;
    const href = `/watch/${film.id}?autoplay=1`;
    const viewers =
      viewerCount !== null ? `${viewerCount} spectateur${viewerCount > 1 ? "s" : ""}` : null;

    if (!film.premiereBanner) {
      return (
        <Link href={href} className={styles.wrap}>
          <span className={styles.tag}>
            <span className={styles.liveDot} />
            Avant-première en direct
          </span>
          <span className={styles.title}>{title}</span>
          {clock && (
            <span className={styles.timer}>
              {formatFull(clock.elapsedSeconds)} sur {formatFull(clock.totalSeconds)}
              {viewers && ` · ${viewers}`}
            </span>
          )}
        </Link>
      );
    }

    const progress = clock ? Math.min(100, (clock.elapsedSeconds / clock.totalSeconds) * 100) : 0;
    return (
      <ImageBanner film={film} href={href}>
        <div className={styles.content}>
          <span className={`${styles.tag} ${styles.tagLive}`}>
            <span className={styles.liveDot} />
            En direct
          </span>
          <h2 className={styles.heroTitle}>{title}</h2>
          <p className={styles.synopsis}>{film.synopsis}</p>
          <span className={styles.cta}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
              <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" />
            </svg>
            Rejoindre le direct
          </span>
        </div>
        <div className={styles.side}>
          {clock && (
            <span className={styles.liveClock}>
              {formatFull(clock.elapsedSeconds)} <span className={styles.muted}>/ {formatFull(clock.totalSeconds)}</span>
            </span>
          )}
          {viewers && <span className={styles.viewers}>{viewers}</span>}
        </div>
        {clock && (
          <span className={styles.progress} aria-hidden>
            <span className={styles.progressFill} style={{ width: `${progress}%` }} />
          </span>
        )}
      </ImageBanner>
    );
  }

  const targetIso = phase === "upcoming" ? film.premiereAt : film.releaseAt;
  const target = targetIso ? new Date(targetIso).getTime() : null;
  const remaining = target !== null && isClient ? Math.max(0, target - Date.now()) : 0;
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const href = `/watch/${film.id}`;
  const label = phase === "upcoming" ? "Avant-première à venir" : "SORTIE";

  if (!film.premiereBanner) {
    return (
      <Link href={href} className={styles.wrap}>
        <span className={styles.tag}>{label}</span>
        <span className={styles.title}>{title}</span>
        {target !== null && isClient && (
          <span className={styles.timer}>
            {days > 0 && `${days}j `}
            {pad(hours)}h {pad(minutes)}m {pad(seconds)}s
          </span>
        )}
      </Link>
    );
  }

  // [value, label, wrap] -- `wrap` is the unit's base, so the digit a
  // countdown just left is always (value + 1) % wrap: no state needed to know
  // what to roll away from.
  const units: [number, string, number][] = [
    ...(days > 0 ? ([[days, days > 1 ? "jours" : "jour", Infinity]] as [number, string, number][]) : []),
    [hours, "heures", days > 0 ? 24 : Infinity],
    [minutes, "min", 60],
    [seconds, "sec", 60],
  ];

  return (
    <ImageBanner film={film} href={href}>
      <div className={styles.content}>
        <span className={styles.tag}>{phase === "upcoming" ? "Avant-première" : "Sortie officielle"}</span>
        <h2 className={styles.heroTitle}>{title}</h2>
        {target !== null && isClient && (
          <p className={styles.date}>
            {new Date(target).toLocaleString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
        <p className={styles.synopsis}>{film.synopsis}</p>
        <span className={styles.cta}>
          Rejoindre la salle d&apos;attente
          <svg className={styles.ctaArrow} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14" />
            <path d="M13 6l6 6-6 6" />
          </svg>
        </span>
      </div>
      {target !== null && isClient && (
        <div className={styles.side}>
          <span className={styles.countdownLabel}>
            {phase === "upcoming" ? "Début du direct dans" : "Disponible dans"}
          </span>
          <div className={styles.countdown}>
            {units.map(([value, unit, wrap]) => (
              <span key={unit} className={styles.unit}>
                <span className={styles.unitWindow}>
                  {/* Keyed on the value so each change replays the roll: the
                      new digit slides in from above, the old one out below. */}
                  <span key={value} className={styles.unitRoll}>
                    <span>{pad(value)}</span>
                    <span aria-hidden>{pad((value + 1) % wrap)}</span>
                  </span>
                </span>
                <span className={styles.unitLabel}>{unit}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </ImageBanner>
  );
}

// With a banner image, the <img> itself sets the banner's height at the
// picture's own proportions -- never squeezed into a fixed strip. Only an
// image taller than the height cap gets trimmed, top and bottom, so it always
// spans the full width.
function ImageBanner({ film, href, children }: { film: Film; href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={styles.imageWrap}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={film.premiereBanner!} alt="" className={styles.image} />
      <span className={styles.shade} aria-hidden />
      <div className={styles.overlay}>{children}</div>
    </Link>
  );
}
