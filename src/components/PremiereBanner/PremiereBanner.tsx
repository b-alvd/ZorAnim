"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

// Clock ticking every second, shared by all banners. Its server snapshot is
// null: the countdown depends on the current second, which the server and the
// browser never agree on, so it only renders on the client (no hydration
// mismatch). Ticking also lets the banner pick up premiere start/end live.
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
    }, 1000);
  }
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0 && clockTimer) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  };
}

// `hero`: shown at the very top of the home page, in place of the carousel,
// at full height.
export default function PremiereBanner({ films, hero = false }: { films: Film[]; hero?: boolean }) {
  const now = useSyncExternalStore(subscribeClock, () => clockNow, () => null);
  const isClient = now !== null;
  // Viewer count of the live premiere, tagged with its film so a count from
  // a previous live never shows on another one.
  const [viewers, setViewers] = useState<{ filmId: string; count: number } | null>(null);
  const router = useRouter();

  // Only one h1 per page: the banner is the page title on the home page only.
  const TitleTag = hero ? "h1" : "h2";
  const featured = pickFeaturedPremiere(films);
  const filmId = featured?.phase === "live" ? featured.film.id : null;
  const viewerCount = viewers && viewers.filmId === filmId ? viewers.count : null;

  useEffect(() => {
    if (!filmId) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/watch/${filmId}/premiere-heartbeat`, { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (typeof data?.count === "number") setViewers({ filmId, count: data.count });
        // Stopped early by staff: reload the server data so the banner moves
        // on to its post-premiere phase (or disappears).
        if (data?.live === false) router.refresh();
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
  }, [filmId, router]);

  if (!featured) return null;
  const { film, phase } = featured;
  const title = film.seriesTitle ?? film.title;
  // After the live premiere, while waiting for the official release, the
  // release banner takes over -- falling back to the premiere one if unset.
  const bannerImage = phase === "waiting" ? (film.releaseBanner ?? film.premiereBanner) : film.premiereBanner;

  if (phase === "live") {
    const clock = isClient ? getPremiereLiveClock(film) : null;
    const href = `/watch/${film.id}?autoplay=1`;
    const viewers =
      viewerCount !== null ? `${viewerCount} spectateur${viewerCount > 1 ? "s" : ""}` : null;

    if (!bannerImage) {
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
    const progressBar = clock && (
      <span className={styles.progress} aria-hidden>
        <span className={styles.progressFill} style={{ width: `${progress}%` }} />
      </span>
    );

    return (
      <ImageBanner image={bannerImage} href={href} phase={phase} hero={hero}>
        <div className={`${styles.content} ${styles.heroContent}`}>
          <span className={`${styles.heroKicker} ${styles.heroKickerLive}`}>
            <span className={styles.liveDot} />
            Avant-première en direct
          </span>
          <TitleTag className={styles.heroTitle}>{title}</TitleTag>
          <HeroMeta
            items={[
              clock && `${formatFull(clock.elapsedSeconds)} / ${formatFull(clock.totalSeconds)}`,
              viewers,
              film.seriesTitle ? "Série" : "Film",
              film.category,
            ]}
          />
          <p className={styles.synopsis}>{film.synopsis}</p>
          <span className={styles.cta}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
            Rejoindre le direct
          </span>
        </div>
        {progressBar}
      </ImageBanner>
    );
  }

  const targetIso = phase === "upcoming" ? film.premiereAt : film.releaseAt;
  const target = targetIso ? new Date(targetIso).getTime() : null;
  const remaining = target !== null && now !== null ? Math.max(0, target - now) : 0;
  // Rounded up, same as the waiting room, so both show the same second.
  const totalSeconds = Math.ceil(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const href = `/watch/${film.id}`;
  const label = phase === "upcoming" ? "Avant-première à venir" : "SORTIE";

  if (!bannerImage) {
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

  const countdown = target !== null && isClient && (
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
  );
  const countdownLabel = phase === "upcoming" ? "Début du direct dans" : "Disponible dans";

  const date =
    target !== null && isClient
      ? new Date(target).toLocaleString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  // Laid out like the home page carousel, on the home page (hero) as on the
  // visitors landing page.
  return (
    <ImageBanner image={bannerImage} href={href} phase={phase} hero={hero}>
      <div className={`${styles.content} ${styles.heroContent}`}>
        <span className={styles.heroKicker}>{phase === "upcoming" ? "Avant-première" : "Sortie officielle"}</span>
        <TitleTag className={styles.heroTitle}>{title}</TitleTag>
        <HeroMeta items={[date, film.seriesTitle ? "Série" : "Film", film.category]} />
        <p className={styles.synopsis}>{film.synopsis}</p>
        {countdown && (
          <div className={styles.heroCountdown}>
            <span className={styles.countdownLabel}>{countdownLabel}</span>
            {countdown}
          </div>
        )}
        <span className={styles.cta}>
          Rejoindre la salle d&apos;attente
          <svg className={styles.ctaArrow} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14" />
            <path d="M13 6l6 6-6 6" />
          </svg>
        </span>
      </div>
    </ImageBanner>
  );
}

// Info line under the hero title, "·"-separated like the carousel's.
function HeroMeta({ items }: { items: (string | null | undefined | false)[] }) {
  const shown = items.filter((i): i is string => !!i);
  if (shown.length === 0) return null;
  return (
    <div className={styles.heroMeta}>
      {shown.map((item) => (
        <span key={item} className={styles.heroMetaItem}>
          {item}
        </span>
      ))}
    </div>
  );
}

// With a banner image, the <img> itself sets the banner's height at the
// picture's own proportions -- never squeezed into a fixed strip. Only an
// image taller than the height cap gets trimmed, top and bottom, so it always
// spans the full width.
function ImageBanner({
  image,
  href,
  phase,
  hero,
  children,
}: {
  image: string;
  href: string;
  phase: string;
  hero: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`${styles.imageWrap} ${hero ? styles.imageWrapHero : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" className={styles.image} />
      <span className={styles.shade} aria-hidden />
      {/* Keyed on the phase: when the countdown hits zero and the banner
          goes live (or the live ends), the content replays its entrance
          instead of swapping abruptly. The picture stays put, unless the
          release banner takes over once the live is done. */}
      <div key={phase} className={styles.overlay}>
        {children}
      </div>
    </Link>
  );
}
