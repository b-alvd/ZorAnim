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
};

export default function FilmForm({
  onSubmit,
  artists,
  categories,
  initial,
  pending,
  lockedSeriesTitle,
}: {
  onSubmit: (formData: FormData) => void;
  artists: Artist[];
  categories: string[];
  initial?: FilmFormValues;
  pending?: boolean;
  lockedSeriesTitle?: string;
}) {
  const [rating, setRating] = useState(initial?.rating ?? RATING_OPTIONS[0]);
  const [category, setCategory] = useState(initial?.category ?? categories[0]);
  const [artistId, setArtistId] = useState(initial?.artistId ?? artists[0]?.id ?? "");
  const [poster, setPoster] = useState(initial?.poster ?? "");
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? "");
  const [seriesTitleValue, setSeriesTitleValue] = useState(lockedSeriesTitle ?? initial?.seriesTitle ?? "");
  const isSeries = !!lockedSeriesTitle || !!seriesTitleValue.trim();
  const showSeriesTitleInput = !lockedSeriesTitle && (!initial || !!initial.seriesTitle);
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
        onSubmit(new FormData(e.currentTarget));
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
          <div className={styles.row2}>
            <div className={styles.field}>
              <label htmlFor="seasonNumber">Numéro de saison</label>
              <input
                id="seasonNumber"
                name="seasonNumber"
                type="number"
                min={1}
                defaultValue={initial?.seasonNumber ?? 1}
                required={isSeries}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="episodeNumber">Numéro d&apos;épisode</label>
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
      <label className={styles.customCheckbox}>
        <input type="checkbox" name="isNew" defaultChecked={initial?.isNew} />
        <span className={styles.checkboxBox} />
        Marquer comme nouveauté (visible 7 jours)
      </label>
      <button type="submit" className={styles.submitBtn} disabled={pending || !valid || !poster || !videoUrl}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
