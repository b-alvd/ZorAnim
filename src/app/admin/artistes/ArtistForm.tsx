"use client";

import { useEffect, useRef, useState } from "react";
import Dropdown from "@/components/Dropdown/Dropdown";
import FileUpload from "@/components/FileUpload/FileUpload";
import { FormSection } from "../films/FormParts";
import styles from "../shared.module.css";
import formStyles from "../films/films.module.css";

type ArtistFormValues = {
  name: string;
  bio: string;
  avatar: string;
  userId?: string | null;
};

export type AccountOption = { id: string; label: string };

const PICK_ACCOUNT = "Choisir un compte…";
const BIO_MAX = 600;

export default function ArtistForm({
  onSubmit,
  initial,
  pending,
  accounts,
  error,
}: {
  onSubmit: (formData: FormData) => void;
  initial?: ArtistFormValues;
  pending?: boolean;
  // Accounts that can be linked (free ones, plus the current one).
  accounts: AccountOption[];
  error?: string | null;
}) {
  const [avatar, setAvatar] = useState(initial?.avatar ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [userId, setUserId] = useState(initial?.userId ?? "");
  const [valid, setValid] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const updateValidity = () => setValid(formRef.current?.checkValidity() ?? false);
  useEffect(updateValidity, []);

  const accountLabel = accounts.find((a) => a.id === userId)?.label ?? PICK_ACCOUNT;

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
      onChange={updateValidity}
      onInput={updateValidity}
      className={`${styles.form} ${formStyles.filmForm}`}
    >
      <FormSection title="Profil">
        <div className={styles.field}>
          <label htmlFor="name">Nom d&apos;artiste</label>
          <input id="name" name="name" defaultValue={initial?.name} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            value={bio}
            maxLength={BIO_MAX}
            onChange={(e) => setBio(e.target.value)}
            required
          />
          <span className={formStyles.formHint}>
            {bio.length} / {BIO_MAX} caractères
          </span>
        </div>
        <div className={styles.field}>
          <label>Photo de profil</label>
          <FileUpload
            allowUrl
            name="avatar"
            label="Choisir une image"
            accept="image/*"
            value={avatar}
            onChange={setAvatar}
            preview
          />
        </div>
      </FormSection>

      <FormSection title="Compte">
        <div className={styles.field}>
          <label>Compte de l&apos;artiste</label>
          <input type="hidden" name="userId" value={userId} />
          <Dropdown
            options={accounts.map((a) => a.label)}
            value={accountLabel}
            onChange={(label) => setUserId(accounts.find((a) => a.label === label)?.id ?? "")}
          />
          <span className={formStyles.formHint}>
            {accounts.length === 0
              ? "Aucun compte disponible : chaque compte a déjà un profil d'artiste."
              : "Le compte gère ce profil depuis « Mon espace » et peut rejoindre des studios. Un compte ne peut avoir qu'un seul profil d'artiste."}
          </span>
        </div>
      </FormSection>

      {error && <p className={formStyles.formError}>{error}</p>}
      <button type="submit" className={styles.submitBtn} disabled={pending || !valid || !avatar || !userId}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
