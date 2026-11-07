"use client";

import { useEffect, useRef, useState } from "react";
import Dropdown from "@/components/Dropdown/Dropdown";
import FileUpload from "@/components/FileUpload/FileUpload";
import { RATING_OPTIONS } from "@/lib/ratings";
import type { AdminFilmRequest } from "@/db/queries";
import { FormSection, ReleaseFields, releaseModeOf, toDatetimeLocal, type ReleaseValue } from "../films/FormParts";
import type { ReleaseRequest } from "@/lib/release-request";
import styles from "../shared.module.css";
import filmStyles from "../films/films.module.css";

export default function FilmSubmissionForm({
  onSubmit,
  categories,
  initial,
  pending,
  error,
}: {
  onSubmit: (formData: FormData) => void;
  categories: string[];
  initial: AdminFilmRequest;
  pending?: boolean;
  error?: string | null;
}) {
  const r = initial.releaseRequest;
  // An announcement (no video yet) keeps its mode and trailers as asked.
  const isAnnouncement = r.mode === "announcement";
  const [release, setRelease] = useState<ReleaseValue>({
    mode: r.mode === "announcement" ? "now" : r.mode,
    premiereAt: toDatetimeLocal(r.premiereAt),
    releaseAt: toDatetimeLocal(r.releaseAt),
    premiereBanner: r.premiereBanner ?? "",
    releaseBanner: r.releaseBanner ?? "",
    premiereAdUrl: r.premiereAdUrl ?? "",
    premiereAdDurationSeconds: r.premiereAdDurationSeconds ?? null,
  });
  const toIso = (local: string) => (local ? new Date(local).toISOString() : null);
  // Sent as one JSON field; the creator's message is kept on the server.
  const releaseJson = isAnnouncement
    ? JSON.stringify({ mode: "announcement", trailers: r.trailers ?? [] })
    : JSON.stringify({
        mode: releaseModeOf(release),
        premiereAt: toIso(release.premiereAt),
        releaseAt: toIso(release.releaseAt),
        premiereBanner: release.premiereBanner || null,
        releaseBanner: release.releaseBanner || null,
        premiereAdUrl: release.premiereAdUrl || null,
        premiereAdDurationSeconds: release.premiereAdDurationSeconds,
      } satisfies Omit<ReleaseRequest, "note">);
  const [rating, setRating] = useState(initial.rating);
  const [category, setCategory] = useState(initial.category);
  const [poster, setPoster] = useState(initial.poster);
  const [videoUrl, setVideoUrl] = useState(initial.videoUrl);
  const [valid, setValid] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const updateValidity = () => setValid(formRef.current?.checkValidity() ?? false);
  useEffect(updateValidity, []);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
      onChange={updateValidity}
      onInput={updateValidity}
      className={styles.form}
    >
      <div className={styles.row2}>
        <div className={styles.field}>
          <label htmlFor="artistName">Nom / studio</label>
          <input id="artistName" name="artistName" defaultValue={initial.artistName} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="contactEmail">Email de contact</label>
          <input id="contactEmail" name="contactEmail" type="email" defaultValue={initial.contactEmail} required />
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor="title">Titre</label>
        <input id="title" name="title" defaultValue={initial.title} required />
      </div>
      <div className={styles.field}>
        <label htmlFor="synopsis">Synopsis</label>
        <textarea id="synopsis" name="synopsis" rows={4} defaultValue={initial.synopsis} required />
      </div>
      <div className={styles.row2}>
        <div className={styles.field}>
          <label htmlFor="year">Année</label>
          <input id="year" name="year" type="number" defaultValue={initial.year} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="durationMinutes">Durée (minutes)</label>
          <input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            min={isAnnouncement ? 0 : 1}
            defaultValue={initial.durationMinutes}
            required={!isAnnouncement}
          />
        </div>
      </div>
      <div className={styles.row2}>
        <div className={styles.field}>
          <label>Classification</label>
          <input type="hidden" name="rating" value={rating} />
          <Dropdown options={RATING_OPTIONS} value={rating} onChange={setRating} />
        </div>
        <div className={styles.field}>
          <label>Catégorie</label>
          <input type="hidden" name="category" value={category} />
          <Dropdown options={categories} value={category} onChange={setCategory} />
        </div>
      </div>
      <div className={styles.field}>
        <label>Poster</label>
        <FileUpload
          name="poster"
          label="Choisir une image"
          accept="image/*"
          value={poster}
          onChange={setPoster}
          preview
        />
      </div>
      {isAnnouncement ? (
        <input type="hidden" name="videoUrl" value="" />
      ) : (
        <div className={styles.field}>
          <label>Vidéo</label>
          <FileUpload
            name="videoUrl"
            label="Choisir une vidéo"
            accept="video/*"
            value={videoUrl}
            onChange={setVideoUrl}
            maxSizeMB={100}
          />
        </div>
      )}
      <FormSection title="Sortie">
        <input type="hidden" name="releaseRequest" value={releaseJson} />
        {r.note && (
          <p className={filmStyles.formHint}>
            <strong>Message de {initial.artistName} :</strong> {r.note}
          </p>
        )}
        {isAnnouncement ? (
          <div className={filmStyles.formHint}>
            <p>
              <strong>Annonce :</strong> pas encore de vidéo. Une fois acceptée, la fiche apparaît dans « Bientôt sur
              ZorAnim » avec ses bandes-annonces ; le contenu sera proposé plus tard.
            </p>
            {(r.trailers ?? []).length > 0 ? (
              <ul>
                {(r.trailers ?? []).map((t, i) => (
                  <li key={i}>
                    <a href={t.videoUrl} target="_blank" rel="noreferrer">
                      {t.title}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Aucune bande-annonce jointe.</p>
            )}
          </div>
        ) : (
          <ReleaseFields
            value={release}
            onChange={(patch) => setRelease((v) => ({ ...v, ...patch }))}
            namePrefix="release"
          />
        )}
      </FormSection>
      {error && <p className={filmStyles.formError}>{error}</p>}
      <button
        type="submit"
        className={styles.submitBtn}
        disabled={pending || !valid || !poster || (!isAnnouncement && !videoUrl)}
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
