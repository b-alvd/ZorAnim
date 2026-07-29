"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import Modal from "@/components/Modal/Modal";
import Dropdown from "@/components/Dropdown/Dropdown";
import ConfirmDeleteButton from "@/app/admin/ConfirmDeleteButton";
import FilmForm from "@/app/admin/films/FilmForm";
import FileUpload from "@/components/FileUpload/FileUpload";
import type { Artist, Film } from "@/data/types";
import { RATING_OPTIONS } from "@/lib/ratings";
import {
  addOwnEpisodeAction,
  deleteOwnFilmAction,
  updateOwnFilmAction,
  updateOwnProfileAction,
  updateOwnSeriesAction,
} from "./actions";
import adminStyles from "@/app/admin/shared.module.css";
import styles from "./mon-espace.module.css";

type Engagement = { views: number; comments: number };

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1.5 12s4-7.5 10.5-7.5S22.5 12 22.5 12s-4 7.5-10.5 7.5S1.5 12 1.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
      <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7L18.2 21 12 17.3 5.8 21l1.6-6.8L2 9.5l7.1-.6z" />
    </svg>
  );
}

function readFilmInput(formData: FormData, fallbackArtistId: string) {
  const seriesTitle = String(formData.get("seriesTitle") ?? "").trim();
  const seasonNumber = formData.get("seasonNumber");
  const episodeNumber = formData.get("episodeNumber");
  return {
    title: String(formData.get("title") ?? ""),
    synopsis: String(formData.get("synopsis") ?? ""),
    year: Number(formData.get("year")),
    durationMinutes: Number(formData.get("durationMinutes")),
    rating: String(formData.get("rating") ?? ""),
    category: String(formData.get("category") ?? ""),
    artistId: String(formData.get("artistId") ?? fallbackArtistId),
    studioId: null,
    isNew: formData.get("isNew") === "on",
    poster: String(formData.get("poster") ?? ""),
    videoUrl: String(formData.get("videoUrl") ?? ""),
    seriesTitle: seriesTitle || null,
    seasonNumber: seriesTitle && seasonNumber ? Number(seasonNumber) : null,
    episodeNumber: seriesTitle && episodeNumber ? Number(episodeNumber) : null,
  };
}

function sortEpisodes(episodes: Film[]) {
  return [...episodes].sort(
    (a, b) => (a.seasonNumber ?? 0) - (b.seasonNumber ?? 0) || (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0)
  );
}

function averageRating(films: Film[]): number | null {
  const rated = films.filter((f) => f.avgRating !== null);
  if (rated.length === 0) return null;
  return rated.reduce((sum, f) => sum + f.avgRating!, 0) / rated.length;
}

function RowActions({
  onEdit,
  deleteAction,
  itemName,
}: {
  onEdit: () => void;
  deleteAction: () => Promise<void>;
  itemName: string;
}) {
  return (
    <div className={styles.rowActions}>
      <button type="button" className={styles.rowActionBtn} onClick={onEdit}>
        Modifier
      </button>
      <ConfirmDeleteButton action={deleteAction} itemName={itemName} />
    </div>
  );
}

function RowStats({ rating, engagement }: { rating: number | null; engagement?: Engagement }) {
  return (
    <div className={styles.rowStats}>
      <span className={styles.rowStat} title="Note moyenne">
        <StarIcon /> {rating !== null ? rating.toFixed(1) : "—"}
      </span>
      <span className={styles.rowStat} title="Vues">
        <EyeIcon /> {engagement?.views ?? 0}
      </span>
      <span className={styles.rowStat} title="Commentaires">
        <CommentIcon /> {engagement?.comments ?? 0}
      </span>
    </div>
  );
}

function FilmRow({
  film,
  engagement,
  onEdit,
}: {
  film: Film;
  engagement: Record<string, Engagement>;
  onEdit: (id: string) => void;
}) {
  return (
    <div className={styles.row}>
      <div className={styles.rowPoster}>
        <Image src={film.poster} alt={film.title} fill sizes="88px" unoptimized />
      </div>
      <div className={styles.rowInfo}>
        <span className={styles.rowTitle}>{film.title}</span>
        <span className={styles.rowMeta}>{film.category}</span>
      </div>
      <RowStats rating={film.avgRating} engagement={engagement[film.id]} />
      <RowActions
        onEdit={() => onEdit(film.id)}
        deleteAction={() => deleteOwnFilmAction(film.id)}
        itemName={film.title}
      />
    </div>
  );
}

function SeriesRow({
  title,
  episodes,
  engagement,
  onManage,
  onEditSeriesInfo,
}: {
  title: string;
  episodes: Film[];
  engagement: Record<string, Engagement>;
  onManage: () => void;
  onEditSeriesInfo: () => void;
}) {
  const sorted = sortEpisodes(episodes);
  const cover = sorted[0];
  const totalViews = episodes.reduce((sum, ep) => sum + (engagement[ep.id]?.views ?? 0), 0);
  const totalComments = episodes.reduce((sum, ep) => sum + (engagement[ep.id]?.comments ?? 0), 0);
  const rating = averageRating(episodes);

  return (
    <div className={styles.row}>
      <div className={styles.rowPoster}>
        <Image src={cover.poster} alt={title} fill sizes="88px" unoptimized />
        <span className={styles.rowPosterBadge}>Série</span>
      </div>
      <div className={styles.rowInfo}>
        <span className={styles.rowTitle}>{title}</span>
        <span className={styles.rowMeta}>
          {episodes.length} épisode{episodes.length > 1 ? "s" : ""} · {cover.category}
        </span>
      </div>
      <RowStats rating={rating} engagement={{ views: totalViews, comments: totalComments }} />
      <div className={styles.rowActions}>
        <button type="button" className={styles.rowActionBtn} onClick={onEditSeriesInfo}>
          Modifier la série
        </button>
        <button type="button" className={styles.rowActionBtn} onClick={onManage}>
          Épisodes
        </button>
      </div>
    </div>
  );
}

function EpisodesManager({
  title,
  episodes,
  engagement,
  onEdit,
  onAddEpisode,
}: {
  title: string;
  episodes: Film[];
  engagement: Record<string, Engagement>;
  onEdit: (id: string) => void;
  onAddEpisode: () => void;
}) {
  const sorted = sortEpisodes(episodes);

  return (
    <div className={styles.episodesManager}>
      <div className={styles.episodesList}>
        {sorted.map((ep) => (
          <div key={ep.id} className={styles.episodeRow}>
            <span className={styles.episodeTag}>
              S{ep.seasonNumber ?? 1}E{ep.episodeNumber}
            </span>
            <div className={styles.episodeInfo}>
              <span className={styles.rowTitle}>{ep.title}</span>
            </div>
            <RowStats rating={ep.avgRating} engagement={engagement[ep.id]} />
            <RowActions
              onEdit={() => onEdit(ep.id)}
              deleteAction={() => deleteOwnFilmAction(ep.id)}
              itemName={ep.title}
            />
          </div>
        ))}
      </div>
      <button type="button" className={adminStyles.editLink} onClick={onAddEpisode}>
        + Ajouter un épisode à {title}
      </button>
    </div>
  );
}

function SeriesInfoForm({
  seriesTitle,
  rating,
  category,
  categories,
  pending,
  onSubmit,
}: {
  seriesTitle: string;
  rating: string;
  category: string;
  categories: string[];
  pending: boolean;
  onSubmit: (input: { seriesTitle: string; rating: string; category: string }) => void;
}) {
  const [title, setTitle] = useState(seriesTitle);
  const [ratingValue, setRatingValue] = useState(rating);
  const [categoryValue, setCategoryValue] = useState(category);

  return (
    <form
      className={adminStyles.form}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ seriesTitle: title, rating: ratingValue, category: categoryValue });
      }}
    >
      <div className={adminStyles.field}>
        <label htmlFor="seriesTitleEdit">Titre de la série</label>
        <input id="seriesTitleEdit" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className={adminStyles.field}>
        <label>Classification</label>
        <Dropdown options={RATING_OPTIONS} value={ratingValue} onChange={setRatingValue} />
      </div>
      <div className={adminStyles.field}>
        <label>Catégorie</label>
        <Dropdown options={categories} value={categoryValue} onChange={setCategoryValue} />
      </div>
      <button type="submit" className={adminStyles.submitBtn} disabled={pending || !title.trim()}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}

export default function IdentitySection({
  identity,
  identities,
  films,
  engagement,
  categories,
}: {
  identity: Artist;
  identities: Artist[];
  films: Film[];
  engagement: Record<string, Engagement>;
  categories: string[];
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [editingFilmId, setEditingFilmId] = useState<string | null>(null);
  const [managingSeries, setManagingSeries] = useState<string | null>(null);
  const [editingSeriesInfo, setEditingSeriesInfo] = useState<string | null>(null);
  const [addingEpisodeSeries, setAddingEpisodeSeries] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const editingFilm = films.find((f) => f.id === editingFilmId) ?? null;
  const seriesEpisodes = addingEpisodeSeries ? films.filter((f) => f.seriesTitle === addingEpisodeSeries) : [];
  const lastEpisode = seriesEpisodes.length ? sortEpisodes(seriesEpisodes).at(-1)! : null;

  const rows = useMemo(() => {
    const list: ({ type: "film"; film: Film } | { type: "series"; title: string; episodes: Film[] })[] = [];
    const seriesIndex = new Map<string, number>();
    for (const f of films) {
      if (!f.seriesTitle) {
        list.push({ type: "film", film: f });
        continue;
      }
      const idx = seriesIndex.get(f.seriesTitle);
      if (idx === undefined) {
        seriesIndex.set(f.seriesTitle, list.length);
        list.push({ type: "series", title: f.seriesTitle, episodes: [f] });
      } else {
        const row = list[idx];
        if (row.type === "series") row.episodes.push(f);
      }
    }
    return list;
  }, [films]);

  const seriesCount = rows.filter((r) => r.type === "series").length;
  const soloFilmCount = rows.filter((r) => r.type === "film").length;
  const totalViews = Object.values(engagement).reduce((sum, e) => sum + e.views, 0);
  const totalComments = Object.values(engagement).reduce((sum, e) => sum + e.comments, 0);

  const managingSeriesRow = rows.find((r) => r.type === "series" && r.title === managingSeries);
  const managingEpisodes = managingSeriesRow?.type === "series" ? managingSeriesRow.episodes : [];

  const editingSeriesRow = rows.find((r) => r.type === "series" && r.title === editingSeriesInfo);
  const editingSeriesEpisodes = editingSeriesRow?.type === "series" ? editingSeriesRow.episodes : [];
  const editingSeriesCover = editingSeriesEpisodes[0];

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.identityAvatarWrap}>
          <Image src={identity.avatar} alt={identity.name} fill sizes="56px" unoptimized />
        </div>
        <div className={styles.identityInfo}>
          <div className={styles.identityRow}>
            <h2 className={styles.identityName}>{identity.name}</h2>
            {identity.isStudio && <span className={styles.studioBadge}>Studio</span>}
          </div>
          <div className={styles.statsBar}>
            <span className={styles.statChip}>
              {soloFilmCount} film{soloFilmCount > 1 ? "s" : ""}
            </span>
            <span className={styles.statChip}>
              {seriesCount} série{seriesCount > 1 ? "s" : ""}
            </span>
            <span className={styles.statChip}>{totalViews} vues</span>
            <span className={styles.statChip}>{totalComments} commentaires</span>
          </div>
        </div>
        <div className={styles.sectionActions}>
          <button type="button" className={styles.rowActionBtn} onClick={() => setProfileOpen(true)}>
            Modifier le profil
          </button>
        </div>
      </div>

      <div className={styles.list}>
        {rows.length === 0 ? (
          <p className={styles.empty}>Aucun film publié pour l&apos;instant.</p>
        ) : (
          rows.map((row) =>
            row.type === "film" ? (
              <FilmRow key={row.film.id} film={row.film} engagement={engagement} onEdit={setEditingFilmId} />
            ) : (
              <SeriesRow
                key={row.title}
                title={row.title}
                episodes={row.episodes}
                engagement={engagement}
                onManage={() => setManagingSeries(row.title)}
                onEditSeriesInfo={() => setEditingSeriesInfo(row.title)}
              />
            )
          )
        )}
      </div>

      <Modal open={profileOpen} onClose={() => setProfileOpen(false)} title={`Modifier ${identity.name}`}>
        <ProfileForm
          identity={identity}
          pending={isPending}
          onSubmit={(input) =>
            startTransition(async () => {
              await updateOwnProfileAction(identity.id, input);
              setProfileOpen(false);
            })
          }
        />
      </Modal>

      <Modal open={!!editingFilm} onClose={() => setEditingFilmId(null)} title={editingFilm ? `Modifier ${editingFilm.title}` : ""}>
        {editingFilm && (
          <FilmForm
            artists={identities}
            categories={categories}
            initial={editingFilm}
            lockedSeriesTitle={editingFilm.seriesTitle ?? undefined}
            pending={isPending}
            onSubmit={(formData) =>
              startTransition(async () => {
                await updateOwnFilmAction(editingFilm.id, readFilmInput(formData, identity.id));
                setEditingFilmId(null);
              })
            }
          />
        )}
      </Modal>

      <Modal
        open={!!managingSeries}
        onClose={() => setManagingSeries(null)}
        title={managingSeries ? `Épisodes de ${managingSeries}` : ""}
      >
        {managingSeries && (
          <EpisodesManager
            title={managingSeries}
            episodes={managingEpisodes}
            engagement={engagement}
            onEdit={(id) => {
              setManagingSeries(null);
              setEditingFilmId(id);
            }}
            onAddEpisode={() => {
              const title = managingSeries;
              setManagingSeries(null);
              setAddingEpisodeSeries(title);
            }}
          />
        )}
      </Modal>

      <Modal
        open={!!editingSeriesInfo}
        onClose={() => setEditingSeriesInfo(null)}
        title={editingSeriesInfo ? `Modifier ${editingSeriesInfo}` : ""}
      >
        {editingSeriesInfo && editingSeriesCover && (
          <SeriesInfoForm
            seriesTitle={editingSeriesInfo}
            rating={editingSeriesCover.rating}
            category={editingSeriesCover.category}
            categories={categories}
            pending={isPending}
            onSubmit={(input) =>
              startTransition(async () => {
                await updateOwnSeriesAction(identity.id, editingSeriesInfo, input);
                setEditingSeriesInfo(null);
              })
            }
          />
        )}
      </Modal>

      <Modal
        open={!!addingEpisodeSeries}
        onClose={() => setAddingEpisodeSeries(null)}
        title={addingEpisodeSeries ? `Ajouter un épisode à ${addingEpisodeSeries}` : ""}
      >
        {addingEpisodeSeries && (
          <FilmForm
            artists={identities}
            categories={categories}
            lockedSeriesTitle={addingEpisodeSeries}
            initial={{
              title: "",
              synopsis: "",
              year: new Date().getFullYear(),
              durationMinutes: lastEpisode?.durationMinutes ?? 0,
              rating: lastEpisode?.rating ?? "",
              category: lastEpisode?.category ?? categories[0],
              artistId: identity.id,
              isNew: false,
              poster: "",
              videoUrl: "",
              seriesTitle: addingEpisodeSeries,
              seasonNumber: lastEpisode?.seasonNumber ?? 1,
              episodeNumber: (lastEpisode?.episodeNumber ?? 0) + 1,
            }}
            pending={isPending}
            onSubmit={(formData) =>
              startTransition(async () => {
                await addOwnEpisodeAction(identity.id, readFilmInput(formData, identity.id));
                setAddingEpisodeSeries(null);
              })
            }
          />
        )}
      </Modal>
    </section>
  );
}

function ProfileForm({
  identity,
  pending,
  onSubmit,
}: {
  identity: Artist;
  pending: boolean;
  onSubmit: (input: { name: string; bio: string; avatar: string }) => void;
}) {
  const [name, setName] = useState(identity.name);
  const [bio, setBio] = useState(identity.bio);
  const [avatar, setAvatar] = useState(identity.avatar);

  return (
    <form
      className={adminStyles.form}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, bio, avatar });
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
        <FileUpload name="avatar" label="Choisir une image" accept="image/*" value={avatar} onChange={setAvatar} preview />
      </div>
      <button type="submit" className={adminStyles.submitBtn} disabled={pending || !name.trim() || !bio.trim() || !avatar}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
