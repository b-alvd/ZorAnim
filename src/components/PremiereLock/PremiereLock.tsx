"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Film } from "@/data/types";
import styles from "./PremiereLock.module.css";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export default function PremiereLock({
  film,
  unlockAt,
  hasAired,
}: {
  film: Film;
  unlockAt: string | null;
  hasAired: boolean;
}) {
  const router = useRouter();
  const target = unlockAt ? new Date(unlockAt).getTime() : null;
  // Start from Date.now(), never from `target` -- seeding `now` with `target`
  // makes the very first render read as "time's up" and fire the redirect
  // effect immediately, before the countdown ever has a chance to show.
  const [now, setNow] = useState(() => Date.now());
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  useEffect(() => {
    if (target && now >= target && !triggeredRef.current) {
      triggeredRef.current = true;
      window.location.href = hasAired ? window.location.pathname : `${window.location.pathname}?autoplay=1`;
    }
  }, [now, target, hasAired]);

  const remaining = target !== null ? Math.max(0, target - now) : 0;
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return (
    <div className={styles.wrap}>
      <Image src={film.poster} alt="" fill unoptimized className={styles.bg} />
      <button className={styles.backBtn} onClick={() => router.back()} aria-label="Retour">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      </button>
      <div className={styles.shadow} />
      <div className={styles.content}>
        <span className={styles.tag}>{hasAired ? "Avant-première terminée" : "Avant-première"}</span>
        <h1 className={styles.title}>{film.seriesTitle ?? film.title}</h1>
        <p className={styles.sub}>
          {hasAired
            ? target
              ? "L'avant-première en direct est terminée. Rendez-vous à la sortie officielle :"
              : "L'avant-première en direct est terminée. Reviens à la sortie officielle."
            : "Ce contenu sera disponible à partir de :"}
        </p>
        {target !== null && (
          <div className={styles.timer} aria-live="polite">
            {days > 0 && (
              <>
                <div className={styles.unit}>
                  <span className={styles.digits}>{pad(days)}</span>
                  <span className={styles.label}>Jours</span>
                </div>
                <span className={styles.colon}>:</span>
              </>
            )}
            <div className={styles.unit}>
              <span className={styles.digits}>{pad(hours)}</span>
              <span className={styles.label}>Heures</span>
            </div>
            <span className={styles.colon}>:</span>
            <div className={styles.unit}>
              <span className={styles.digits}>{pad(minutes)}</span>
              <span className={styles.label}>Min</span>
            </div>
            <span className={styles.colon}>:</span>
            <div className={styles.unit}>
              <span className={styles.digits}>{pad(seconds)}</span>
              <span className={styles.label}>Sec</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
