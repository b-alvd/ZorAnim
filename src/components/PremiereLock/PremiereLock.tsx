"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Film } from "@/data/types";
import { episodeName } from "@/lib/series";
import styles from "./PremiereLock.module.css";

// How long the "C'est parti !" moment lasts before switching to the player.
const LAUNCH_ANIMATION_MS = 1400;

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

// Shared clock, ticking every 250ms rather than 1s so the final 10-9-8…
// lands on the real second boundary instead of up to a second late.
let clockNow = 0;
const clockListeners = new Set<() => void>();
let clockTimer: ReturnType<typeof setInterval> | null = null;

function subscribeClock(listener: () => void) {
  clockListeners.add(listener);
  if (!clockTimer) {
    clockNow = Date.now();
    clockTimer = setInterval(() => {
      clockNow = Date.now();
      clockListeners.forEach((l) => l());
    }, 250);
  }
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0 && clockTimer) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  };
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
  // Null on the server and during hydration: the server's second never
  // matches the browser's, so the countdown only renders on the client.
  const now = useSyncExternalStore(subscribeClock, () => clockNow, () => null);
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (target && now !== null && now >= target && !triggeredRef.current) {
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

  const remaining = target !== null && now !== null ? Math.max(0, target - now) : 0;
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
  const isLaunching = isPremiereEvent && !hasAired && target !== null && now !== null;
  const finalSeconds = isLaunching && totalSeconds <= 10 ? totalSeconds : null;

  const isSeries = !!film.seriesTitle;
  const episode =
    isSeries && film.episodeNumber
      ? `${film.seasonNumber ? `S${film.seasonNumber} · ` : ""}Épisode ${film.episodeNumber}`
      : null;
  const episodeTitle = isSeries ? episodeName(film.title, film.seriesTitle!) : null;
  // Fixed time zone: rendered on the server too, so it must not depend on the
  // machine's own zone (the site's audience is in France).
  const date = target
    ? new Date(target).toLocaleString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Paris",
      })
    : null;
  // [value, label, wrap] -- `wrap` is the unit's base, so the value the
  // countdown just left is always (value + 1) % wrap: what the digits roll
  // away from, as on the home page banner.
  const units: [number, string, number][] = [
    ...(days > 0 ? ([[days, days > 1 ? "jours" : "jour", Infinity]] as [number, string, number][]) : []),
    [hours, "heures", days > 0 ? 24 : Infinity],
    [minutes, "min", 60],
    [seconds, "sec", 60],
  ];

  const kicker = !isPremiereEvent ? "Bientôt disponible" : hasAired ? "Avant-première terminée" : "Avant-première";
  const countdownLabel = !isPremiereEvent
    ? "Disponible dans"
    : hasAired
      ? "Sortie officielle dans"
      : "Début du direct dans";
  // Only after the live, to explain why the content still can't be watched.
  const note =
    isPremiereEvent && hasAired
      ? target
        ? "Le direct est terminé : le contenu sera disponible à la demande à sa sortie officielle."
        : "Le direct est terminé. Reviens à la sortie officielle."
      : null;

  return (
    <div className={styles.wrap}>
      <Image src={film.poster} alt="" fill unoptimized className={styles.bg} />
      <div className={styles.shadow} />
      <button className={styles.backBtn} onClick={() => router.back()} aria-label="Retour">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      </button>
      <div className={`${styles.content} ${finalSeconds !== null ? styles.contentAway : ""}`}>
        <span className={styles.kicker}>
          {isPremiereEvent && !hasAired && <span className={styles.waitDot} />}
          {kicker}
        </span>
        <h1 className={styles.title}>{film.seriesTitle ?? film.title}</h1>
        <div className={styles.meta}>
          {[date, episode, episodeTitle && episodeTitle !== film.seriesTitle ? episodeTitle : null, isSeries ? null : "Film", film.category]
            .filter((m): m is string => !!m)
            .map((m) => (
              <span key={m} className={styles.metaItem}>
                {m}
              </span>
            ))}
        </div>
        {film.synopsis && <p className={styles.synopsis}>{film.synopsis}</p>}
        {target !== null && (
          <div className={styles.countdownBlock}>
            <span className={styles.countdownLabel}>{countdownLabel}</span>
            <div className={styles.timer} aria-live="polite">
              {units.map(([value, unit, wrap]) => (
                <div key={unit} className={styles.unit}>
                  <span className={styles.digits}>
                    {/* Keyed on the value so each change replays the roll:
                        the new value slides in from above, the old one out
                        below. */}
                    {now === null ? (
                      // Placeholder until the clock runs, so nothing jumps.
                      <span>--</span>
                    ) : (
                      <span key={value} className={styles.roll}>
                        <span>{pad(value)}</span>
                        <span aria-hidden>{pad((value + 1) % wrap)}</span>
                      </span>
                    )}
                  </span>
                  <span className={styles.label}>{unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {note && <p className={styles.note}>{note}</p>}
      </div>
      {finalSeconds !== null && (
        <div className={styles.final} aria-live="assertive">
          {finalSeconds > 0 ? (
            <div className={styles.finalCount}>
              <span className={styles.kicker}>
                <span className={styles.waitDot} />
                Le direct commence
              </span>
              <div className={styles.finalDial}>
                {/* The ring empties over each second; keyed on the value so
                    the ring and the number replay at every tick. */}
                <svg key={`ring-${finalSeconds}`} className={styles.finalRing} viewBox="0 0 100 100" aria-hidden>
                  <circle className={styles.finalTrack} cx="50" cy="50" r="46" />
                  <circle className={styles.finalArc} cx="50" cy="50" r="46" pathLength="100" />
                </svg>
                <span key={finalSeconds} className={styles.finalNumber}>
                  {finalSeconds}
                </span>
              </div>
              <span className={styles.finalFilm}>{film.seriesTitle ?? film.title}</span>
            </div>
          ) : (
            <div className={styles.finalLaunch}>
              <span className={styles.finalLaunchKicker}>
                <span className={styles.liveDot} />
                En direct
              </span>
              <span className={styles.finalTitle}>C&apos;est parti !</span>
              <span className={styles.finalCurtain} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
