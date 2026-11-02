"use client";

import Image from "next/image";
import type { ContentSummary } from "./content-summary";
import styles from "./films/films.module.css";
import own from "./artistes/artists.module.css";

export function plural(n: number, word: string) {
  return `${n} ${word}${n > 1 ? "s" : ""}`;
}

export function Rating({ value, count }: { value: number | null; count: number }) {
  if (value === null || count === 0) return <span className={styles.muted}>—</span>;
  return (
    <span className={styles.rating} title={plural(count, "votant")}>
      ★ {value.toFixed(1)} <span className={styles.muted}>({count})</span>
    </span>
  );
}

export function ContentCounts({ contents }: { contents: ContentSummary[] }) {
  const films = contents.filter((c) => c.kind === "film").length;
  const series = contents.filter((c) => c.kind === "series");
  const episodes = series.reduce((n, c) => n + c.episodeCount, 0);
  if (contents.length === 0) return <span className={styles.muted}>Aucun contenu</span>;
  return (
    <span>
      {[films && plural(films, "film"), series.length && `${plural(series.length, "série")} (${episodes} ép.)`]
        .filter(Boolean)
        .join(" · ")}
    </span>
  );
}

// Contents of an artist or a studio, most recent first.
export default function ContentList({ contents }: { contents: ContentSummary[] }) {
  if (contents.length === 0) return null;
  return (
    <ul className={own.contentList}>
      {[...contents]
        .sort((a, b) => b.latestAt.localeCompare(a.latestAt))
        .map((c) => (
          <li key={c.key} className={own.contentItem}>
            <span className={styles.poster}>
              {c.poster && <Image src={c.poster} alt="" fill sizes="72px" unoptimized />}
            </span>
            <div className={styles.contentText}>
              <span className={styles.contentTitle}>{c.title}</span>
              <span className={styles.contentMeta}>
                <span className={`${styles.kindTag} ${c.kind === "series" ? styles.kindTagSeries : ""}`}>
                  {c.kind === "series" ? `Série · ${c.episodeCount} ép.` : "Film"}
                </span>
                {c.category}
                {c.via && <span className={own.via}>via {c.via}</span>}
              </span>
            </div>
            <span className={own.contentStats}>
              <span>{plural(c.views, "vue")}</span>
              <Rating value={c.avgRating} count={c.ratingCount} />
              <span>{c.comments} comm.</span>
            </span>
          </li>
        ))}
    </ul>
  );
}
