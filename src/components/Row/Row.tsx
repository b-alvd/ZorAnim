"use client";

import { useEffect, useRef, useState } from "react";
import Card from "@/components/Card/Card";
import type { Film } from "@/data/mock";
import styles from "./Row.module.css";

export default function Row({
  title,
  films,
  cardWidth,
}: {
  title: string;
  films: Film[];
  cardWidth?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = () => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 0);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  };

  useEffect(() => {
    updateEdges();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateEdges);
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, []);

  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const firstSlot = el.firstElementChild as HTMLElement | null;
    if (!firstSlot) return;
    const gap = parseFloat(getComputedStyle(el).columnGap || "0");
    const step = firstSlot.getBoundingClientRect().width + gap;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section className={styles.row}>
      <h2 className={styles.heading}>{title}</h2>
      <div className={styles.wrap}>
        {!atStart && (
          <button className={`${styles.arrow} ${styles.left}`} onClick={() => scroll(-1)} aria-label="Précédent">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
        )}
        <div className={styles.track} ref={trackRef}>
          {films.map((f) => (
            <div
              key={f.id}
              className={`${styles.slot} ${cardWidth ? styles.slotFixed : ""}`}
              style={cardWidth ? { ["--card-width" as string]: `${cardWidth}px` } : undefined}
            >
              <Card film={f} />
            </div>
          ))}
        </div>
        {!atEnd && (
          <button className={`${styles.arrow} ${styles.right}`} onClick={() => scroll(1)} aria-label="Suivant">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        )}
      </div>
    </section>
  );
}
