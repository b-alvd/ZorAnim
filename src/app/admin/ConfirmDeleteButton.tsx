"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/Modal/Modal";
import styles from "./shared.module.css";

export default function ConfirmDeleteButton({
  action,
  itemName,
}: {
  action: () => Promise<void>;
  itemName: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button type="button" className={styles.deleteBtn} onClick={() => setOpen(true)}>
        Supprimer
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Confirmer la suppression">
        <p className={styles.confirmText}>
          Supprimer <strong>{itemName}</strong> ? Cette action est irréversible.
        </p>
        <div className={styles.confirmActions}>
          <button type="button" className={styles.cancelBtn} onClick={() => setOpen(false)} disabled={isPending}>
            Annuler
          </button>
          <button
            type="button"
            className={styles.confirmDeleteBtn}
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await action();
                setOpen(false);
              })
            }
          >
            {isPending ? "Suppression…" : "Supprimer"}
          </button>
        </div>
      </Modal>
    </>
  );
}
