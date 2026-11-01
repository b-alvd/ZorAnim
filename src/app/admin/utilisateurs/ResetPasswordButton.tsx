"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/Modal/Modal";
import adminStyles from "../shared.module.css";

export default function ResetPasswordButton({
  userId,
  userName,
  resetAction,
}: {
  userId: string;
  userName: string;
  resetAction: (id: string) => Promise<string>;
}) {
  const [open, setOpen] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const close = () => {
    setOpen(false);
    // Forget it as soon as the dialog closes: it's only meant to be read once.
    setTemporaryPassword(null);
    setCopied(false);
    setError(null);
  };

  const handleReset = () => {
    setError(null);
    startTransition(async () => {
      try {
        setTemporaryPassword(await resetAction(userId));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Une erreur est survenue.");
      }
    });
  };

  const handleCopy = async () => {
    if (!temporaryPassword) return;
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
    } catch {
      // Clipboard blocked: the password is still on screen to copy by hand.
    }
  };

  return (
    <>
      <button type="button" className={adminStyles.linkBtn} onClick={() => setOpen(true)}>
        Réinitialiser le mot de passe
      </button>
      <Modal open={open} onClose={close} title="Réinitialiser le mot de passe">
        {temporaryPassword ? (
          <>
            <p className={adminStyles.confirmText}>
              Mot de passe temporaire de <strong>{userName}</strong> :
            </p>
            <div className={adminStyles.field}>
              <input readOnly value={temporaryPassword} onFocus={(e) => e.currentTarget.select()} />
            </div>
            <p className={adminStyles.confirmText}>
              Transmets-le-lui. Il devra choisir un nouveau mot de passe dès sa prochaine connexion. Ce mot de passe
              ne sera plus affiché après fermeture de cette fenêtre.
            </p>
            <div className={adminStyles.confirmActions}>
              <button type="button" className={adminStyles.cancelBtn} onClick={handleCopy}>
                {copied ? "Copié !" : "Copier"}
              </button>
              <button type="button" className={adminStyles.submitBtn} onClick={close}>
                Terminé
              </button>
            </div>
          </>
        ) : (
          <>
            <p className={adminStyles.confirmText}>
              Réinitialiser le mot de passe de <strong>{userName}</strong> ? Son mot de passe actuel ne fonctionnera
              plus et il sera déconnecté partout. Un mot de passe temporaire va être généré.
            </p>
            {error && <p className={adminStyles.confirmText}>{error}</p>}
            <div className={adminStyles.confirmActions}>
              <button type="button" className={adminStyles.cancelBtn} onClick={close} disabled={isPending}>
                Annuler
              </button>
              <button type="button" className={adminStyles.confirmDeleteBtn} disabled={isPending} onClick={handleReset}>
                {isPending ? "Réinitialisation…" : "Réinitialiser"}
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
