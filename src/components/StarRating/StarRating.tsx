"use client";

import { useState } from "react";
import styles from "./StarRating.module.css";

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
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          className={`${styles.star} ${n <= Math.round(display) ? styles.filled : ""}`}
          style={{ width: size, height: size }}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(null)}
          onClick={() => onRate?.(n)}
          aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
        >
          <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
            <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7L18.2 21 12 17.3 5.8 21l1.6-6.8L2 9.5l7.1-.6z" />
          </svg>
        </button>
      ))}
    </div>
  );
}
