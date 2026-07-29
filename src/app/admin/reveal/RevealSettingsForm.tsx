"use client";

import { useState, useTransition } from "react";
import { updateRevealSettingsAction } from "./actions";
import adminStyles from "../shared.module.css";
import styles from "./reveal.module.css";

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function RevealSettingsForm({
  initialEnabled,
  initialRevealAt,
}: {
  initialEnabled: boolean;
  initialRevealAt: string | null;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [localValue, setLocalValue] = useState(toLocalInputValue(initialRevealAt));
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isFuture = localValue ? new Date(localValue).getTime() > Date.now() : false;

  const handleSave = () => {
    setSaved(false);
    startTransition(async () => {
      const revealAt = localValue ? new Date(localValue).toISOString() : null;
      await updateRevealSettingsAction({ revealEnabled: enabled, revealAt });
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
        Activer la page de compte à rebours (bloque tout le site sauf l&apos;admin)
      </label>

      <div className={adminStyles.field}>
        <label htmlFor="revealAt">Date et heure du reveal</label>
        <input
          id="revealAt"
          type="datetime-local"
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
            setSaved(false);
          }}
          className={styles.dateInput}
        />
      </div>

      {enabled && localValue && !isFuture && (
        <p className={styles.warning}>Cette date est déjà passée : le site sera immédiatement révélé aux visiteurs.</p>
      )}
      {enabled && !localValue && (
        <p className={styles.warning}>
          Sans date, la page de compte à rebours reste affichée indéfiniment (pas de reveal automatique).
        </p>
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
