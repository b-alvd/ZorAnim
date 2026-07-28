"use client";

import { useState } from "react";
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
};

export default function FilmForm({
  onSubmit,
  artists,
  categories,
  initial,
  pending,
}: {
  onSubmit: (formData: FormData) => void;
  artists: Artist[];
  categories: string[];
  initial?: FilmFormValues;
  pending?: boolean;
}) {
  const [rating, setRating] = useState(initial?.rating ?? RATING_OPTIONS[0]);
  const [category, setCategory] = useState(initial?.category ?? categories[0]);
  const [artistId, setArtistId] = useState(initial?.artistId ?? artists[0]?.id ?? "");
  const [poster, setPoster] = useState(initial?.poster ?? "");
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? "");

  const artistNames = artists.map((a) => a.name);
  const selectedArtistName = artists.find((a) => a.id === artistId)?.name ?? artistNames[0];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
      className={styles.form}
    >
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
        <Dropdown
          options={artistNames}
          value={selectedArtistName}
          onChange={(name) => {
            const found = artists.find((a) => a.name === name);
            if (found) setArtistId(found.id);
          }}
        />
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
      <button type="submit" className={styles.submitBtn} disabled={pending || !poster || !videoUrl}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
