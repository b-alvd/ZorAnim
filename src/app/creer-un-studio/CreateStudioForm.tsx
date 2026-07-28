"use client";

import { useRef, useState, useTransition } from "react";
import FileUpload from "@/components/FileUpload/FileUpload";
import { createStudioAction } from "./actions";
import styles from "../devenir-artiste/community.module.css";

export default function CreateStudioForm() {
  const [avatar, setAvatar] = useState("");
  const [sent, setSent] = useState(false);
  const [valid, setValid] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const updateValidity = () => setValid(formRef.current?.checkValidity() ?? false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createStudioAction(formData);
      setSent(true);
    });
  };

  if (sent) {
    return (
      <div className={styles.success}>
        <p className={styles.successTitle}>Studio créé</p>
        <p className={styles.successText}>
          Ton studio est prêt. Retrouve-le et invite des artistes depuis ton profil.
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      className={styles.form}
      onSubmit={handleSubmit}
      onChange={updateValidity}
      onInput={updateValidity}
    >
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Nom du studio</span>
        <input name="name" required className={styles.input} placeholder="Nom du studio" />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Bio</span>
        <textarea name="bio" required rows={4} className={styles.textarea} placeholder="Présente ton studio" />
      </label>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Avatar</span>
        <FileUpload name="avatar" label="Choisir une image" accept="image/*" value={avatar} onChange={setAvatar} preview />
      </div>
      <button type="submit" className={styles.cta} disabled={isPending || !valid || !avatar}>
        {isPending ? "Création..." : "Créer le studio"}
      </button>
    </form>
  );
}
