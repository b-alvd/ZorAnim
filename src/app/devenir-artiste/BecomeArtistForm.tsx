"use client";

import { useState, useTransition } from "react";
import FileUpload from "@/components/FileUpload/FileUpload";
import { submitArtistAction } from "./actions";
import styles from "./community.module.css";

export default function BecomeArtistForm({
  initialName,
  initialEmail,
}: {
  initialName: string;
  initialEmail: string;
}) {
  const [avatar, setAvatar] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await submitArtistAction(formData);
      setSent(true);
    });
  };

  if (sent) {
    return (
      <div className={styles.success}>
        <p className={styles.successTitle}>Demande envoyée</p>
        <p className={styles.successText}>
          Merci pour ta présentation, on la regarde et on revient vers toi dès que possible.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.fieldRow}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Nom / nom de studio</span>
          <input name="name" required defaultValue={initialName} className={styles.input} placeholder="Ton nom" />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Email de contact</span>
          <input
            name="contactEmail"
            type="email"
            required
            defaultValue={initialEmail}
            className={styles.input}
            placeholder="ton@email.com"
          />
        </label>
      </div>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Bio</span>
        <textarea name="bio" required rows={4} className={styles.textarea} placeholder="Parle-nous de toi et de ton travail" />
      </label>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Photo / avatar (optionnel)</span>
        <FileUpload name="avatar" label="Choisir une image" accept="image/*" value={avatar} onChange={setAvatar} preview />
      </div>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Lien vers ton travail (optionnel)</span>
        <input name="portfolioUrl" className={styles.input} placeholder="https://..." />
      </label>
      <button type="submit" className={styles.cta} disabled={isPending}>
        {isPending ? "Envoi..." : "Envoyer ma présentation"}
      </button>
    </form>
  );
}
