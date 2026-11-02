"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/Modal/Modal";
import { banUserAction } from "./actions";
import adminStyles from "../shared.module.css";

export default function BanUserButton({ userId, userName }: { userId: string; userName: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleBan = () => {
    setError(null);
    startTransition(async () => {
      const result = await banUserAction(userId, reason);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setReason("");
    });
  };

  return (
    <>
      <button
        type="button"
        className={adminStyles.deleteIconBtn}
        onClick={() => setOpen(true)}
        title="Bannir"
        aria-label="Bannir"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M5.6 5.6l12.8 12.8" />
        </svg>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Bannir ${userName}`}>
        <p className={adminStyles.confirmText}>
          Bannir <strong>{userName}</strong> ? Cette personne sera immédiatement déconnectée et ne pourra plus se
          reconnecter. Elle pourra faire une demande de débannissement.
        </p>
        <div className={adminStyles.field}>
          <label htmlFor="banReason">Raison (affichée à la personne)</label>
          <textarea
            id="banReason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex : comportement toxique, spam..."
          />
        </div>
        {error && <p className={adminStyles.confirmText}>{error}</p>}
        <div className={adminStyles.confirmActions}>
          <button type="button" className={adminStyles.cancelBtn} onClick={() => setOpen(false)} disabled={isPending}>
            Annuler
          </button>
          <button type="button" className={adminStyles.confirmDeleteBtn} disabled={isPending} onClick={handleBan}>
            {isPending ? "Bannissement…" : "Bannir"}
          </button>
        </div>
      </Modal>
    </>
  );
}
