"use client";

import { useEffect, useRef, useState } from "react";
import Dropdown from "@/components/Dropdown/Dropdown";
import FileUpload from "@/components/FileUpload/FileUpload";
import { FormSection } from "../films/FormParts";
import type { AccountOption } from "../artistes/ArtistForm";
import styles from "../shared.module.css";
import formStyles from "../films/films.module.css";

const PICK_OWNER = "Choisir un fondateur…";
const BIO_MAX = 600;

export default function StudioForm({
  initial,
  accounts,
  pending,
  error,
  onSubmit,
}: {
  initial: { name: string; bio: string; avatar: string; ownerId: string | null };
  accounts: AccountOption[];
  pending?: boolean;
  error?: string | null;
  onSubmit: (formData: FormData) => void;
}) {
  const [avatar, setAvatar] = useState(initial.avatar);
  const [bio, setBio] = useState(initial.bio);
  const [ownerId, setOwnerId] = useState(initial.ownerId ?? "");
  const [valid, setValid] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const updateValidity = () => setValid(formRef.current?.checkValidity() ?? false);
  useEffect(updateValidity, []);

  const ownerChanged = !!initial.ownerId && ownerId !== initial.ownerId;

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
      <FormSection title="Profil du studio">
        <div className={styles.field}>
          <label htmlFor="studio-name">Nom</label>
          <input id="studio-name" name="name" defaultValue={initial.name} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="studio-bio">Présentation</label>
          <textarea
            id="studio-bio"
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
          <label>Logo</label>
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

      <FormSection title="Fondateur">
        <div className={styles.field}>
          <label>Compte du fondateur</label>
          <input type="hidden" name="ownerId" value={ownerId} />
          <Dropdown
            options={accounts.map((a) => a.label)}
            value={accounts.find((a) => a.id === ownerId)?.label ?? PICK_OWNER}
            onChange={(label) => setOwnerId(accounts.find((a) => a.label === label)?.id ?? "")}
          />
          <span className={formStyles.formHint}>
            {ownerChanged
              ? "Transfert : l'ancien fondateur reste dans le studio comme membre, le nouveau est prévenu."
              : "Le fondateur gère le studio : invitations, demandes d'adhésion, contenus."}
          </span>
        </div>
      </FormSection>

      {error && <p className={formStyles.formError}>{error}</p>}
      <button type="submit" className={styles.submitBtn} disabled={pending || !valid || !avatar || !ownerId}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
