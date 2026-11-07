import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Artist } from "@/data/types";
import { formatEpisodeTag } from "@/lib/series";
import type { ContinueItem } from "@/lib/progress";
import { formatRemaining } from "@/lib/watch-progress";
import styles from "./ExtraCards.module.css";

const MODE_LABEL = { resume: "", next: "Épisode suivant", start: "À regarder" };

// "Reprendre" card: a content left in the middle (with its progress bar), or
// the next episode of a series.
export function ContinueCard({ item }: { item: ContinueItem }) {
  const { film, mode, position, duration } = item;
  const pct = mode === "resume" && duration > 0 ? Math.min(100, Math.round((position / duration) * 100)) : 0;
  return (
    <Link href={`/watch/${film.id}?autoplay=1`} className={styles.continue}>
      <div className={styles.thumb}>
        <Image src={film.poster} alt="" fill sizes="340px" unoptimized className={styles.thumbImg} />
        <span className={styles.play} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        {mode !== "resume" && <span className={styles.modeBadge}>{MODE_LABEL[mode]}</span>}
        {pct > 0 && (
          <span className={styles.progress}>
            <span className={styles.progressFill} style={{ width: `${pct}%` }} />
          </span>
        )}
      </div>
      <div className={styles.continueText}>
        <span className={styles.continueSeries}>{film.seriesTitle ?? film.title}</span>
        <span className={styles.continueEpisode}>
          {film.seriesTitle ? `${formatEpisodeTag(film)} · ${film.title}` : `Film · ${film.category}`}
        </span>
        <span className={styles.continueMeta}>
          {mode === "resume" ? formatRemaining(duration - position) : film.duration}
        </span>
      </div>
    </Link>
  );
}

// Round avatar and name of an artist or a studio.
export function CreatorChip({ creator, subtitle }: { creator: Artist; subtitle: string }) {
  return (
    <Link href={creator.isStudio ? `/studios/${creator.id}` : `/artistes/${creator.id}`} className={styles.creator}>
      <span className={styles.creatorAvatar}>
        {creator.avatar ? (
          <Image src={creator.avatar} alt="" fill sizes="120px" unoptimized className={styles.thumbImg} />
        ) : (
          creator.name.charAt(0).toUpperCase()
        )}
      </span>
      <span className={styles.creatorName}>{creator.name}</span>
      <span className={styles.creatorMeta}>{subtitle}</span>
    </Link>
  );
}

// A card with one or two lines of context under it.
export function Captioned({ kicker, detail, children }: { kicker: string; detail?: string; children: ReactNode }) {
  return (
    <div className={styles.captioned}>
      {children}
      <div className={styles.caption}>
        <span className={styles.kicker}>{kicker}</span>
        {detail && <span className={styles.detail}>{detail}</span>}
      </div>
    </div>
  );
}
