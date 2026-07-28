import Link from "next/link";
import styles from "./Pagination.module.css";

function buildHref(basePath: string, params: Record<string, string | undefined>, page: number) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export default function Pagination({
  page,
  totalPages,
  basePath,
  params = {},
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <Link
        href={buildHref(basePath, params, page - 1)}
        className={`${styles.navBtn} ${page <= 1 ? styles.disabled : ""}`}
        aria-disabled={page <= 1}
      >
        ← Précédent
      </Link>

      <div className={styles.pages}>
        {pages.map((p, i) => (
          <span key={p} className={styles.pageWrap}>
            {i > 0 && pages[i - 1] !== p - 1 && <span className={styles.ellipsis}>…</span>}
            <Link href={buildHref(basePath, params, p)} className={`${styles.pageLink} ${p === page ? styles.pageActive : ""}`}>
              {p}
            </Link>
          </span>
        ))}
      </div>

      <Link
        href={buildHref(basePath, params, page + 1)}
        className={`${styles.navBtn} ${page >= totalPages ? styles.disabled : ""}`}
        aria-disabled={page >= totalPages}
      >
        Suivant →
      </Link>
    </nav>
  );
}
