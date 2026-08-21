"use client";

import { useEffect, useState } from "react";
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

export default function PremiereBanner({ films }: { films: Film[] }) {
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

  if (phase === "live") {
    const clock = getPremiereLiveClock(film);
    return (
      <Link href={`/watch/${film.id}?autoplay=1`} className={styles.wrap}>
        <span className={styles.tag}>Avant-première en direct</span>
        <span className={styles.title}>{film.seriesTitle ?? film.title}</span>
        {clock && (
          <span className={styles.timer}>
            {formatFull(clock.elapsedSeconds)} sur {formatFull(clock.totalSeconds)}
            {viewerCount !== null && ` · ${viewerCount} spectateur${viewerCount > 1 ? "s" : ""}`}
          </span>
        )}
      </Link>
    );
  }

  const targetIso = phase === "upcoming" ? film.premiereAt : film.releaseAt;
  const target = targetIso ? new Date(targetIso).getTime() : null;
  const remaining = target !== null ? Math.max(0, target - Date.now()) : 0;
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return (
    <Link href={`/watch/${film.id}`} className={styles.wrap}>
      <span className={styles.tag}>{phase === "upcoming" ? "Avant-première à venir" : "SORTIE"}</span>
      <span className={styles.title}>{film.seriesTitle ?? film.title}</span>
      {target !== null && (
        <span className={styles.timer}>
          {days > 0 && `${days}j `}
          {pad(hours)}h {pad(minutes)}m {pad(seconds)}s
        </span>
      )}
    </Link>
  );
}
