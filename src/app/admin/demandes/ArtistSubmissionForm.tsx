"use client";

import { useEffect, useRef, useState } from "react";
import FileUpload from "@/components/FileUpload/FileUpload";
import type { ArtistSubmission } from "@/db/queries";
import styles from "../shared.module.css";

export default function ArtistSubmissionForm({
  onSubmit,
  initial,
  pending,
}: {
  onSubmit: (formData: FormData) => void;
  initial: ArtistSubmission;
  pending?: boolean;
}) {
  const [avatar, setAvatar] = useState(initial.avatar ?? "");
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
          <label htmlFor="name">Nom / studio</label>
          <input id="name" name="name" defaultValue={initial.name} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="contactEmail">Email de contact</label>
          <input id="contactEmail" name="contactEmail" type="email" defaultValue={initial.contactEmail} required />
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor="bio">Bio</label>
        <textarea id="bio" name="bio" rows={4} defaultValue={initial.bio} required />
      </div>
      <div className={styles.field}>
        <label>Avatar (optionnel)</label>
        <FileUpload name="avatar" label="Choisir une image" accept="image/*" value={avatar} onChange={setAvatar} preview />
      </div>
      <div className={styles.field}>
        <label htmlFor="portfolioUrl">Lien portfolio (optionnel)</label>
        <input id="portfolioUrl" name="portfolioUrl" defaultValue={initial.portfolioUrl ?? ""} />
      </div>
      <button type="submit" className={styles.submitBtn} disabled={pending || !valid}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
