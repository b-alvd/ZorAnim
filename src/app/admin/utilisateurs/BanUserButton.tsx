"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/Modal/Modal";
import adminStyles from "../shared.module.css";

export default function BanUserButton({
  userId,
  userName,
  banAction,
}: {
  userId: string;
  userName: string;
  banAction: (id: string, reason: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleBan = () => {
    setError(null);
    startTransition(async () => {
      try {
        await banAction(userId, reason);
        setOpen(false);
        setReason("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Une erreur est survenue.");
      }
    });
  };

  return (
    <>
      <button type="button" className={adminStyles.deleteBtn} onClick={() => setOpen(true)}>
        Bannir
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Bannir cet utilisateur">
        <p className={adminStyles.confirmText}>
          Bannir <strong>{userName}</strong> ? Il sera immédiatement déconnecté et ne pourra plus se reconnecter.
        </p>
        <div className={adminStyles.field}>
          <label htmlFor="banReason">Raison (optionnel)</label>
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
