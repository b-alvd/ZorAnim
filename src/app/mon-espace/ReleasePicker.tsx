"use client";

import FileUpload from "@/components/FileUpload/FileUpload";
import { Segmented } from "@/app/admin/films/FormParts";
import type { ReleaseRequest, ReleaseRequestMode, ReleaseTrailer } from "@/lib/release-request";
import adminStyles from "@/app/admin/shared.module.css";
import styles from "./propose.module.css";

// Form state: datetime-local strings, converted to ISO when sending.
export type ReleaseDraft = {
  mode: ReleaseRequestMode;
  releaseAt: string;
  premiereAt: string;
  trailers: ReleaseTrailer[];
};

export const RELEASE_DRAFT_NOW: ReleaseDraft = { mode: "now", releaseAt: "", premiereAt: "", trailers: [] };

const toIso = (local: string) => (local ? new Date(local).toISOString() : null);

export function draftToRequest(d: ReleaseDraft, note: string | null = null): ReleaseRequest {
  return {
    mode: d.mode,
    releaseAt: d.mode === "scheduled" || d.mode === "premiere" ? toIso(d.releaseAt) : null,
    premiereAt: d.mode === "premiere" ? toIso(d.premiereAt) : null,
    note,
    trailers: d.mode === "announcement" ? d.trailers.filter((t) => t.videoUrl) : [],
  };
}

const BASE_MODES: { value: ReleaseRequestMode; label: string }[] = [
  { value: "now", label: "Dès que possible" },
  { value: "scheduled", label: "Date de sortie" },
  { value: "premiere", label: "Avant-première" },
];

const ANNOUNCEMENT_MODE = { value: "announcement" as const, label: "Annonce" };

// Trailers of an announcement: a title and a video each.
export function TrailersEditor({
  value,
  onChange,
  idPrefix,
}: {
  value: ReleaseTrailer[];
  onChange: (next: ReleaseTrailer[]) => void;
  idPrefix: string;
}) {
  const update = (i: number, patch: Partial<ReleaseTrailer>) =>
    onChange(value.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  return (
    <div className={styles.trailers}>
      {value.length === 0 && <p className={styles.hint}>Aucune bande-annonce pour l&apos;instant (facultatif).</p>}
      {value.map((t, i) => (
        <div key={i} className={styles.trailer}>
          <div className={styles.trailerHead}>
            <input
              aria-label="Titre de la bande-annonce"
              value={t.title}
              onChange={(e) => update(i, { title: e.target.value })}
              placeholder="Titre (ex. Teaser, Bande-annonce officielle)"
            />
            <button
              type="button"
              className={styles.removeEpisode}
              onClick={() => onChange(value.filter((_, j) => j !== i))}
            >
              Retirer
            </button>
          </div>
          <FileUpload
            name={`${idPrefix}-trailer-${i}`}
            label="Choisir la vidéo"
            accept="video/*"
            value={t.videoUrl}
            onChange={(videoUrl) => update(i, { videoUrl })}
            maxSizeMB={100}
          />
        </div>
      ))}
      <button
        type="button"
        className={styles.addEpisode}
        onClick={() => onChange([...value, { title: value.length === 0 ? "Bande-annonce" : "", videoUrl: "" }])}
      >
        + Ajouter une bande-annonce
      </button>
    </div>
  );
}

// How the creator would like the content to come out. Only a request: the
// team can keep it or change it when accepting. `allowAnnouncement` adds the
// "Annonce" choice (no video yet).
export default function ReleasePicker({
  value,
  onChange,
  idPrefix,
  allowAnnouncement = false,
}: {
  value: ReleaseDraft;
  onChange: (next: ReleaseDraft) => void;
  idPrefix: string;
  allowAnnouncement?: boolean;
}) {
  const modes = allowAnnouncement ? [...BASE_MODES, ANNOUNCEMENT_MODE] : BASE_MODES;
  return (
    <div className={styles.release}>
      <Segmented options={modes} value={value.mode} onChange={(mode) => onChange({ ...value, mode })} />

      {value.mode === "now" && (
        <p className={styles.hint}>En ligne dès que l&apos;équipe accepte ta proposition.</p>
      )}

      {value.mode === "scheduled" && (
        <div className={adminStyles.field}>
          <label htmlFor={`${idPrefix}-release`}>Date et heure de sortie souhaitées</label>
          <input
            id={`${idPrefix}-release`}
            type="datetime-local"
            value={value.releaseAt}
            onChange={(e) => onChange({ ...value, releaseAt: e.target.value })}
          />
        </div>
      )}

      {value.mode === "premiere" && (
        <>
          <p className={styles.hint}>
            L&apos;avant-première est une diffusion en direct : tout le monde regarde en même temps, avec un compteur de
            spectateurs.
          </p>
          <div className={adminStyles.row2}>
            <div className={adminStyles.field}>
              <label htmlFor={`${idPrefix}-premiere`}>Début de l&apos;avant-première</label>
              <input
                id={`${idPrefix}-premiere`}
                type="datetime-local"
                value={value.premiereAt}
                onChange={(e) => onChange({ ...value, premiereAt: e.target.value })}
              />
            </div>
            <div className={adminStyles.field}>
              <label htmlFor={`${idPrefix}-after`}>
                Sortie officielle <span className={styles.optional}>facultatif</span>
              </label>
              <input
                id={`${idPrefix}-after`}
                type="datetime-local"
                value={value.releaseAt}
                onChange={(e) => onChange({ ...value, releaseAt: e.target.value })}
              />
            </div>
          </div>
          <p className={styles.hint}>Sans sortie officielle, le contenu reste disponible juste après le direct.</p>
        </>
      )}

      {value.mode === "announcement" && (
        <>
          <p className={styles.hint}>
            Pas encore de vidéo : la fiche (affiche, synopsis, bandes-annonces) apparaît dans « Bientôt sur ZorAnim ».
            Tu proposeras le contenu lui-même quand il sera prêt.
          </p>
          <TrailersEditor
            value={value.trailers}
            onChange={(trailers) => onChange({ ...value, trailers })}
            idPrefix={idPrefix}
          />
        </>
      )}
    </div>
  );
}
