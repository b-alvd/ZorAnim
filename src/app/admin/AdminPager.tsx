"use client";

import styles from "./pager.module.css";

// Page numbers to show: always the first and last, the current one and its
// neighbours, with "…" for the gaps (e.g. 1 … 4 5 6 … 12).
function pageList(page: number, count: number): (number | "gap")[] {
  const wanted = new Set([0, count - 1, page - 1, page, page + 1]);
  const pages = [...wanted].filter((p) => p >= 0 && p < count).sort((a, b) => a - b);
  const result: (number | "gap")[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) result.push(p - pages[i - 1] === 2 ? p - 1 : "gap");
    result.push(p);
  });
  return result;
}

// Numbered pagination for the admin lists (0-based page). Hidden when
// everything fits on one page.
export default function AdminPager({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  const go = (next: number) => {
    onChange(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav className={styles.pager} aria-label="Pagination">
      <button
        type="button"
        className={styles.arrow}
        disabled={page === 0}
        onClick={() => go(page - 1)}
        aria-label="Page précédente"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      {pageList(page, pageCount).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className={styles.gap}>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            className={`${styles.page} ${p === page ? styles.current : ""}`}
            onClick={() => go(p)}
            aria-current={p === page ? "page" : undefined}
          >
            {p + 1}
          </button>
        )
      )}
      <button
        type="button"
        className={styles.arrow}
        disabled={page === pageCount - 1}
        onClick={() => go(page + 1)}
        aria-label="Page suivante"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </nav>
  );
}
