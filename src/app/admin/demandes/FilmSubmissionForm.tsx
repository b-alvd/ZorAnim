"use client";

import { useEffect, useRef, useState } from "react";
import Dropdown from "@/components/Dropdown/Dropdown";
import FileUpload from "@/components/FileUpload/FileUpload";
import { RATING_OPTIONS } from "@/lib/ratings";
import type { FilmSubmission } from "@/db/queries";
import styles from "../shared.module.css";

export default function FilmSubmissionForm({
  onSubmit,
  categories,
  initial,
  pending,
}: {
  onSubmit: (formData: FormData) => void;
  categories: string[];
  initial: FilmSubmission;
  pending?: boolean;
}) {
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
            min={1}
            defaultValue={initial.durationMinutes}
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
      <button type="submit" className={styles.submitBtn} disabled={pending || !valid || !poster || !videoUrl}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
