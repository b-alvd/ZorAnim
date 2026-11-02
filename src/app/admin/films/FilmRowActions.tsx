"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/Modal/Modal";
import ConfirmDeleteButton from "../ConfirmDeleteButton";
import FilmForm from "./FilmForm";
import { deleteFilmAction, launchPremiereAction, stopPremiereAction, updateFilmAction } from "./actions";
import type { Artist } from "@/data/types";
import type { AdminFilm } from "./FilmsManager";
import styles from "../shared.module.css";

export default function FilmRowActions({
  film,
  artists,
  categories,
}: {
  film: AdminFilm;
  artists: Artist[];
  categories: string[];
}) {
  const [open, setOpen] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Status is computed on the server (see page.tsx), keeping render pure.
  const premiereNotStarted = film.status.kind === "premiere";
  const premiereLive = film.status.kind === "live";

  return (
    <div className={styles.rowActions}>
      <button
        type="button"
        className={styles.iconBtn}
        onClick={() => setOpen(true)}
        title="Modifier"
        aria-label="Modifier"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
        </svg>
      </button>
      {premiereNotStarted && (
        <button
          type="button"
          className={styles.editLink}
          disabled={isPending}
          onClick={() => startTransition(() => launchPremiereAction(film.id))}
        >
          Lancer l&apos;avant-première
        </button>
      )}
      {premiereLive && (
        <button type="button" className={styles.editLink} onClick={() => setConfirmStop(true)}>
          Arrêter l&apos;avant-première
        </button>
      )}
      <Modal open={confirmStop} onClose={() => setConfirmStop(false)} title={`Arrêter l'avant-première de « ${film.title} »`}>
        <p className={styles.confirmText}>
          Arrêter le direct de <strong>{film.title}</strong> maintenant ? Les spectateurs seront renvoyés à
          l&apos;accueil.{" "}
          {film.releaseAt
            ? "L'épisode restera verrouillé jusqu'à sa sortie officielle."
            : "Sans sortie officielle programmée, il deviendra disponible librement."}
        </p>
        <div className={styles.confirmActions}>
          <button type="button" className={styles.cancelBtn} onClick={() => setConfirmStop(false)} disabled={isPending}>
            Annuler
          </button>
          <button
            type="button"
            className={styles.confirmDeleteBtn}
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await stopPremiereAction(film.id);
                setConfirmStop(false);
              })
            }
          >
            Arrêter le direct
          </button>
        </div>
      </Modal>
      <Modal open={open} onClose={() => setOpen(false)} title={`Modifier « ${film.title} »`} fixedHeight>
        <FilmForm
          artists={artists}
          categories={categories}
          initial={film}
          pending={isPending}
          onSubmit={(formData) =>
            startTransition(async () => {
              await updateFilmAction(film.id, formData);
              setOpen(false);
            })
          }
        />
      </Modal>
      <ConfirmDeleteButton action={deleteFilmAction.bind(null, film.id)} itemName={film.title} compact />
    </div>
  );
}
