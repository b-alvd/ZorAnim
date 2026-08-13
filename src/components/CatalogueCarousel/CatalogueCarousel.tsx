"use client";

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import type { Film } from "@/data/types";
import styles from "./CatalogueCarousel.module.css";

const BASE_SPEED = 45;
const HOVER_SPEED = 10;
const MIN_LOOP_ITEMS = 16;
const STATIC_THRESHOLD = 4;

export default function CatalogueCarousel({ films }: { films: (Film & { episodeCount?: number })[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef(BASE_SPEED);
  const targetSpeedRef = useRef(BASE_SPEED);
  const offsetRef = useRef(0);

  // Too few distinct posters make the loop's repeats obvious (looks like
  // duplicates); below the threshold, show them once, static, no looping.
  const isStatic = films.length < STATIC_THRESHOLD;
  const rawRepeat = Math.ceil(MIN_LOOP_ITEMS / films.length);
  const repeatCount = isStatic ? 1 : Math.max(2, rawRepeat % 2 === 0 ? rawRepeat : rawRepeat + 1);
  const items = useMemo(
    () => (isStatic ? films : Array.from({ length: repeatCount }, () => films).flat()),
    [films, isStatic, repeatCount]
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track || isStatic || films.length === 0) return;
    let raf: number;
    let last = performance.now();

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      speedRef.current += (targetSpeedRef.current - speedRef.current) * Math.min(1, dt * 3);
      offsetRef.current += speedRef.current * dt;
      const half = track.scrollWidth / 2;
      if (half > 0 && offsetRef.current >= half) offsetRef.current -= half;
      track.style.transform = `translateX(-${offsetRef.current}px)`;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [films.length, isStatic]);

  if (films.length === 0) return null;

  return (
    <div
      className={`${styles.viewport} ${isStatic ? styles.staticViewport : ""}`}
      onMouseEnter={() => (targetSpeedRef.current = HOVER_SPEED)}
      onMouseLeave={() => (targetSpeedRef.current = BASE_SPEED)}
    >
      <div className={styles.track} ref={trackRef}>
        {items.map((f, i) => {
          const title = f.seriesTitle ?? f.title;
          return (
            <div key={`${f.id}-${i}`} className={styles.card}>
              <div className={styles.imgWrap}>
                <Image src={f.poster} alt={title} fill sizes="260px" unoptimized className={styles.img} />
              </div>
              <div className={styles.shade} />
              <span className={styles.title}>{title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
