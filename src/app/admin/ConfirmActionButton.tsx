"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/Modal/Modal";
import styles from "./shared.module.css";

export default function ConfirmActionButton({
  label,
  confirmTitle,
  confirmText,
  confirmLabel = "Confirmer",
  action,
  variant = "neutral",
}: {
  label: string;
  confirmTitle: string;
  confirmText: string;
  confirmLabel?: string;
  action: () => Promise<void>;
  variant?: "neutral" | "danger";
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        className={variant === "danger" ? styles.deleteBtn : styles.editLink}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={confirmTitle}>
        <p className={styles.confirmText}>{confirmText}</p>
        <div className={styles.confirmActions}>
          <button type="button" className={styles.cancelBtn} onClick={() => setOpen(false)} disabled={isPending}>
            Annuler
          </button>
          <button
            type="button"
            className={variant === "danger" ? styles.confirmDeleteBtn : styles.submitBtn}
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await action();
                setOpen(false);
              })
            }
          >
            {isPending ? "..." : confirmLabel}
          </button>
        </div>
      </Modal>
    </>
  );
}
