"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import Modal from "@/components/Modal/Modal";
import Dropdown from "@/components/Dropdown/Dropdown";
import FilmForm from "@/app/admin/films/FilmForm";
import FileUpload from "@/components/FileUpload/FileUpload";
import type { Artist, Film } from "@/data/types";
import { RATING_OPTIONS } from "@/lib/ratings";
import { formatEpisodeTag } from "@/lib/series";
import {
  deleteOwnFilmAction,
  updateOwnFilmAction,
  updateOwnProfileAction,
  updateOwnSeriesAction,
  type CreatorActionResult,
} from "./actions";
import type { ContentStatus, Engagement, IdentityData } from "./CreatorSpace";
import type { ProposePreset } from "./ProposeDialog";
import adminStyles from "@/app/admin/shared.module.css";
import styles from "./mon-espace.module.css";

type Row = { type: "film"; key: string; film: Film } | { type: "series"; key: string; title: string; episodes: Film[] };

const FILTERS = ["Tout", "Films", "Séries"] as const;
const SORTS = ["Plus récents", "Plus vus", "Mieux notés", "Titre (A → Z)"];

const STATUS_LABEL: Record<ContentStatus, string> = {
  online: "En ligne",
  soon: "Bientôt",
  announcement: "Annonce",
};

/* ---------- Icons ---------- */

const Icon = {
  star: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
      <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7L18.2 21 12 17.3 5.8 21l1.6-6.8L2 9.5l7.1-.6z" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1.5 12s4-7.5 10.5-7.5S22.5 12 22.5 12s-4 7.5-10.5 7.5S1.5 12 1.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  comment: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  external: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  ),
};

/* ---------- Helpers ---------- */

function sortEpisodes(episodes: Film[]) {
  return [...episodes].sort(
    (a, b) => (a.seasonNumber ?? 0) - (b.seasonNumber ?? 0) || (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0),
  );
}

function sumEngagement(ids: string[], engagement: Record<string, Engagement>): Engagement {
  return ids.reduce(
    (acc, id) => ({
      views: acc.views + (engagement[id]?.views ?? 0),
      comments: acc.comments + (engagement[id]?.comments ?? 0),
    }),
    { views: 0, comments: 0 },
  );
}

function seriesStatus(episodes: Film[], status: Record<string, ContentStatus>): ContentStatus {
  const list = episodes.map((e) => status[e.id]);
  if (list.includes("online")) return "online";
  if (list.includes("soon")) return "soon";
  return "announcement";
}

function formatCount(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(".", ",")} k` : String(n);
}

// Runs an action that returns { error } and keeps the message for display.
function useCreatorAction() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const run = (action: () => Promise<CreatorActionResult>, onSuccess?: () => void) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      else onSuccess?.();
    });
  };
  return { error, isPending, run, clear: () => setError(null) };
}

/* ---------- Small pieces ---------- */

function StatusPill({ status }: { status: ContentStatus }) {
  return <span className={`${styles.status} ${styles[`status_${status}`]}`}>{STATUS_LABEL[status]}</span>;
}

function Stats({ rating, engagement }: { rating: number | null; engagement: Engagement }) {
  return (
    <div className={styles.stats}>
      <span className={styles.statItem} title="Note moyenne">
        <span className={styles.starIcon}>{Icon.star}</span>
        {rating !== null ? rating.toFixed(1).replace(".", ",") : "—"}
      </span>
      <span className={styles.statItem} title="Vues">
        {Icon.eye}
        {formatCount(engagement.views)}
      </span>
      <span className={styles.statItem} title="Commentaires">
        {Icon.comment}
        {formatCount(engagement.comments)}
      </span>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`${styles.iconBtn} ${danger ? styles.iconBtnDanger : ""}`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function ConfirmDelete({ target, onClose }: { target: { id: string; label: string } | null; onClose: () => void }) {
  const { error, isPending, run, clear } = useCreatorAction();
  const close = () => {
    clear();
    onClose();
  };
  return (
    <Modal open={!!target} onClose={close} title="Supprimer le contenu">
      <div className={styles.dialog}>
        <p className={styles.dialogText}>
          Supprimer {target?.label} ? Ses vues, notes et commentaires seront perdus. Cette action est irréversible.
        </p>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.dialogActions}>
          <button type="button" className={styles.ghostBtn} onClick={close}>
            Annuler
          </button>
          <button
            type="button"
            className={styles.dangerBtn}
            disabled={isPending}
            onClick={() => target && run(() => deleteOwnFilmAction(target.id), close)}
          >
            {isPending ? "Suppression…" : "Supprimer"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Rows ---------- */

function Poster({ src, alt, badge }: { src: string; alt: string; badge?: string }) {
  return (
    <div className={styles.poster}>
      {src && <Image src={src} alt={alt} fill sizes="160px" unoptimized />}
      {badge && <span className={styles.posterBadge}>{badge}</span>}
    </div>
  );
}

function FilmRow({
  film,
  status,
  engagement,
  onEdit,
  onDelete,
  onProposeVideo,
  videoPending,
}: {
  film: Film;
  status: ContentStatus;
  engagement: Engagement;
  onEdit: () => void;
  onDelete: () => void;
  // Announcement: its video goes through a proposal checked by the team.
  onProposeVideo: () => void;
  videoPending: boolean;
}) {
  const isAnnouncementFiche = status === "announcement";
  return (
    <div className={styles.row}>
      <Poster src={film.poster} alt={film.title} />
      <div className={styles.rowMain}>
        <div className={styles.rowTitleLine}>
          <span className={styles.rowTitle}>{film.title}</span>
          <StatusPill status={status} />
        </div>
        <span className={styles.rowMeta}>
          Film · {film.category} · {film.year}
          {film.durationMinutes > 0 ? ` · ${film.duration}` : ""}
        </span>
        {/* Under the title: the actions column only fits the icons. */}
        {isAnnouncementFiche &&
          (videoPending ? (
            <span className={styles.pendingVideo}>Vidéo proposée, en attente de validation</span>
          ) : (
            <button type="button" className={styles.proposeVideoBtn} onClick={onProposeVideo}>
              Proposer la vidéo
            </button>
          ))}
      </div>
      <Stats rating={film.avgRating} engagement={engagement} />
      <div className={styles.rowActions}>
        <IconButton label="Modifier" onClick={onEdit}>
          {Icon.edit}
        </IconButton>
        <IconButton label="Supprimer" onClick={onDelete} danger>
          {Icon.trash}
        </IconButton>
      </div>
    </div>
  );
}

function SeriesRow({
  title,
  episodes,
  status,
  engagement,
  onEditSeries,
  onEditEpisode,
  onDeleteEpisode,
  onAddEpisode,
}: {
  title: string;
  episodes: Film[];
  status: Record<string, ContentStatus>;
  engagement: Record<string, Engagement>;
  onEditSeries: () => void;
  onEditEpisode: (id: string) => void;
  onDeleteEpisode: (ep: Film) => void;
  onAddEpisode: () => void;
}) {
  const [open, setOpen] = useState(false);
  const sorted = sortEpisodes(episodes);
  const cover = sorted.find((e) => e.episodeKind === "episode") ?? sorted[0];
  const realEpisodes = sorted.filter((e) => e.episodeKind === "episode");
  const total = sumEngagement(
    sorted.map((e) => e.id),
    engagement,
  );

  return (
    <div className={`${styles.row} ${styles.seriesRow} ${open ? styles.seriesOpen : ""}`}>
      <div className={styles.rowLine}>
        <Poster src={cover.poster} alt={title} badge="Série" />
        <div className={styles.rowMain}>
          <div className={styles.rowTitleLine}>
            <span className={styles.rowTitle}>{title}</span>
            <StatusPill status={seriesStatus(sorted, status)} />
          </div>
          <span className={styles.rowMeta}>
            {realEpisodes.length} épisode{realEpisodes.length > 1 ? "s" : ""} · {cover.category}
          </span>
        </div>
        <Stats rating={cover.avgRating} engagement={total} />
        <div className={styles.rowActions}>
          <IconButton label="Modifier la série" onClick={onEditSeries}>
            {Icon.edit}
          </IconButton>
          <button
            type="button"
            className={`${styles.expandBtn} ${open ? styles.expandOpen : ""}`}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            Épisodes {Icon.chevron}
          </button>
        </div>
      </div>

      {open && (
        <div className={styles.episodes}>
          {sorted.map((ep) => (
            <div key={ep.id} className={styles.episode}>
              <span className={styles.episodeTag}>{formatEpisodeTag(ep)}</span>
              <span className={styles.episodeTitle}>{ep.title}</span>
              <StatusPill status={status[ep.id]} />
              <Stats rating={ep.episodeAvgRating} engagement={engagement[ep.id] ?? { views: 0, comments: 0 }} />
              <div className={styles.rowActions}>
                <IconButton label="Modifier l'épisode" onClick={() => onEditEpisode(ep.id)}>
                  {Icon.edit}
                </IconButton>
                <IconButton label="Supprimer l'épisode" onClick={() => onDeleteEpisode(ep)} danger>
                  {Icon.trash}
                </IconButton>
              </div>
            </div>
          ))}
          <button type="button" className={styles.addEpisode} onClick={onAddEpisode}>
            {Icon.plus} Proposer un épisode
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Forms ---------- */

function SeriesInfoForm({
  seriesTitle,
  cover,
  categories,
  pending,
  error,
  onSubmit,
}: {
  seriesTitle: string;
  cover: Film;
  categories: string[];
  pending: boolean;
  error: string | null;
  onSubmit: (input: { seriesTitle: string; rating: string; category: string; synopsis: string }) => void;
}) {
  const [title, setTitle] = useState(seriesTitle);
  const [rating, setRating] = useState(cover.rating);
  const [category, setCategory] = useState(cover.category);
  const [synopsis, setSynopsis] = useState(cover.seriesSynopsis ?? "");

  return (
    <form
      className={adminStyles.form}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ seriesTitle: title, rating, category, synopsis });
      }}
    >
      <div className={adminStyles.field}>
        <label htmlFor="seriesTitleEdit">Titre de la série</label>
        <input id="seriesTitleEdit" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className={adminStyles.field}>
        <label htmlFor="seriesSynopsisEdit">Synopsis de la série</label>
        <textarea
          id="seriesSynopsisEdit"
          rows={4}
          value={synopsis}
          onChange={(e) => setSynopsis(e.target.value)}
          placeholder="Présente la série dans son ensemble. Chaque épisode garde son propre synopsis."
        />
      </div>
      <div className={styles.formPair}>
        <div className={adminStyles.field}>
          <label>Classification</label>
          <Dropdown options={RATING_OPTIONS} value={rating} onChange={setRating} />
        </div>
        <div className={adminStyles.field}>
          <label>Catégorie</label>
          <Dropdown options={categories} value={category} onChange={setCategory} />
        </div>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <button type="submit" className={adminStyles.submitBtn} disabled={pending || !title.trim()}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}

function ProfileForm({
  identity,
  initialBanner,
  pending,
  error,
  onSubmit,
}: {
  identity: Artist;
  initialBanner: string | null;
  pending: boolean;
  error: string | null;
  onSubmit: (input: { name: string; bio: string; avatar: string; banner: string | null }) => void;
}) {
  const [name, setName] = useState(identity.name);
  const [bio, setBio] = useState(identity.bio);
  const [avatar, setAvatar] = useState(identity.avatar);
  const [banner, setBannerUrl] = useState(initialBanner ?? "");

  return (
    <form
      className={adminStyles.form}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, bio, avatar, banner: banner || null });
      }}
    >
      <div className={adminStyles.field}>
        <label htmlFor="name">Nom</label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className={adminStyles.field}>
        <label htmlFor="bio">Bio</label>
        <textarea id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} required />
      </div>
      <div className={adminStyles.field}>
        <label>Avatar</label>
        <FileUpload
          name="avatar"
          label="Choisir une image"
          accept="image/*"
          value={avatar}
          onChange={setAvatar}
          preview
        />
      </div>
      <div className={adminStyles.field}>
        <label>
          Bannière <span className={styles.optional}>facultatif</span>
        </label>
        <p className={styles.fieldHint}>
          Affichée en haut de ta page publique. Format large conseillé (par exemple 1920 × 480).
        </p>
        <FileUpload
          name="banner"
          label="Choisir une bannière"
          accept="image/*"
          value={banner}
          onChange={setBannerUrl}
          maxSizeMB={15}
          preview
        />
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <button
        type="submit"
        className={adminStyles.submitBtn}
        disabled={pending || !name.trim() || !bio.trim() || !avatar}
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}

/* ---------- Section ---------- */

export default function IdentitySection({
  data,
  identities,
  categories,
  onPropose,
  pendingSlot,
  pendingAnnouncementIds = [],
}: {
  data: IdentityData;
  identities: Artist[];
  categories: string[];
  onPropose: (preset?: ProposePreset) => void;
  // Announcements whose video has been proposed and awaits the team.
  pendingAnnouncementIds?: string[];
  // Proposals of this profile waiting for the team, shown above the contents.
  pendingSlot?: React.ReactNode;
}) {
  const { identity, films, engagement, status } = data;
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Tout");
  const [sort, setSort] = useState(SORTS[0]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editingFilmId, setEditingFilmId] = useState<string | null>(null);
  const [editingSeries, setEditingSeries] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; label: string } | null>(null);
  const action = useCreatorAction();

  const closeModal = (close: () => void) => () => {
    action.clear();
    close();
  };

  // Films and series (episodes grouped), most recent first as returned.
  const rows = useMemo(() => {
    const list: Row[] = [];
    const seriesIndex = new Map<string, number>();
    for (const f of films) {
      if (!f.seriesTitle) {
        list.push({ type: "film", key: f.id, film: f });
        continue;
      }
      const idx = seriesIndex.get(f.seriesTitle);
      if (idx === undefined) {
        seriesIndex.set(f.seriesTitle, list.length);
        list.push({ type: "series", key: `series:${f.seriesTitle}`, title: f.seriesTitle, episodes: [f] });
      } else {
        const row = list[idx];
        if (row.type === "series") row.episodes.push(f);
      }
    }
    return list;
  }, [films]);

  const rowIds = (r: Row) => (r.type === "film" ? [r.film.id] : r.episodes.map((e) => e.id));
  const rowRating = (r: Row) => (r.type === "film" ? r.film.avgRating : r.episodes[0].avgRating);
  const rowTitle = (r: Row) => (r.type === "film" ? r.film.title : r.title);

  const visible = useMemo(() => {
    const filtered = rows.filter(
      (r) => filter === "Tout" || (filter === "Films" ? r.type === "film" : r.type === "series"),
    );
    const indexed = filtered.map((r, i) => ({ r, i }));
    const cmp: Record<string, (a: { r: Row; i: number }, b: { r: Row; i: number }) => number> = {
      "Plus récents": (a, b) => a.i - b.i,
      "Plus vus": (a, b) => sumEngagement(rowIds(b.r), engagement).views - sumEngagement(rowIds(a.r), engagement).views,
      "Mieux notés": (a, b) => (rowRating(b.r) ?? -1) - (rowRating(a.r) ?? -1),
      "Titre (A → Z)": (a, b) => rowTitle(a.r).localeCompare(rowTitle(b.r), "fr"),
    };
    return indexed.sort(cmp[sort]).map((x) => x.r);
  }, [rows, filter, sort, engagement]);

  const filmCount = rows.filter((r) => r.type === "film").length;
  const seriesCount = rows.length - filmCount;
  const episodeCount = films.filter((f) => f.seriesTitle && f.episodeKind === "episode").length;
  const totals = sumEngagement(
    films.map((f) => f.id),
    engagement,
  );
  const rated = rows.map(rowRating).filter((r): r is number => r !== null);
  const avgRating = rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : null;

  const editingFilm = films.find((f) => f.id === editingFilmId) ?? null;
  const editingSeriesEpisodes = editingSeries ? sortEpisodes(films.filter((f) => f.seriesTitle === editingSeries)) : [];
  // New episodes of a series go through a proposal, numbered after the last one.
  const proposeEpisode = (seriesTitle: string) => {
    const list = sortEpisodes(films.filter((f) => f.seriesTitle === seriesTitle));
    const last = list.filter((e) => e.episodeKind === "episode").at(-1);
    const cover = last ?? list[0];
    onPropose({
      kind: "episode",
      seriesTitle,
      rating: cover?.rating ?? "",
      category: cover?.category ?? "",
      season: last?.seasonNumber ?? 1,
      number: last ? (last.episodeNumber ?? 0) + 1 : 1,
    });
  };
  const publicHref = identity.isStudio ? `/studios/${identity.id}` : `/artistes/${identity.id}`;

  const kpis = [
    { label: filmCount > 1 ? "Films" : "Film", value: String(filmCount) },
    {
      label: seriesCount > 1 ? "Séries" : "Série",
      value: String(seriesCount),
      sub: `${episodeCount} épisode${episodeCount > 1 ? "s" : ""}`,
    },
    { label: "Vues", value: formatCount(totals.views) },
    { label: "Commentaires", value: formatCount(totals.comments) },
    {
      label: "Note moyenne",
      value: avgRating === null ? "—" : avgRating.toFixed(1).replace(".", ","),
      sub: avgRating === null ? undefined : "sur 5",
    },
  ];

  return (
    <section className={styles.identity}>
      <div className={`${styles.profileCard} ${data.banner ? styles.profileCardBanner : ""}`}>
        {data.banner && (
          <div className={styles.profileBanner} aria-hidden="true">
            <Image src={data.banner} alt="" fill sizes="(max-width: 1200px) 100vw, 1200px" unoptimized />
          </div>
        )}
        <div className={styles.profileAvatar}>
          {identity.avatar && <Image src={identity.avatar} alt="" fill sizes="80px" unoptimized />}
        </div>
        <div className={styles.profileText}>
          <div className={styles.profileNameLine}>
            <h2 className={styles.profileName}>{identity.name}</h2>
            <span className={`${styles.kind} ${identity.isStudio ? styles.kindStudio : ""}`}>
              {identity.isStudio ? "Studio" : "Artiste"}
            </span>
          </div>
          {identity.bio && <p className={styles.profileBio}>{identity.bio}</p>}
        </div>
        <div className={styles.profileActions}>
          <button type="button" className={styles.ghostBtn} onClick={() => setProfileOpen(true)}>
            {Icon.edit} Modifier le profil
          </button>
          <Link href={publicHref} className={styles.ghostBtn}>
            {Icon.external} Page publique
          </Link>
        </div>
      </div>

      <div className={styles.kpis}>
        {kpis.map((k) => (
          <div key={k.label} className={styles.kpi}>
            <span className={styles.kpiValue}>{k.value}</span>
            <span className={styles.kpiLabel}>
              {k.label}
              {k.sub && <span className={styles.kpiSub}> · {k.sub}</span>}
            </span>
          </div>
        ))}
      </div>

      {pendingSlot}

      <div className={styles.contentHead}>
        <h3 className={styles.contentTitle}>Contenus</h3>
        {rows.length > 0 && (
          <div className={styles.toolbar}>
            <div className={styles.segmented}>
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`${styles.segment} ${filter === f ? styles.segmentActive : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className={styles.sortBox}>
              <Dropdown options={SORTS} value={sort} onChange={setSort} />
            </div>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className={styles.emptyBox}>
          <p>Aucun film ni série publié pour l&apos;instant.</p>
          <button type="button" className={styles.primaryBtn} onClick={() => onPropose()}>
            Proposer un premier contenu
          </button>
        </div>
      ) : visible.length === 0 ? (
        <p className={styles.muted}>Aucun contenu dans ce filtre.</p>
      ) : (
        <div className={styles.list}>
          {visible.map((row) =>
            row.type === "film" ? (
              <FilmRow
                key={row.key}
                film={row.film}
                status={status[row.film.id]}
                engagement={engagement[row.film.id] ?? { views: 0, comments: 0 }}
                onEdit={() => setEditingFilmId(row.film.id)}
                onDelete={() => setDeleting({ id: row.film.id, label: `« ${row.film.title} »` })}
                onProposeVideo={() => onPropose({ kind: "announcement", film: row.film })}
                videoPending={pendingAnnouncementIds.includes(row.film.id)}
              />
            ) : (
              <SeriesRow
                key={row.key}
                title={row.title}
                episodes={row.episodes}
                status={status}
                engagement={engagement}
                onEditSeries={() => setEditingSeries(row.title)}
                onEditEpisode={setEditingFilmId}
                onDeleteEpisode={(ep) =>
                  setDeleting({ id: ep.id, label: `l'épisode ${formatEpisodeTag(ep)} « ${ep.title} »` })
                }
                onAddEpisode={() => proposeEpisode(row.title)}
              />
            ),
          )}
        </div>
      )}

      <ConfirmDelete target={deleting} onClose={() => setDeleting(null)} />

      <Modal
        open={profileOpen}
        onClose={closeModal(() => setProfileOpen(false))}
        title={`Modifier « ${identity.name} »`}
      >
        <ProfileForm
          identity={identity}
          initialBanner={data.banner}
          pending={action.isPending}
          error={action.error}
          onSubmit={(input) =>
            action.run(
              () => updateOwnProfileAction(identity.id, input),
              () => setProfileOpen(false),
            )
          }
        />
      </Modal>

      <Modal
        open={!!editingFilm}
        onClose={closeModal(() => setEditingFilmId(null))}
        title={editingFilm ? `Modifier « ${editingFilm.title} »` : ""}
        fixedHeight
      >
        {editingFilm && (
          <>
            {action.error && <p className={styles.error}>{action.error}</p>}
            <FilmForm
              showRelease={false}
              artists={identities}
              categories={categories}
              initial={editingFilm}
              lockedSeriesTitle={editingFilm.seriesTitle ?? undefined}
              allowVideo={editingFilm.episodeKind !== "announcement"}
              pending={action.isPending}
              onSubmit={(formData) =>
                action.run(
                  () => updateOwnFilmAction(identity.id, editingFilm.id, formData),
                  () => setEditingFilmId(null),
                )
              }
            />
          </>
        )}
      </Modal>

      <Modal
        open={!!editingSeries}
        onClose={closeModal(() => setEditingSeries(null))}
        title={editingSeries ? `Modifier la série « ${editingSeries} »` : ""}
      >
        {editingSeries && editingSeriesEpisodes[0] && (
          <SeriesInfoForm
            seriesTitle={editingSeries}
            cover={editingSeriesEpisodes[0]}
            categories={categories}
            pending={action.isPending}
            error={action.error}
            onSubmit={(input) =>
              action.run(
                () => updateOwnSeriesAction(identity.id, editingSeries, input),
                () => setEditingSeries(null),
              )
            }
          />
        )}
      </Modal>

    </section>
  );
}
