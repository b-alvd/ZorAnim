"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/Modal/Modal";
import styles from "./shared.module.css";

export default function ConfirmDeleteButton({
  action,
  itemName,
  compact = false,
}: {
  action: () => Promise<void>;
  itemName: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      {compact ? (
        <button
          type="button"
          className={styles.deleteIconBtn}
          onClick={() => setOpen(true)}
          title="Supprimer"
          aria-label="Supprimer"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
          </svg>
        </button>
      ) : (
        <button type="button" className={styles.deleteBtn} onClick={() => setOpen(true)}>
          Supprimer
        </button>
      )}
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
