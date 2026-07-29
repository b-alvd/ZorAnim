"use client";

import { useState, useTransition } from "react";
import { updateMaintenanceSettingsAction } from "./actions";
import adminStyles from "../shared.module.css";
import styles from "../reveal/reveal.module.css";

export default function MaintenanceSettingsForm({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setSaved(false);
    startTransition(async () => {
      await updateMaintenanceSettingsAction({ maintenanceEnabled: enabled });
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
        Activer la page de maintenance (bloque tout le site sauf l&apos;admin)
      </label>

      {enabled && (
        <p className={styles.warning}>
          Le site affichera immédiatement la page de maintenance à tous les visiteurs, jusqu&apos;à ce que tu
          décoches cette case.
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
