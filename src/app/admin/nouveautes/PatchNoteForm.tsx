"use client";

import { useState, useTransition } from "react";
import { updatePatchNoteAction } from "./actions";
import adminStyles from "../shared.module.css";
import styles from "../reveal/reveal.module.css";

export default function PatchNoteForm({
  initialEnabled,
  initialTitle,
  initialMessage,
}: {
  initialEnabled: boolean;
  initialTitle: string | null;
  initialMessage: string | null;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [title, setTitle] = useState(initialTitle ?? "");
  const [message, setMessage] = useState(initialMessage ?? "");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setSaved(false);
    startTransition(async () => {
      await updatePatchNoteAction({
        patchNoteEnabled: enabled,
        patchNoteTitle: title.trim() || null,
        patchNoteMessage: message.trim() || null,
      });
      setSaved(true);
    });
  };

  return (
    <div className={styles.card}>
      <label className={adminStyles.customCheckbox}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            setEnabled(e.target.checked);
            setSaved(false);
          }}
        />
        <span className={adminStyles.checkboxBox} />
        Afficher l&apos;encart sur la page d&apos;accueil
      </label>

      <div className={adminStyles.field}>
        <label htmlFor="patchTitle">Titre</label>
        <input
          id="patchTitle"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setSaved(false);
          }}
          placeholder="Ex : Nouveautés de la semaine"
        />
      </div>

      <div className={adminStyles.field}>
        <label htmlFor="patchMessage">Message</label>
        <textarea
          id="patchMessage"
          rows={6}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setSaved(false);
          }}
          placeholder="Décris les dernières nouveautés du site..."
        />
      </div>

      {enabled && !message.trim() && (
        <p className={styles.warning}>Sans message, l&apos;encart ne s&apos;affichera pas même s&apos;il est activé.</p>
      )}

      <div className={styles.actionsRow}>
        <button type="button" className={adminStyles.submitBtn} onClick={handleSave} disabled={isPending}>
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
        {saved && !isPending && <span className={styles.savedTag}>Enregistré</span>}
      </div>
    </div>
  );
}
