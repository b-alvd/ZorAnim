"use client";

import { useState } from "react";
import FilmRowActions from "./FilmRowActions";
import type { Artist, Film } from "@/data/types";
import { formatEpisodeTag } from "@/lib/series";
import styles from "../shared.module.css";
import listStyles from "./films.module.css";

export type FilmRow = { type: "film"; film: Film } | { type: "series"; title: string; episodes: Film[] };

function SeriesRow({ title, episodes, artists, categories }: { title: string; episodes: Film[]; artists: Artist[]; categories: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...episodes].sort(
    (a, b) => (a.seasonNumber ?? 0) - (b.seasonNumber ?? 0) || (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0)
  );

  return (
    <>
      <tr className={listStyles.seriesHeaderRow} onClick={() => setExpanded((e) => !e)}>
        <td colSpan={5}>
          <div className={listStyles.seriesHeader}>
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.15s ease" }}
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
            <span className={listStyles.seriesBadge}>Série</span>
            <span className={listStyles.seriesTitle}>{title}</span>
            <span className={listStyles.seriesCount}>
              {episodes.length} épisode{episodes.length > 1 ? "s" : ""}
            </span>
          </div>
        </td>
      </tr>
      {expanded &&
        sorted.map((ep) => (
          <tr key={ep.id} className={listStyles.episodeRow}>
            <td>
              <span className={listStyles.episodeTag}>{formatEpisodeTag(ep)}</span>{" "}
              {ep.title}
            </td>
            <td>{ep.artistName}</td>
            <td>{ep.category}</td>
            <td>{ep.year}</td>
            <td>
              <FilmRowActions film={ep} artists={artists} categories={categories} />
            </td>
          </tr>
        ))}
    </>
  );
}

export default function FilmsList({ rows, artists, categories }: { rows: FilmRow[]; artists: Artist[]; categories: string[] }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Titre</th>
            <th>Artiste</th>
            <th>Catégorie</th>
            <th>Année</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) =>
            row.type === "film" ? (
              <tr key={row.film.id}>
                <td>{row.film.title}</td>
                <td>{row.film.artistName}</td>
                <td>{row.film.category}</td>
                <td>{row.film.year}</td>
                <td>
                  <FilmRowActions film={row.film} artists={artists} categories={categories} />
                </td>
              </tr>
            ) : (
              <SeriesRow key={row.title} title={row.title} episodes={row.episodes} artists={artists} categories={categories} />
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
