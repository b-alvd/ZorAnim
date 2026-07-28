"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/Modal/Modal";
import ConfirmActionButton from "../ConfirmActionButton";
import ArtistSubmissionForm from "./ArtistSubmissionForm";
import { acceptArtistSubmissionAction, refuseArtistSubmissionAction, updateArtistSubmissionAction } from "./actions";
import type { ArtistSubmission } from "@/db/queries";
import styles from "../shared.module.css";

export default function ArtistSubmissionRowActions({ submission }: { submission: ArtistSubmission }) {
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className={styles.rowActions}>
      <button type="button" className={styles.editLink} onClick={() => setEditOpen(true)}>
        Modifier
      </button>
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Modifier la demande de ${submission.name}`}>
        <ArtistSubmissionForm
          initial={submission}
          pending={isPending}
          onSubmit={(formData) =>
            startTransition(async () => {
              await updateArtistSubmissionAction(submission.id, formData);
              setEditOpen(false);
            })
          }
        />
      </Modal>

      <ConfirmActionButton
        label="Accepter"
        confirmTitle="Accepter la demande"
        confirmText={`Accepter ${submission.name} comme artiste ? Sa fiche sera créée sur ZorAnim.`}
        confirmLabel="Accepter"
        action={acceptArtistSubmissionAction.bind(null, submission.id)}
      />
      <ConfirmActionButton
        label="Refuser"
        confirmTitle="Refuser la demande"
        confirmText={`Refuser la demande de "${submission.name}" ? Aucune fiche ne sera créée.`}
        confirmLabel="Refuser"
        variant="danger"
        action={refuseArtistSubmissionAction.bind(null, submission.id)}
      />
    </div>
  );
}
