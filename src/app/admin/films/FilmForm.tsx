"use client";

import { useEffect, useRef, useState } from "react";
import Dropdown from "@/components/Dropdown/Dropdown";
import FileUpload from "@/components/FileUpload/FileUpload";
import type { Artist } from "@/data/types";
import { RATING_OPTIONS } from "@/lib/ratings";
import {
  FormSection,
  OptionalToggle,
  ReleaseFields,
  TrailersEditor,
  toTrailerDrafts,
  minutesFromSeconds,
  toDatetimeLocal,
  type ReleaseValue,
  type TrailerDraft,
} from "./FormParts";
import styles from "../shared.module.css";
import formStyles from "./films.module.css";

type FilmFormValues = {
  title: string;
  synopsis: string;
  year: number;
  durationMinutes: number;
  rating: string;
  category: string;
  artistId: string;
  isNew: boolean;
  poster: string;
  videoUrl: string;
  seriesTitle?: string | null;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  episodeKind?: "episode" | "announcement";
  teaserVideoUrl?: string | null;
  trailers?: { title: string; videoUrl: string }[];
  premiereAt?: string | null;
  premiereBanner?: string | null;
  releaseBanner?: string | null;
  premiereAdUrl?: string | null;
  premiereAdDurationSeconds?: number | null;
  releaseAt?: string | null;
  videoDurationSeconds?: number | null;
};

const SEASON_TYPE_OPTIONS = ["Saison 1", "Saison 2", "Saison 3", "Saison 4", "Saison 5", "Saison 6"];

export default function FilmForm({
  onSubmit,
  artists,
  categories,
  initial,
  pending,
  lockedSeriesTitle,
  allowSeries = true,
  seasonOptions,
  showRelease = true,
}: {
  onSubmit: (formData: FormData) => void;
  artists: Artist[];
  categories: string[];
  initial?: FilmFormValues;
  pending?: boolean;
  lockedSeriesTitle?: string;
  allowSeries?: boolean;
  seasonOptions?: string[];
  // Premiere / scheduled release settings; only the admin can set them.
  showRelease?: boolean;
}) {
  const [rating, setRating] = useState(initial?.rating || RATING_OPTIONS[0]);
  const [category, setCategory] = useState(initial?.category ?? categories[0]);
  const [artistId, setArtistId] = useState(initial?.artistId ?? artists[0]?.id ?? "");
  const [poster, setPoster] = useState(initial?.poster ?? "");
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? "");
  const [videoDurationSeconds, setVideoDurationSeconds] = useState(initial?.videoDurationSeconds ?? null);
  const [durationMinutes, setDurationMinutes] = useState(initial?.durationMinutes || "");
  const [durationDetected, setDurationDetected] = useState(false);
  const [teaserVideoUrl, setTeaserVideoUrl] = useState(initial?.teaserVideoUrl ?? "");
  // The admin manages a list of trailers; the creator space keeps the single
  // legacy trailer field.
  const multiTrailers = showRelease;
  const [trailers, setTrailers] = useState<TrailerDraft[]>(() =>
    toTrailerDrafts(
      initial?.trailers ??
        (initial?.teaserVideoUrl ? [{ title: "Bande-annonce", videoUrl: initial.teaserVideoUrl }] : [])
    )
  );
  const [release, setRelease] = useState<ReleaseValue>({
    premiereAt: toDatetimeLocal(initial?.premiereAt),
    releaseAt: toDatetimeLocal(initial?.releaseAt),
    premiereBanner: initial?.premiereBanner ?? "",
    releaseBanner: initial?.releaseBanner ?? "",
    premiereAdUrl: initial?.premiereAdUrl ?? "",
    premiereAdDurationSeconds: initial?.premiereAdDurationSeconds ?? null,
  });
  const [seriesTitleValue, setSeriesTitleValue] = useState(lockedSeriesTitle ?? initial?.seriesTitle ?? "");
  const [seasonType, setSeasonType] = useState(`Saison ${initial?.seasonNumber ?? 1}`);
  const isSeries = !!lockedSeriesTitle || !!seriesTitleValue.trim();
  // Without a video, a film (or the fiche of an announced series) is an
  // announcement: only its trailers are visible, in "Bientôt sur ZorAnim".
  const allowAnnouncement = !isSeries || initial?.episodeKind === "announcement";
  const isAnnouncement = allowAnnouncement && !videoUrl;
  const showSeriesTitleInput = allowSeries && !lockedSeriesTitle && (!initial || !!initial.seriesTitle);
  const [valid, setValid] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const artistNames = artists.map((a) => (a.isStudio ? `${a.name} (studio)` : a.name));
  const selectedArtist = artists.find((a) => a.id === artistId);
  const selectedArtistName = selectedArtist
    ? selectedArtist.isStudio
      ? `${selectedArtist.name} (studio)`
      : selectedArtist.name
    : artistNames[0];

  const updateValidity = () => setValid(formRef.current?.checkValidity() ?? false);
  useEffect(updateValidity, []);
  // Showing/hiding release fields changes which inputs are required.
  useEffect(updateValidity, [release, isSeries, isAnnouncement]);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        // <input type="datetime-local"> has no timezone info; `new Date()`
        // here runs in the browser so it resolves against the admin's own
        // local time. Doing this same parsing server-side instead (as we
        // used to) resolved it against the SERVER's timezone (UTC in prod),
        // which is why a time typed in France came out shifted by 2 hours.
        for (const field of ["premiereAt", "releaseAt"]) {
          const raw = String(data.get(field) ?? "").trim();
          if (raw) {
            const date = new Date(raw);
            if (!Number.isNaN(date.getTime())) data.set(field, date.toISOString());
          }
        }
        onSubmit(data);
      }}
      onChange={updateValidity}
      onInput={updateValidity}
      className={`${styles.form} ${formStyles.filmForm}`}
    >
      <FormSection title="Informations">
        {lockedSeriesTitle && <input type="hidden" name="seriesTitle" value={lockedSeriesTitle} />}
        {showSeriesTitleInput && (
          <div className={styles.field}>
            <label htmlFor="seriesTitle">Série</label>
            <input
              id="seriesTitle"
              name="seriesTitle"
              value={seriesTitleValue}
              onChange={(e) => {
                setSeriesTitleValue(e.target.value);
                updateValidity();
              }}
            />
            <span className={formStyles.formHint}>Vider ce champ transforme l&apos;épisode en film.</span>
          </div>
        )}
        <input type="hidden" name="episodeKind" value={isAnnouncement ? "announcement" : "episode"} />
        {isSeries && !isAnnouncement && (
          <>
            <input type="hidden" name="seasonNumber" value={seasonType.replace("Saison ", "")} />
            <div className={styles.row2}>
              <div className={styles.field}>
                <label>Saison</label>
                <Dropdown options={seasonOptions ?? SEASON_TYPE_OPTIONS} value={seasonType} onChange={setSeasonType} />
              </div>
              <div className={styles.field}>
                <label htmlFor="episodeNumber">Numéro d&apos;épisode</label>
                <input
                  id="episodeNumber"
                  name="episodeNumber"
                  type="number"
                  min={1}
                  defaultValue={initial?.episodeNumber ?? undefined}
                  required
                />
              </div>
            </div>
          </>
        )}
        <div className={styles.field}>
          <label htmlFor="title">Titre</label>
          <input id="title" name="title" defaultValue={initial?.title} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="synopsis">Synopsis</label>
          <textarea id="synopsis" name="synopsis" rows={3} defaultValue={initial?.synopsis} required />
        </div>
        <div className={styles.row2}>
          <div className={styles.field}>
            <label htmlFor="year">Année</label>
            <input
              id="year"
              name="year"
              type="number"
              defaultValue={initial?.year || new Date().getFullYear()}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="durationMinutes">Durée (minutes)</label>
            <input
              id="durationMinutes"
              name="durationMinutes"
              type="number"
              min={isAnnouncement ? 0 : 1}
              value={durationMinutes}
              onChange={(e) => {
                setDurationMinutes(e.target.value === "" ? "" : Number(e.target.value));
                setDurationDetected(false);
              }}
              required={!isAnnouncement}
            />
            {durationDetected && <span className={formStyles.formHint}>Calculée depuis la vidéo.</span>}
          </div>
        </div>
        {lockedSeriesTitle ? (
          <>
            <input type="hidden" name="rating" value={rating} />
            <input type="hidden" name="category" value={category} />
            <input type="hidden" name="artistId" value={artistId} />
            <input type="hidden" name="isStudio" value={selectedArtist?.isStudio ? "1" : ""} />
          </>
        ) : (
          <>
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
              <label>{artists.length > 1 ? "Artiste ou studio" : "Artiste"}</label>
              <input type="hidden" name="artistId" value={artistId} />
              <input type="hidden" name="isStudio" value={selectedArtist?.isStudio ? "1" : ""} />
              <Dropdown
                options={artistNames}
                value={selectedArtistName}
                onChange={(name) => {
                  const found = artists.find((a) => (a.isStudio ? `${a.name} (studio)` : a.name) === name);
                  if (found) setArtistId(found.id);
                }}
              />
            </div>
          </>
        )}
      </FormSection>

      <FormSection title="Médias">
        <div className={styles.field}>
          <label>Affiche</label>
          <FileUpload
            allowUrl
            name="poster"
            label="Choisir une image"
            accept="image/*"
            value={poster}
            onChange={setPoster}
            preview
          />
        </div>
        <div className={styles.field}>
          <label>{allowAnnouncement ? "Vidéo (facultatif)" : "Vidéo"}</label>
          <input type="hidden" name="videoDurationSeconds" value={videoDurationSeconds ?? ""} />
          <FileUpload
            allowUrl
            name="videoUrl"
            label="Choisir une vidéo"
            accept="video/*"
            value={videoUrl}
            onChange={(url) => {
              setVideoUrl(url);
              setVideoDurationSeconds(null);
            }}
            onDurationChange={(seconds) => {
              setVideoDurationSeconds(Math.round(seconds));
              setDurationMinutes(minutesFromSeconds(seconds));
              setDurationDetected(true);
            }}
            maxSizeMB={100}
          />
          {allowAnnouncement && (
            <span className={formStyles.formHint}>
              {isAnnouncement
                ? "Sans vidéo, c'est une annonce : seules les bandes-annonces sont visibles, dans « Bientôt sur ZorAnim »."
                : "Pas encore sorti ? Programme la sortie dans « Diffusion » : il restera dans « Bientôt » jusque-là."}
            </span>
          )}
        </div>
        {!isSeries && (
          <>
            {multiTrailers && (
              <div className={styles.field}>
                <label>Bandes-annonces</label>
                <input
                  type="hidden"
                  name="trailers"
                  value={JSON.stringify(trailers.map(({ title, videoUrl }) => ({ title, videoUrl })))}
                />
                <TrailersEditor value={trailers} onChange={setTrailers} />
              </div>
            )}
            {!multiTrailers && (
              <OptionalToggle
                label="Ajouter une bande-annonce"
                defaultOn={!!teaserVideoUrl}
                onDisable={() => setTeaserVideoUrl("")}
              >
                <FileUpload
                  allowUrl
                  name="teaserVideoUrl"
                  label="Choisir une vidéo"
                  accept="video/*"
                  value={teaserVideoUrl}
                  onChange={setTeaserVideoUrl}
                  maxSizeMB={100}
                />
              </OptionalToggle>
            )}
          </>
        )}
      </FormSection>

      {showRelease && (
        <FormSection title="Diffusion">
          <ReleaseFields value={release} onChange={(patch) => setRelease((r) => ({ ...r, ...patch }))} />
        </FormSection>
      )}

      <label className={styles.customCheckbox}>
        <input type="checkbox" name="isNew" defaultChecked={initial?.isNew} />
        <span className={styles.checkboxBox} />
        Afficher le badge « Nouveau » (7 jours)
      </label>

      <button type="submit" className={styles.submitBtn} disabled={pending || !valid || !poster || (!videoUrl && !allowAnnouncement)}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
