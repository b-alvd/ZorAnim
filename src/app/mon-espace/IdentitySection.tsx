"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/Modal/Modal";
import ConfirmDeleteButton from "@/app/admin/ConfirmDeleteButton";
import FilmForm from "@/app/admin/films/FilmForm";
import FileUpload from "@/components/FileUpload/FileUpload";
import type { Artist, Film } from "@/data/types";
import { addOwnEpisodeAction, deleteOwnFilmAction, updateOwnFilmAction, updateOwnProfileAction } from "./actions";
import adminStyles from "@/app/admin/shared.module.css";
import styles from "./mon-espace.module.css";

type Engagement = { views: number; comments: number };

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
    <tr>
      <td>{film.title}</td>
      <td>{film.category}</td>
      <td>{film.avgRating !== null ? `★ ${film.avgRating.toFixed(1)}` : "—"}</td>
      <td>{engagement[film.id]?.views ?? 0}</td>
      <td>{engagement[film.id]?.comments ?? 0}</td>
      <td>
        <div className={adminStyles.rowActions}>
          <button type="button" className={adminStyles.editLink} onClick={() => onEdit(film.id)}>
            Modifier
          </button>
          <ConfirmDeleteButton action={deleteOwnFilmAction.bind(null, film.id)} itemName={film.title} />
        </div>
      </td>
    </tr>
  );
}

function SeriesGroupRow({
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
  onAddEpisode: (title: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...episodes].sort(
    (a, b) => (a.seasonNumber ?? 0) - (b.seasonNumber ?? 0) || (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0)
  );

  return (
    <>
      <tr className={styles.seriesHeaderRow}>
        <td colSpan={6}>
          <div className={styles.seriesHeaderInner} onClick={() => setExpanded((e) => !e)} style={{ cursor: "pointer" }}>
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
            <span className={styles.studioBadge}>Série</span>
            <span className={styles.identityName} style={{ fontSize: "0.95rem" }}>
              {title}
            </span>
            <span className={styles.filmCount}>
              {episodes.length} épisode{episodes.length > 1 ? "s" : ""}
            </span>
          </div>
          <button
            type="button"
            className={adminStyles.editLink}
            onClick={(e) => {
              e.stopPropagation();
              onAddEpisode(title);
            }}
          >
            + Ajouter un épisode
          </button>
        </td>
      </tr>
      {expanded &&
        sorted.map((ep) => (
          <tr key={ep.id}>
            <td>
              <span className={styles.episodeTag}>
                S{ep.seasonNumber ?? 1}E{ep.episodeNumber}
              </span>{" "}
              {ep.title}
            </td>
            <td>{ep.category}</td>
            <td>{ep.avgRating !== null ? `★ ${ep.avgRating.toFixed(1)}` : "—"}</td>
            <td>{engagement[ep.id]?.views ?? 0}</td>
            <td>{engagement[ep.id]?.comments ?? 0}</td>
            <td>
              <div className={adminStyles.rowActions}>
                <button type="button" className={adminStyles.editLink} onClick={() => onEdit(ep.id)}>
                  Modifier
                </button>
                <ConfirmDeleteButton action={deleteOwnFilmAction.bind(null, ep.id)} itemName={ep.title} />
              </div>
            </td>
          </tr>
        ))}
    </>
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
  const [addingEpisodeSeries, setAddingEpisodeSeries] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const editingFilm = films.find((f) => f.id === editingFilmId) ?? null;
  const seriesEpisodes = addingEpisodeSeries ? films.filter((f) => f.seriesTitle === addingEpisodeSeries) : [];
  const lastEpisode = seriesEpisodes.length
    ? [...seriesEpisodes].sort(
        (a, b) => (a.seasonNumber ?? 0) - (b.seasonNumber ?? 0) || (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0)
      ).at(-1)!
    : null;

  const rows: ({ type: "film"; film: Film } | { type: "series"; title: string; episodes: Film[] })[] = [];
  const seriesIndex = new Map<string, number>();
  for (const f of films) {
    if (!f.seriesTitle) {
      rows.push({ type: "film", film: f });
      continue;
    }
    const idx = seriesIndex.get(f.seriesTitle);
    if (idx === undefined) {
      seriesIndex.set(f.seriesTitle, rows.length);
      rows.push({ type: "series", title: f.seriesTitle, episodes: [f] });
    } else {
      const row = rows[idx];
      if (row.type === "series") row.episodes.push(f);
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.identityRow}>
            <h2 className={styles.identityName}>{identity.name}</h2>
            {identity.isStudio && <span className={styles.studioBadge}>Studio</span>}
          </div>
          <p className={styles.filmCount}>
            {films.length} film{films.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className={styles.sectionActions}>
          <button type="button" className={adminStyles.editLink} onClick={() => setProfileOpen(true)}>
            Modifier le profil
          </button>
        </div>
      </div>

      {films.length === 0 ? (
        <p className={styles.empty}>Aucun film publié pour l&apos;instant.</p>
      ) : (
        <div className={adminStyles.tableWrap}>
          <table className={adminStyles.table}>
            <thead>
              <tr>
                <th>Titre</th>
                <th>Catégorie</th>
                <th>Note</th>
                <th>Vues</th>
                <th>Commentaires</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) =>
                row.type === "film" ? (
                  <FilmRow key={row.film.id} film={row.film} engagement={engagement} onEdit={setEditingFilmId} />
                ) : (
                  <SeriesGroupRow
                    key={row.title}
                    title={row.title}
                    episodes={row.episodes}
                    engagement={engagement}
                    onEdit={setEditingFilmId}
                    onAddEpisode={setAddingEpisodeSeries}
                  />
                )
              )}
            </tbody>
          </table>
        </div>
      )}

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
        open={!!addingEpisodeSeries}
        onClose={() => setAddingEpisodeSeries(null)}
        title={addingEpisodeSeries ? `Ajouter un épisode à ${addingEpisodeSeries}` : ""}
      >
        {addingEpisodeSeries && (
          <FilmForm
            artists={identities}
            categories={categories}
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
