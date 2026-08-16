"use client";

import { useState } from "react";
import styles from "./StarRating.module.css";

const STAR_PATH = "M12 2l2.9 6.9 7.1.6-5.4 4.7L18.2 21 12 17.3 5.8 21l1.6-6.8L2 9.5l7.1-.6z";

export default function StarRating({
  value,
  onRate,
  size = 18,
  readOnly = false,
}: {
  value: number;
  onRate?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;

  return (
    <div className={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fillPct = Math.round(Math.max(0, Math.min(1, display - (n - 1))) * 100);
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            className={styles.star}
            style={{ width: size, height: size }}
            onMouseEnter={() => !readOnly && setHover(n)}
            onMouseLeave={() => !readOnly && setHover(null)}
            onClick={() => onRate?.(n)}
            aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
          >
            <span className={styles.starWrap} style={{ width: size, height: size }}>
              <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={styles.starBase}>
                <path d={STAR_PATH} />
              </svg>
              <span className={styles.starFillClip} style={{ width: `${fillPct}%` }}>
                <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={styles.starFill}>
                  <path d={STAR_PATH} />
                </svg>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
