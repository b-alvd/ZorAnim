"use client";

import { useState, useTransition } from "react";
import Modal from "../Modal";
import ConfirmActionButton from "../ConfirmActionButton";
import Dropdown from "@/components/Dropdown/Dropdown";
import FilmSubmissionForm from "./FilmSubmissionForm";
import { acceptFilmSubmissionAction, refuseFilmSubmissionAction, updateFilmSubmissionAction } from "./actions";
import type { Artist } from "@/data/types";
import type { FilmSubmission } from "@/db/queries";
import styles from "../shared.module.css";

export default function FilmSubmissionRowActions({
  submission,
  categories,
  artists,
}: {
  submission: FilmSubmission;
  categories: string[];
  artists: Artist[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [artistId, setArtistId] = useState(artists[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const [isAccepting, startAccepting] = useTransition();

  const artistNames = artists.map((a) => a.name);
  const selectedArtistName = artists.find((a) => a.id === artistId)?.name ?? artistNames[0];

  return (
    <div className={styles.rowActions}>
      <button type="button" className={styles.editLink} onClick={() => setEditOpen(true)}>
        Modifier
      </button>
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Modifier la demande de ${submission.artistName}`}>
        <FilmSubmissionForm
          categories={categories}
          initial={submission}
          pending={isPending}
          onSubmit={(formData) =>
            startTransition(async () => {
              await updateFilmSubmissionAction(submission.id, formData);
              setEditOpen(false);
            })
          }
        />
      </Modal>

      <button type="button" className={styles.editLink} onClick={() => setAcceptOpen(true)} disabled={artists.length === 0}>
        Accepter
      </button>
      <Modal open={acceptOpen} onClose={() => setAcceptOpen(false)} title="Accepter la demande">
        <p className={styles.confirmText}>
          Choisis l&apos;artiste à associer à ce film. Le film sera ajouté au catalogue.
        </p>
        <div className={styles.field} style={{ marginBottom: 20 }}>
          <Dropdown
            options={artistNames}
            value={selectedArtistName}
            onChange={(name) => {
              const found = artists.find((a) => a.name === name);
              if (found) setArtistId(found.id);
            }}
          />
        </div>
        <div className={styles.confirmActions}>
          <button type="button" className={styles.cancelBtn} onClick={() => setAcceptOpen(false)} disabled={isAccepting}>
            Annuler
          </button>
          <button
            type="button"
            className={styles.submitBtn}
            disabled={isAccepting || !artistId}
            onClick={() =>
              startAccepting(async () => {
                await acceptFilmSubmissionAction(submission.id, artistId);
                setAcceptOpen(false);
              })
            }
          >
            {isAccepting ? "..." : "Accepter et ajouter"}
          </button>
        </div>
      </Modal>

      <ConfirmActionButton
        label="Refuser"
        confirmTitle="Refuser la demande"
        confirmText={`Refuser la demande de "${submission.title}" ? Le film ne sera pas ajouté.`}
        confirmLabel="Refuser"
        variant="danger"
        action={refuseFilmSubmissionAction.bind(null, submission.id)}
      />
    </div>
  );
}
