"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Dropdown from "@/components/Dropdown/Dropdown";
import Modal from "@/components/Modal/Modal";
import ConfirmDeleteButton from "../ConfirmDeleteButton";
import FilmRowActions from "./FilmRowActions";
import AddEpisodeButton from "./AddEpisodeButton";
import { TrailersEditor, toTrailerDrafts, type TrailerDraft } from "./FormParts";
import { deleteSeriesAction, setFilmsNewAction, updateSeriesAction } from "./actions";
import { RATING_OPTIONS } from "@/lib/ratings";
import { formatEpisodeTag } from "@/lib/series";
import type { Artist, Film } from "@/data/types";
import shared from "../shared.module.css";
import styles from "./films.module.css";

export type FilmStatus =
  | { kind: "announcement" }
  | { kind: "live" }
  | { kind: "premiere"; at: string; label: string }
  | { kind: "scheduled"; at: string; label: string }
  | { kind: "available" };

export type AdminFilm = Film & {
  createdAt: string;
  views: number;
  comments: number;
  status: FilmStatus;
};

type Group =
  | { type: "film"; key: string; film: AdminFilm }
  | { type: "series"; key: string; title: string; episodes: AdminFilm[] };

const PAGE_SIZE = 15;

const TYPE_OPTIONS = ["Films et séries", "Films", "Séries"];
const STATUS_OPTIONS = [
  "Tous les statuts",
  "En direct",
  "Avant-première programmée",
  "Sortie programmée",
  "Disponible",
  "Annonce (sans vidéo)",
  "Marqué « Nouveau »",
];
const SORT_OPTIONS = ["Ajout le plus récent", "Titre (A → Z)", "Plus vus", "Mieux notés", "Plus commentés"];
const ALL_CATEGORIES = "Toutes les catégories";

function sortEpisodes(episodes: AdminFilm[]) {
  return [...episodes].sort(
    (a, b) =>
      (a.episodeKind === "announcement" ? -1 : 0) - (b.episodeKind === "announcement" ? -1 : 0) ||
      (a.seasonNumber ?? 0) - (b.seasonNumber ?? 0) ||
      (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0)
  );
}

function matchesStatus(film: AdminFilm, status: string) {
  switch (status) {
    case "En direct":
      return film.status.kind === "live";
    case "Avant-première programmée":
      return film.status.kind === "premiere";
    case "Sortie programmée":
      return film.status.kind === "scheduled";
    case "Disponible":
      return film.status.kind === "available";
    case "Annonce (sans vidéo)":
      return film.status.kind === "announcement";
    case "Marqué « Nouveau »":
      return film.isNew;
    default:
      return true;
  }
}

function groupFilms(films: AdminFilm[]): Group[] {
  const groups: Group[] = [];
  const seriesIndex = new Map<string, number>();
  for (const film of films) {
    if (!film.seriesTitle) {
      groups.push({ type: "film", key: film.id, film });
      continue;
    }
    const index = seriesIndex.get(film.seriesTitle);
    if (index === undefined) {
      seriesIndex.set(film.seriesTitle, groups.length);
      groups.push({
        type: "series",
        key: `series:${film.seriesTitle}`,
        title: film.seriesTitle,
        episodes: [film],
      });
    } else {
      const group = groups[index];
      if (group.type === "series") group.episodes.push(film);
    }
  }
  return groups;
}

const filmsOf = (g: Group) => (g.type === "film" ? [g.film] : g.episodes);
const titleOf = (g: Group) => (g.type === "film" ? g.film.title : g.title);
const sum = (g: Group, pick: (f: AdminFilm) => number) => filmsOf(g).reduce((n, f) => n + pick(f), 0);
// Every episode carries the series-level average (see attachRatingSummaries).
const ratingOf = (g: Group) => filmsOf(g)[0].avgRating ?? -1;
const latestOf = (g: Group) => filmsOf(g).reduce((max, f) => (f.createdAt > max ? f.createdAt : max), "");

function StatusBadge({ status }: { status: FilmStatus }) {
  switch (status.kind) {
    case "announcement":
      return (
        <span
          className={`${styles.status} ${styles.statusScheduled}`}
          title="Pas encore de vidéo : seules les bandes-annonces sont visibles, dans « Bientôt »."
        >
          Annonce
        </span>
      );
    case "live":
      return (
        <span className={`${styles.status} ${styles.statusLive}`}>
          <span className={styles.liveDot} /> En direct
        </span>
      );
    case "premiere":
      return (
        <span className={`${styles.status} ${styles.statusPremiere}`} title="Avant-première programmée">
          Avant-première · {status.label}
        </span>
      );
    case "scheduled":
      return (
        <span className={`${styles.status} ${styles.statusScheduled}`} title="Sortie programmée">
          Sortie · {status.label}
        </span>
      );
    default:
      return <span className={`${styles.status} ${styles.statusAvailable}`}>Disponible</span>;
  }
}

// A series shows its most pressing state: live first, then the next
// scheduled event, otherwise available (or teasers only).
function seriesStatus(episodes: AdminFilm[]): React.ReactNode {
  const live = episodes.find((e) => e.status.kind === "live");
  if (live) return <StatusBadge status={live.status} />;
  const upcoming = episodes
    .filter((e) => e.status.kind === "premiere" || e.status.kind === "scheduled")
    .sort((a, b) => ("at" in a.status ? a.status.at : "").localeCompare("at" in b.status ? b.status.at : ""))[0];
  if (upcoming) {
    return (
      <span className={styles.statusStack}>
        <StatusBadge status={upcoming.status} />
        <span className={styles.statusNote}>{formatEpisodeTag(upcoming)}</span>
      </span>
    );
  }
  if (episodes.every((e) => e.episodeKind === "announcement")) {
    return <StatusBadge status={{ kind: "announcement" }} />;
  }
  return <StatusBadge status={{ kind: "available" }} />;
}

function Rating({ value, count }: { value: number | null; count: number }) {
  if (value === null || count === 0) return <span className={styles.muted}>—</span>;
  return (
    <span className={styles.rating} title={`${count} votant${count > 1 ? "s" : ""}`}>
      ★ {value.toFixed(1)} <span className={styles.muted}>({count})</span>
    </span>
  );
}

function NewToggle({ ids, active }: { ids: string[]; active: boolean }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className={`${styles.newToggle} ${active ? styles.newToggleOn : ""}`}
      disabled={isPending}
      onClick={(e) => {
        e.stopPropagation();
        startTransition(() => setFilmsNewAction(ids, !active));
      }}
      title={active ? "Retirer le badge « Nouveau »" : "Mettre en avant avec le badge « Nouveau »"}
    >
      Nouveau
    </button>
  );
}

function ViewLink({ id }: { id: string }) {
  return (
    <a
      href={`/watch/${id}`}
      target="_blank"
      rel="noreferrer"
      className={styles.iconBtn}
      title="Voir sur le site"
      aria-label="Voir sur le site"
      onClick={(e) => e.stopPropagation()}
    >
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <path d="M15 3h6v6M10 14L21 3" />
      </svg>
    </a>
  );
}

function Poster({ src }: { src: string }) {
  return <span className={styles.poster}>{src && <Image src={src} alt="" fill sizes="72px" unoptimized />}</span>;
}

function EditSeriesButton({ title, sample, categories }: { title: string; sample: AdminFilm; categories: string[] }) {
  const [open, setOpen] = useState(false);
  const [seriesTitle, setSeriesTitle] = useState(title);
  const [category, setCategory] = useState(sample.category);
  const [rating, setRating] = useState(sample.rating);
  const [trailers, setTrailers] = useState<TrailerDraft[]>(() => toTrailerDrafts(sample.trailers));
  const [synopsis, setSynopsis] = useState(sample.seriesSynopsis ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        className={shared.iconBtn}
        onClick={(e) => {
          e.stopPropagation();
          setSeriesTitle(title);
          setCategory(sample.category);
          setRating(sample.rating);
          setTrailers(toTrailerDrafts(sample.trailers));
          setSynopsis(sample.seriesSynopsis ?? "");
          setError(null);
          setOpen(true);
        }}
        title="Modifier la série (titre, catégorie, classification, bandes-annonces)"
        aria-label="Modifier la série"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
        </svg>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Modifier la série « ${title} »`} fixedHeight>
        <form
          className={shared.form}
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            startTransition(async () => {
              const result = await updateSeriesAction(title, {
                seriesTitle,
                category,
                rating,
                synopsis,
                trailers: trailers.map(({ title, videoUrl }) => ({ title, videoUrl })),
              });
              if (result.error) setError(result.error);
              else setOpen(false);
            });
          }}
        >
          <div className={shared.field}>
            <label htmlFor="series-title">Titre de la série</label>
            <input id="series-title" value={seriesTitle} onChange={(e) => setSeriesTitle(e.target.value)} required />
          </div>
          <div className={shared.field}>
            <label htmlFor="series-synopsis">Synopsis de la série</label>
            <textarea
              id="series-synopsis"
              rows={4}
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Présentation générale, affichée en haut de la fiche. Chaque épisode garde son propre synopsis."
            />
          </div>
          <div className={shared.field}>
            <label>Catégorie</label>
            <Dropdown options={categories} value={category} onChange={setCategory} />
          </div>
          <div className={shared.field}>
            <label>Classification</label>
            <Dropdown options={RATING_OPTIONS} value={rating} onChange={setRating} />
          </div>
          <div className={shared.field}>
            <label>Bandes-annonces</label>
            <TrailersEditor value={trailers} onChange={setTrailers} namePrefix="series-trailer" />
            <span className={styles.formHint}>La première est celle du bouton « Bande-annonce » de la fiche.</span>
          </div>
          <p className={styles.formHint}>S&apos;applique à tous les épisodes de la série.</p>
          {error && <p className={styles.formError}>{error}</p>}
          <button type="submit" className={shared.addBtn} disabled={isPending}>
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      </Modal>
    </>
  );
}

function TrailerCount({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className={styles.trailerCount} title="Bandes-annonces">
      <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
      {count} bande{count > 1 ? "s" : ""}-annonce{count > 1 ? "s" : ""}
    </span>
  );
}

function FilmLine({ film, artists, categories }: { film: AdminFilm; artists: Artist[]; categories: string[] }) {
  return (
    <tr className={styles.row}>
      <td>
        <div className={styles.content}>
          <Poster src={film.poster} />
          <div className={styles.contentText}>
            <span className={styles.contentTitle}>{film.title}</span>
            <span className={styles.contentMeta}>
              <span className={styles.kindTag}>Film</span>
              {film.category} · {film.year} · {film.duration}
              <TrailerCount count={film.trailers.length} />
            </span>
          </div>
        </div>
      </td>
      <td className={styles.creator}>{film.artistName}</td>
      <td>
        <StatusBadge status={film.status} />
      </td>
      <td className={styles.num}>{film.views}</td>
      <td className={styles.num}>
        <Rating value={film.avgRating} count={film.ratingCount} />
      </td>
      <td className={styles.num}>{film.comments}</td>
      <td>
        <div className={styles.actions}>
          <ViewLink id={film.id} />
          <NewToggle ids={[film.id]} active={film.isNew} />
          <FilmRowActions film={film} artists={artists} categories={categories} />
        </div>
      </td>
    </tr>
  );
}

function SeriesLines({
  title,
  episodes,
  artists,
  categories,
  forceOpen,
  shownEpisodeIds,
}: {
  title: string;
  episodes: AdminFilm[];
  artists: Artist[];
  categories: string[];
  forceOpen: boolean;
  // While filtering, only the episodes that match are listed.
  shownEpisodeIds: Set<string> | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const open = expanded || forceOpen;
  const sorted = sortEpisodes(episodes);
  const cover = sorted.find((e) => e.episodeKind !== "announcement") ?? sorted[0];
  const realCount = episodes.filter((e) => e.episodeKind !== "announcement").length;
  const allNew = episodes.every((e) => e.isNew);

  return (
    <>
      <tr className={`${styles.row} ${styles.seriesRow}`} onClick={() => setExpanded((v) => !v)}>
        <td>
          <div className={styles.content}>
            <svg
              className={styles.chevron}
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{ transform: open ? "rotate(90deg)" : "none" }}
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
            <Poster src={cover.poster} />
            <div className={styles.contentText}>
              <span className={styles.contentTitle}>{title}</span>
              <span className={styles.contentMeta}>
                <span className={`${styles.kindTag} ${styles.kindTagSeries}`}>Série</span>
                {realCount > 0 ? `${realCount} épisode${realCount > 1 ? "s" : ""}` : "Pas encore d'épisode"} ·{" "}
                {cover.category}
                <TrailerCount count={cover.trailers.length} />
              </span>
            </div>
          </div>
        </td>
        <td className={styles.creator}>{cover.artistName}</td>
        <td>{seriesStatus(episodes)}</td>
        <td className={styles.num}>{episodes.reduce((n, e) => n + e.views, 0)}</td>
        <td className={styles.num}>
          <Rating value={cover.avgRating} count={cover.ratingCount} />
        </td>
        <td className={styles.num}>{episodes.reduce((n, e) => n + e.comments, 0)}</td>
        <td>
          <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
            <ViewLink id={cover.id} />
            <NewToggle ids={episodes.map((e) => e.id)} active={allNew} />
            <EditSeriesButton title={title} sample={cover} categories={categories} />
            <AddEpisodeButton seriesTitle={title} episodes={episodes} artists={artists} categories={categories} />
            <ConfirmDeleteButton
              action={() => deleteSeriesAction(title)}
              itemName={`la série « ${title} » et ses ${episodes.length} épisodes`}
              compact
            />
          </div>
        </td>
      </tr>
      {open &&
        !shownEpisodeIds &&
        cover.trailers.map((t, index) => (
          <tr key={`trailer-${t.id}`} className={`${styles.row} ${styles.episodeRow}`}>
            <td>
              <div className={`${styles.content} ${styles.episodeContent}`}>
                <span className={`${styles.episodeTag} ${styles.trailerTag}`}>
                  Bande-annonce{cover.trailers.length > 1 ? ` ${index + 1}` : ""}
                </span>
                <div className={styles.contentText}>
                  <span className={styles.episodeTitle}>{t.title}</span>
                  <span className={styles.contentMeta}>Modifiable via « Modifier la série »</span>
                </div>
              </div>
            </td>
            <td />
            <td>
              <span className={styles.muted}>Toujours visible</span>
            </td>
            <td className={styles.num} title="Lectures de la bande-annonce (comptées à part des vues du contenu)">
              {t.views}
            </td>
            <td className={styles.num}>
              <span className={styles.muted}>—</span>
            </td>
            <td className={styles.num}>
              <span className={styles.muted}>—</span>
            </td>
            <td>
              <div className={styles.actions}>
                <a
                  href={`/watch/${cover.id}?autoplay=1&variant=teaser&trailer=${t.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.iconBtn}
                  title="Voir la bande-annonce"
                  aria-label="Voir la bande-annonce"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </a>
              </div>
            </td>
          </tr>
        ))}
      {open &&
        sorted
          .filter((ep) => !shownEpisodeIds || shownEpisodeIds.has(ep.id))
          .map((ep) => (
            <tr key={ep.id} className={`${styles.row} ${styles.episodeRow}`}>
              <td>
                <div className={`${styles.content} ${styles.episodeContent}`}>
                  <span className={`${styles.episodeTag} ${ep.episodeKind === "announcement" ? styles.ficheTag : ""}`}>
                    {ep.episodeKind === "announcement" ? "Fiche d'annonce" : formatEpisodeTag(ep)}
                  </span>
                  <div className={styles.contentText}>
                    <span className={styles.episodeTitle}>{ep.title}</span>
                    <span className={styles.contentMeta}>
                      {ep.episodeKind === "announcement"
                        ? "Affiche et synopsis affichés dans « Bientôt ». Remplacée par le 1er épisode ajouté (+)."
                        : ep.duration}
                    </span>
                  </div>
                </div>
              </td>
              <td className={styles.creator}>{ep.artistName}</td>
              <td>
                <StatusBadge status={ep.status} />
              </td>
              <td className={styles.num}>{ep.views}</td>
              <td className={styles.num}>
                <Rating value={ep.episodeAvgRating} count={ep.episodeRatingCount} />
              </td>
              <td className={styles.num}>{ep.comments}</td>
              <td>
                <div className={styles.actions}>
                  <ViewLink id={ep.id} />
                  <NewToggle ids={[ep.id]} active={ep.isNew} />
                  <FilmRowActions film={ep} artists={artists} categories={categories} />
                </div>
              </td>
            </tr>
          ))}
    </>
  );
}

export default function FilmsManager({
  films,
  artists,
  categories,
}: {
  films: AdminFilm[];
  artists: Artist[];
  categories: string[];
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState(TYPE_OPTIONS[0]);
  const [status, setStatus] = useState(STATUS_OPTIONS[0]);
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [sort, setSort] = useState(SORT_OPTIONS[0]);
  const [page, setPage] = useState(0);

  const groups = useMemo(() => groupFilms(films), [films]);
  const usedCategories = useMemo(() => [...new Set(films.map((f) => f.category))].sort(), [films]);

  const summary = useMemo(() => {
    const seriesGroups = groups.filter((g) => g.type === "series");
    return {
      films: groups.length - seriesGroups.length,
      series: seriesGroups.length,
      episodes: films.filter((f) => f.seriesTitle).length,
      live: films.filter((f) => f.status.kind === "live").length,
      premieres: films.filter((f) => f.status.kind === "premiere").length,
      scheduled: films.filter((f) => f.status.kind === "scheduled").length,
      isNew: films.filter((f) => f.isNew).length,
    };
  }, [groups, films]);

  const needle = query.trim().toLowerCase();
  const filtering = needle !== "" || status !== STATUS_OPTIONS[0];

  const visible = useMemo(() => {
    const result = groups.filter((g) => {
      if (type === "Films" && g.type !== "film") return false;
      if (type === "Séries" && g.type !== "series") return false;
      const list = filmsOf(g);
      if (category !== ALL_CATEGORIES && !list.some((f) => f.category === category)) return false;
      if (!list.some((f) => matchesStatus(f, status))) return false;
      if (needle) {
        const haystack = [titleOf(g), ...list.map((f) => `${f.title} ${f.artistName}`)].join(" ").toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
    const byTitle = (a: Group, b: Group) => titleOf(a).localeCompare(titleOf(b), "fr");
    const comparators: Record<string, (a: Group, b: Group) => number> = {
      "Titre (A → Z)": byTitle,
      "Plus vus": (a, b) => sum(b, (f) => f.views) - sum(a, (f) => f.views) || byTitle(a, b),
      "Mieux notés": (a, b) => ratingOf(b) - ratingOf(a) || byTitle(a, b),
      "Plus commentés": (a, b) => sum(b, (f) => f.comments) - sum(a, (f) => f.comments) || byTitle(a, b),
    };
    return result.sort(comparators[sort] ?? ((a, b) => latestOf(b).localeCompare(latestOf(a))));
  }, [groups, type, category, status, needle, sort]);

  // Episodes of a series that match the search/status filters. When the
  // series title itself matches the search, every episode passing the status
  // filter is kept.
  const episodeMatches = (seriesTitle: string, ep: AdminFilm) =>
    matchesStatus(ep, status) &&
    (!needle ||
      seriesTitle.toLowerCase().includes(needle) ||
      `${ep.title} ${ep.artistName}`.toLowerCase().includes(needle));

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const pageGroups = visible.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  // Any filter change sends the list back to its first page.
  const withReset =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(0);
    };

  const chips: {
    label: string;
    value: number;
    onClick: () => void;
    accent?: boolean;
  }[] = [
    {
      label: "Films",
      value: summary.films,
      onClick: () => (setType("Films"), setStatus(STATUS_OPTIONS[0]), setPage(0)),
    },
    {
      label: `Séries · ${summary.episodes} épisodes`,
      value: summary.series,
      onClick: () => (setType("Séries"), setStatus(STATUS_OPTIONS[0]), setPage(0)),
    },
    {
      label: "En direct",
      value: summary.live,
      accent: summary.live > 0,
      onClick: () => (setType(TYPE_OPTIONS[0]), setStatus("En direct"), setPage(0)),
    },
    {
      label: "Avant-premières programmées",
      value: summary.premieres,
      onClick: () => (setType(TYPE_OPTIONS[0]), setStatus("Avant-première programmée"), setPage(0)),
    },
    {
      label: "Sorties programmées",
      value: summary.scheduled,
      onClick: () => (setType(TYPE_OPTIONS[0]), setStatus("Sortie programmée"), setPage(0)),
    },
    {
      label: "Marqués « Nouveau »",
      value: summary.isNew,
      onClick: () => (setType(TYPE_OPTIONS[0]), setStatus("Marqué « Nouveau »"), setPage(0)),
    },
  ];

  const resetFilters = () => {
    setQuery("");
    setType(TYPE_OPTIONS[0]);
    setStatus(STATUS_OPTIONS[0]);
    setCategory(ALL_CATEGORIES);
    setPage(0);
  };
  const hasFilters =
    needle !== "" || type !== TYPE_OPTIONS[0] || status !== STATUS_OPTIONS[0] || category !== ALL_CATEGORIES;

  return (
    <div className={styles.manager}>
      <div className={styles.summary}>
        {chips.map((c) => (
          <button
            key={c.label}
            type="button"
            className={`${styles.chip} ${c.accent ? styles.chipAccent : ""}`}
            onClick={c.onClick}
          >
            <span className={styles.chipValue}>{c.value}</span>
            <span className={styles.chipLabel}>{c.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder="Titre, épisode, artiste…"
            value={query}
            onChange={(e) => withReset(setQuery)(e.target.value)}
          />
        </div>
        <div className={styles.filter}>
          <Dropdown options={TYPE_OPTIONS} value={type} onChange={withReset(setType)} />
        </div>
        <div className={styles.filter}>
          <Dropdown options={STATUS_OPTIONS} value={status} onChange={withReset(setStatus)} />
        </div>
        <div className={styles.filter}>
          <Dropdown options={[ALL_CATEGORIES, ...usedCategories]} value={category} onChange={withReset(setCategory)} />
        </div>
        <div className={styles.filter}>
          <Dropdown options={SORT_OPTIONS} value={sort} onChange={withReset(setSort)} />
        </div>
      </div>

      <div className={styles.resultsBar}>
        <span>
          {visible.length} résultat{visible.length > 1 ? "s" : ""}
        </span>
        {hasFilters && (
          <button type="button" className={styles.resetBtn} onClick={resetFilters}>
            Réinitialiser les filtres
          </button>
        )}
      </div>

      <div className={shared.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.contentHead}>Contenu</th>
              <th>Créateur</th>
              <th>Statut</th>
              <th className={styles.num}>Vues</th>
              <th className={styles.num}>Note</th>
              <th className={styles.num} title="Commentaires">
                Comm.
              </th>
              <th className={styles.actionsHead}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageGroups.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  Aucun contenu ne correspond à ces filtres.
                </td>
              </tr>
            ) : (
              pageGroups.map((g) =>
                g.type === "film" ? (
                  <FilmLine key={g.key} film={g.film} artists={artists} categories={categories} />
                ) : (
                  <SeriesLines
                    key={g.key}
                    title={g.title}
                    episodes={g.episodes}
                    artists={artists}
                    categories={categories}
                    forceOpen={filtering}
                    shownEpisodeIds={
                      filtering
                        ? new Set(g.episodes.filter((ep) => episodeMatches(g.title, ep)).map((ep) => ep.id))
                        : null
                    }
                  />
                )
              )
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className={styles.pager}>
          <button
            type="button"
            className={shared.editLink}
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            Précédent
          </button>
          <span className={styles.pagerLabel}>
            Page {current + 1} sur {pageCount}
          </span>
          <button
            type="button"
            className={shared.editLink}
            disabled={current === pageCount - 1}
            onClick={() => setPage(current + 1)}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
