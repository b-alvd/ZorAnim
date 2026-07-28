"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload/FileUpload";
import styles from "../shared.module.css";

type ArtistFormValues = {
  name: string;
  bio: string;
  avatar: string;
};

export default function ArtistForm({
  onSubmit,
  initial,
  pending,
}: {
  onSubmit: (formData: FormData) => void;
  initial?: ArtistFormValues;
  pending?: boolean;
}) {
  const [avatar, setAvatar] = useState(initial?.avatar ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
      className={styles.form}
    >
      <div className={styles.field}>
        <label htmlFor="name">Nom</label>
        <input id="name" name="name" defaultValue={initial?.name} required />
      </div>
      <div className={styles.field}>
        <label htmlFor="bio">Bio</label>
        <textarea id="bio" name="bio" rows={4} defaultValue={initial?.bio} required />
      </div>
      <div className={styles.field}>
        <label>Avatar</label>
        <FileUpload name="avatar" label="Choisir une image" accept="image/*" value={avatar} onChange={setAvatar} preview />
      </div>
      <button type="submit" className={styles.submitBtn} disabled={pending || !avatar}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
