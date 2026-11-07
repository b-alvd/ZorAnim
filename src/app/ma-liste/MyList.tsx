"use client";

import RefreshOnReturn from "@/components/RefreshOnReturn/RefreshOnReturn";
import Link from "next/link";
import { useMemo, useState } from "react";
import Card from "@/components/Card/Card";
import Dropdown from "@/components/Dropdown/Dropdown";
import { formatRemaining } from "@/lib/watch-progress";
import type { CollapsedFilm } from "@/lib/series";
import styles from "./ma-liste.module.css";

export type ListStatus = "started" | "todo" | "seen" | "upcoming";

export type ListItem = {
  film: CollapsedFilm;
  addedAt: string;
  status: ListStatus;
  // Series: episodes watched / released. Film: seconds watched / length.
  watched: number;
  total: number;
  // What "Continuer" plays, resumed where the user stopped.
  nextId: string | null;
};

const GROUPS: { status: ListStatus; title: string; hint: string }[] = [
  { status: "started", title: "En cours", hint: "Là où tu t'étais arrêté" },
  { status: "todo", title: "À regarder", hint: "Pas encore vus" },
  { status: "upcoming", title: "Bientôt disponibles", hint: "Pas encore sortis" },
  { status: "seen", title: "Déjà vus", hint: "Terminés" },
];

const TYPES = [
  { label: "Tout", value: "" },
  { label: "Films", value: "films" },
  { label: "Séries", value: "series" },
];

const SORTS = ["Ajout récent", "Titre (A → Z)", "Mieux notés"];

function titleOf(f: CollapsedFilm) {
  return f.seriesTitle ?? f.title;
}

export default function MyList({ items }: { items: ListItem[] }) {
  const [type, setType] = useState("");
  const [sort, setSort] = useState(SORTS[0]);

  const visible = useMemo(() => {
    const filtered = items.filter((i) => !type || (type === "films" ? !i.film.seriesTitle : !!i.film.seriesTitle));
    const cmp: Record<string, (a: ListItem, b: ListItem) => number> = {
      "Ajout récent": (a, b) => b.addedAt.localeCompare(a.addedAt),
      "Titre (A → Z)": (a, b) => titleOf(a.film).localeCompare(titleOf(b.film), "fr"),
      "Mieux notés": (a, b) => (b.film.avgRating ?? -1) - (a.film.avgRating ?? -1),
    };
    return [...filtered].sort(cmp[sort]);
  }, [items, type, sort]);

  const films = items.filter((i) => !i.film.seriesTitle).length;
  const series = items.length - films;
  const seen = items.filter((i) => i.status === "seen").length;

  return (
    <main className={styles.page}>
      <RefreshOnReturn />
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Ma liste</h1>
          <p className={styles.subtitle}>
            {items.length === 0
              ? "Garde ici ce que tu veux regarder."
              : [
                  films > 0 && `${films} film${films > 1 ? "s" : ""}`,
                  series > 0 && `${series} série${series > 1 ? "s" : ""}`,
                ]
                  .filter(Boolean)
                  .join(" et ") + ` · ${seen} terminé${seen > 1 ? "s" : ""}`}
          </p>
        </div>
        {items.length > 0 && (
          <div className={styles.toolbar}>
            <div className={styles.segmented}>
              {TYPES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  className={`${styles.segment} ${type === t.value ? styles.segmentActive : ""}`}
                  onClick={() => setType(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className={styles.sortBox}>
              <Dropdown options={SORTS} value={sort} onChange={setSort} />
            </div>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </span>
          <h2>Ta liste est vide</h2>
          <p>Ajoute des films et des séries depuis leur fiche avec le bouton « Ma liste » pour les retrouver ici.</p>
          <div className={styles.emptyActions}>
            <Link href="/catalogue" className={styles.primaryBtn}>
              Parcourir le catalogue
            </Link>
            <Link href="/nouveautes" className={styles.ghostBtn}>
              Voir les nouveautés
            </Link>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <p className={styles.none}>Rien dans ce filtre.</p>
      ) : (
        GROUPS.map((g) => {
          const list = visible.filter((i) => i.status === g.status);
          if (list.length === 0) return null;
          return (
            <section key={g.status} className={styles.section}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>{g.title}</h2>
                <span className={styles.sectionCount}>{list.length}</span>
                <span className={styles.sectionHint}>{g.hint}</span>
              </div>
              <div className={styles.grid}>
                {list.map((i) => (
                  <div key={i.film.id} className={styles.item}>
                    <Card
                      film={i.film}
                      isFavorite
                      isWatched={i.status === "seen"}
                      episodeCount={i.film.episodeCount}
                      comingSoon={i.status === "upcoming"}
                    />
                    {i.status === "started" && (
                      <div className={styles.progressLine}>
                        <span className={styles.progress}>
                          <span className={styles.progressFill} style={{ width: `${(i.watched / i.total) * 100}%` }} />
                        </span>
                        <span className={styles.progressText}>
                          {i.film.seriesTitle ? `${i.watched}/${i.total} ép.` : formatRemaining(i.total - i.watched)}
                        </span>
                        {i.nextId && (
                          <Link href={`/watch/${i.nextId}?autoplay=1`} className={styles.continueBtn}>
                            Continuer
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}
    </main>
  );
}
