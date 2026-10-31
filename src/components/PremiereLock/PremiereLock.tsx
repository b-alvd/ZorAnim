"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Film } from "@/data/types";
import styles from "./PremiereLock.module.css";

// How long the "C'est parti !" moment lasts before switching to the player.
const LAUNCH_ANIMATION_MS = 1400;

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
  // No premiereAt at all means this is just a plain scheduled release date
  // (e.g. a series episode programmed in advance) -- not a live event, so
  // none of the "avant-première" language applies.
  const isPremiereEvent = !!film.premiereAt;
  const router = useRouter();
  const target = unlockAt ? new Date(unlockAt).getTime() : null;
  // Start from Date.now(), never from `target` -- seeding `now` with `target`
  // makes the very first render read as "time's up" and fire the redirect
  // effect immediately, before the countdown ever has a chance to show.
  const [now, setNow] = useState(() => Date.now());
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (!target) return;
    // 250ms rather than 1s so the final 10-9-8… lands on the real second
    // boundary instead of up to a second late.
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [target]);

  useEffect(() => {
    if (target && now >= target && !triggeredRef.current) {
      triggeredRef.current = true;
      // Only force autoplay for an actual premiere going live -- a plain
      // scheduled release (or the post-premiere official release) just
      // becomes a normal on-demand watch, no forced autoplay.
      const shouldAutoplay = isPremiereEvent && !hasAired;
      // In-app navigation, not a full reload: the browser keeps remembering
      // the visitor already clicked on the site, so the premiere player is
      // allowed to start with sound instead of muted.
      const go = () => {
        // The ?autoplay=1 URL is new, so replace() alone fetches the fresh
        // page; only the same-URL case needs refresh(). Doing both made two
        // round-trips and left the screen black for seconds.
        if (shouldAutoplay) router.replace(`${window.location.pathname}?autoplay=1`);
        else router.refresh();
      };
      // A live premiere gets a short "C'est parti !" beat before switching;
      // the player then syncs to the live position, so nothing is missed.
      if (shouldAutoplay) setTimeout(go, LAUNCH_ANIMATION_MS);
      else go();
    }
  }, [now, target, hasAired, isPremiereEvent, router]);

  const remaining = target !== null ? Math.max(0, target - now) : 0;
  // Whole seconds left, rounded up: shows 00:00:01 until it's really zero,
  // like any countdown. The big final 10-9-8… uses this same value, so both
  // always change on the very same tick.
  const totalSeconds = Math.ceil(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  // Final countdown: only for a premiere about to go live, not a plain
  // release date nor the wait after a premiere already aired.
  const isLaunching = isPremiereEvent && !hasAired && target !== null;
  const finalSeconds = isLaunching && totalSeconds <= 10 ? totalSeconds : null;

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
      <div className={`${styles.content} ${finalSeconds !== null ? styles.contentAway : ""}`}>
        <span className={styles.tag}>
          {!isPremiereEvent ? "Bientôt disponible" : hasAired ? "Avant-première terminée" : "Avant-première"}
        </span>
        <h1 className={styles.title}>{film.seriesTitle ?? film.title}</h1>
        <p className={styles.sub}>
          {!isPremiereEvent
            ? "Ce contenu sera disponible à partir de :"
            : hasAired
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
      {finalSeconds !== null && (
        <div className={styles.final} aria-live="assertive">
          {finalSeconds > 0 ? (
            // Keyed on the value so every second replays the pop + ring.
            <div key={finalSeconds} className={styles.finalTick}>
              <span className={styles.finalRing} />
              <span className={styles.finalNumber}>{finalSeconds}</span>
            </div>
          ) : (
            <div className={styles.finalLaunch}>
              <span className={styles.finalBurst} />
              <span className={styles.finalTitle}>C&apos;est parti !</span>
              <span className={styles.finalCurtain} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
