"use client";

import { useState, useTransition } from "react";
import Dropdown from "@/components/Dropdown/Dropdown";
import FileUpload from "@/components/FileUpload/FileUpload";
import { RATING_OPTIONS } from "@/lib/ratings";
import { submitFilmAction } from "./actions";
import styles from "../devenir-artiste/community.module.css";

export default function SubmitFilmForm({ categories }: { categories: string[] }) {
  const [rating, setRating] = useState(RATING_OPTIONS[0]);
  const [category, setCategory] = useState(categories[0]);
  const [poster, setPoster] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await submitFilmAction(formData);
      setSent(true);
    });
  };

  if (sent) {
    return (
      <div className={styles.success}>
        <p className={styles.successTitle}>Demande envoyée</p>
        <p className={styles.successText}>
          Merci pour ta soumission, on la regarde et on revient vers toi dès que possible.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.fieldRow}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Ton nom / studio</span>
          <input name="artistName" required className={styles.input} placeholder="Ton nom" />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Email de contact</span>
          <input name="contactEmail" type="email" required className={styles.input} placeholder="ton@email.com" />
        </label>
      </div>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Titre du film</span>
        <input name="title" required className={styles.input} />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Synopsis</span>
        <textarea name="synopsis" required rows={4} className={styles.textarea} />
      </label>
      <div className={styles.fieldRow}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Année</span>
          <input name="year" type="number" required className={styles.input} />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Durée (minutes)</span>
          <input name="durationMinutes" type="number" min={1} required className={styles.input} />
        </label>
      </div>
      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Classification</span>
          <input type="hidden" name="rating" value={rating} />
          <Dropdown options={RATING_OPTIONS} value={rating} onChange={setRating} />
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Catégorie</span>
          <input type="hidden" name="category" value={category} />
          <Dropdown options={categories} value={category} onChange={setCategory} />
        </div>
      </div>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Poster</span>
        <FileUpload name="poster" label="Choisir une image" accept="image/*" value={poster} onChange={setPoster} preview />
      </div>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Vidéo</span>
        <FileUpload
          name="videoUrl"
          label="Choisir une vidéo"
          accept="video/*"
          value={videoUrl}
          onChange={setVideoUrl}
          maxSizeMB={100}
        />
      </div>
      <button type="submit" className={styles.cta} disabled={isPending || !poster || !videoUrl}>
        {isPending ? "Envoi..." : "Envoyer ma demande"}
      </button>
    </form>
  );
}
