"use client";

import Link from "next/link";
import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./Row.module.css";

// Horizontal scroller with a title, an optional "Tout voir" link and arrows.
// `size` sets how many items fit on a desktop line.
export default function Shelf({
  title,
  subtitle,
  href,
  size = "card",
  children,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  size?: "card" | "small";
  children: ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const items = Children.toArray(children);

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

  // Moves by one screen of items, keeping the cards aligned on the left edge.
  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    const gap = parseFloat(getComputedStyle(el).columnGap || "0");
    const step = first.getBoundingClientRect().width + gap;
    const perPage = Math.max(1, Math.floor((el.clientWidth + gap) / step));
    const index = Math.round(el.scrollLeft / step) + dir * perPage;
    el.scrollTo({ left: Math.max(0, index * step), behavior: "smooth" });
  };

  return (
    <section className={styles.row}>
      <div className={styles.headingLine}>
        <h2 className={styles.heading}>{title}</h2>
        {subtitle && <span className={styles.subheading}>{subtitle}</span>}
        {href && (
          <Link href={href} className={styles.seeAll}>
            Tout voir
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
        )}
      </div>
      <div className={styles.wrap}>
        {!atStart && (
          <button className={`${styles.arrow} ${styles.left}`} onClick={() => scroll(-1)} aria-label="Précédent">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
        )}
        <div className={styles.track} ref={trackRef}>
          {items.map((child, i) => (
            <div key={i} className={size === "small" ? styles.slotSmall : styles.slot}>
              {child}
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
