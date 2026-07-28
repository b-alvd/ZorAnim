"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/Modal/Modal";
import { replyToContactMessageAction } from "./actions";
import type { ContactMessage } from "@/db/queries";
import styles from "../shared.module.css";

export default function MessageReplyButton({ message }: { message: ContactMessage }) {
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState(message.adminReply ?? "");
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button type="button" className={styles.editLink} onClick={() => setOpen(true)}>
        {message.adminReply ? "Modifier la réponse" : "Répondre"}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Répondre à ${message.name}`}>
        <div className={styles.form}>
          <div className={styles.field}>
            <label>Message reçu</label>
            <p className={styles.confirmText}>{message.message}</p>
          </div>
          <div className={styles.field}>
            <label htmlFor="reply">Ta réponse</label>
            <textarea
              id="reply"
              rows={5}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Écris ta réponse..."
            />
          </div>
          <button
            type="button"
            className={styles.submitBtn}
            disabled={isPending || !reply.trim()}
            onClick={() =>
              startTransition(async () => {
                await replyToContactMessageAction(message.id, reply.trim());
                setOpen(false);
              })
            }
          >
            {isPending ? "Envoi…" : "Envoyer la réponse"}
          </button>
        </div>
      </Modal>
    </>
  );
}
