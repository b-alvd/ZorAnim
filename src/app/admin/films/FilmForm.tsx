"use client";

import { useEffect, useRef, useState } from "react";
import Dropdown from "@/components/Dropdown/Dropdown";
import FileUpload from "@/components/FileUpload/FileUpload";
import type { Artist } from "@/data/types";
import { RATING_OPTIONS } from "@/lib/ratings";
import styles from "../shared.module.css";

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
  episodeKind?: "episode" | "teaser";
  teaserVideoUrl?: string | null;
  premiereAt?: string | null;
  releaseAt?: string | null;
  videoDurationSeconds?: number | null;
};

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const SEASON_TYPE_OPTIONS = ["Teaser", "Saison 1", "Saison 2", "Saison 3", "Saison 4", "Saison 5", "Saison 6"];

function seasonTypeLabel(episodeKind: string | undefined, seasonNumber: number | null | undefined): string {
  if (episodeKind === "teaser") return "Teaser";
  return `Saison ${seasonNumber ?? 1}`;
}

export default function FilmForm({
  onSubmit,
  artists,
  categories,
  initial,
  pending,
  lockedSeriesTitle,
  allowSeries = true,
}: {
  onSubmit: (formData: FormData) => void;
  artists: Artist[];
  categories: string[];
  initial?: FilmFormValues;
  pending?: boolean;
  lockedSeriesTitle?: string;
  allowSeries?: boolean;
}) {
  const [rating, setRating] = useState(initial?.rating ?? RATING_OPTIONS[0]);
  const [category, setCategory] = useState(initial?.category ?? categories[0]);
  const [artistId, setArtistId] = useState(initial?.artistId ?? artists[0]?.id ?? "");
  const [poster, setPoster] = useState(initial?.poster ?? "");
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? "");
  const [videoDurationSeconds, setVideoDurationSeconds] = useState(initial?.videoDurationSeconds ?? null);
  const [teaserVideoUrl, setTeaserVideoUrl] = useState(initial?.teaserVideoUrl ?? "");
  const [seriesTitleValue, setSeriesTitleValue] = useState(lockedSeriesTitle ?? initial?.seriesTitle ?? "");
  const [seasonType, setSeasonType] = useState(
    initial ? seasonTypeLabel(initial.episodeKind, initial.seasonNumber) : "Teaser"
  );
  const isSeries = !!lockedSeriesTitle || !!seriesTitleValue.trim();
  const isTeaser = seasonType === "Teaser";
  const [standaloneTeaser, setStandaloneTeaser] = useState(!isSeries && initial?.episodeKind === "teaser");
  const showSeriesTitleInput = allowSeries && !lockedSeriesTitle && (!initial || !!initial.seriesTitle);
  const [valid, setValid] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const artistNames = artists.map((a) => (a.isStudio ? `${a.name} (studio)` : a.name));
  const selectedArtist = artists.find((a) => a.id === artistId);
  const selectedArtistName = selectedArtist ? (selectedArtist.isStudio ? `${selectedArtist.name} (studio)` : selectedArtist.name) : artistNames[0];

  const updateValidity = () => setValid(formRef.current?.checkValidity() ?? false);
  useEffect(updateValidity, []);

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
      className={styles.form}
    >
      {lockedSeriesTitle && <input type="hidden" name="seriesTitle" value={lockedSeriesTitle} />}
      {showSeriesTitleInput && (
        <div className={styles.field}>
          <label htmlFor="seriesTitle">Titre de la série (optionnel)</label>
          <input
            id="seriesTitle"
            name="seriesTitle"
            value={seriesTitleValue}
            onChange={(e) => {
              setSeriesTitleValue(e.target.value);
              updateValidity();
            }}
          />
        </div>
      )}
      {isSeries && (
        <>
          <input type="hidden" name="episodeKind" value={isTeaser ? "teaser" : "episode"} />
          {!isTeaser && (
            <input type="hidden" name="seasonNumber" value={seasonType.replace("Saison ", "")} />
          )}
          <div className={styles.row2}>
            <div className={styles.field}>
              <label>Type</label>
              <Dropdown options={SEASON_TYPE_OPTIONS} value={seasonType} onChange={setSeasonType} />
            </div>
            <div className={styles.field}>
              <label htmlFor="episodeNumber">Numéro</label>
              <input
                id="episodeNumber"
                name="episodeNumber"
                type="number"
                min={1}
                defaultValue={initial?.episodeNumber ?? undefined}
                required={isSeries}
              />
            </div>
          </div>
        </>
      )}
      {!isSeries && (
        <>
          <input type="hidden" name="episodeKind" value={standaloneTeaser ? "teaser" : "episode"} />
          <label className={styles.customCheckbox}>
            <input
              type="checkbox"
              checked={standaloneTeaser}
              onChange={(e) => setStandaloneTeaser(e.target.checked)}
            />
            <span className={styles.checkboxBox} />
            Teaser uniquement (le film n&apos;est pas encore sorti, affiché dans &quot;Bientôt sur ZorAnim&quot;)
          </label>
        </>
      )}
      {!isSeries && !standaloneTeaser && (
        <div className={styles.field}>
          <label>Bande-annonce (optionnel)</label>
          <FileUpload
            name="teaserVideoUrl"
            label="Choisir une vidéo"
            accept="video/*"
            value={teaserVideoUrl}
            onChange={setTeaserVideoUrl}
            maxSizeMB={100}
          />
        </div>
      )}
      <div className={styles.field}>
        <label htmlFor="title">Titre</label>
        <input id="title" name="title" defaultValue={initial?.title} required />
      </div>
      <div className={styles.field}>
        <label htmlFor="synopsis">Synopsis</label>
        <textarea id="synopsis" name="synopsis" rows={4} defaultValue={initial?.synopsis} required />
      </div>
      <div className={styles.row2}>
        <div className={styles.field}>
          <label htmlFor="year">Année</label>
          <input id="year" name="year" type="number" defaultValue={initial?.year} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="durationMinutes">Durée (minutes)</label>
          <input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            min={1}
            defaultValue={initial?.durationMinutes}
            required
          />
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
            <label>Artiste</label>
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
      <div className={styles.field}>
        <label>{!isSeries && standaloneTeaser ? "Vidéo (teaser)" : "Vidéo"}</label>
        <input type="hidden" name="videoDurationSeconds" value={videoDurationSeconds ?? ""} />
        <FileUpload
          name="videoUrl"
          label="Choisir une vidéo"
          accept="video/*"
          value={videoUrl}
          onChange={(url) => {
            setVideoUrl(url);
            setVideoDurationSeconds(null);
          }}
          onDurationChange={(seconds) => setVideoDurationSeconds(Math.round(seconds))}
          maxSizeMB={100}
        />
      </div>
      <label className={styles.customCheckbox}>
        <input type="checkbox" name="isNew" defaultChecked={initial?.isNew} />
        <span className={styles.checkboxBox} />
        Marquer comme nouveauté (visible 7 jours)
      </label>
      <div className={styles.row2}>
        <div className={styles.field}>
          <label htmlFor="premiereAt">Avant-première (optionnel)</label>
          <input
            id="premiereAt"
            name="premiereAt"
            type="datetime-local"
            defaultValue={toDatetimeLocal(initial?.premiereAt)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="releaseAt">Sortie officielle (optionnel)</label>
          <input
            id="releaseAt"
            name="releaseAt"
            type="datetime-local"
            defaultValue={toDatetimeLocal(initial?.releaseAt)}
          />
        </div>
      </div>
      <button type="submit" className={styles.submitBtn} disabled={pending || !valid || !poster || !videoUrl}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
