"use client";

import { Children, useState } from "react";
import styles from "./dashboard.module.css";

// Renders server-built items a page at a time, so lists that keep growing
// (comments, uploads…) stay compact on the dashboard. Every page is stacked in
// the same grid cell and only the current one is visible, so the card keeps
// the height of its tallest page instead of jumping when paging.
export default function PagedList({
  children,
  pageSize = 4,
  className,
}: {
  children: React.ReactNode;
  pageSize?: number;
  className?: string;
}) {
  const items = Children.toArray(children);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const [page, setPage] = useState(0);
  const current = Math.min(page, pageCount - 1);

  return (
    <>
      <div className={styles.pagerStack}>
        {Array.from({ length: pageCount }, (_, i) => (
          <ul
            key={i}
            className={`${className ?? ""} ${i === current ? "" : styles.pagerHidden}`}
            aria-hidden={i !== current}
            inert={i !== current}
          >
            {items.slice(i * pageSize, (i + 1) * pageSize)}
          </ul>
        ))}
      </div>
      {pageCount > 1 && (
        <div className={styles.pager}>
          <button
            type="button"
            className={styles.pagerBtn}
            onClick={() => setPage(current - 1)}
            disabled={current === 0}
            aria-label="Page précédente"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className={styles.pagerLabel}>
            {current + 1} / {pageCount}
          </span>
          <button
            type="button"
            className={styles.pagerBtn}
            onClick={() => setPage(current + 1)}
            disabled={current === pageCount - 1}
            aria-label="Page suivante"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
