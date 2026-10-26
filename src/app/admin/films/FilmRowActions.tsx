"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/Modal/Modal";
import ConfirmDeleteButton from "../ConfirmDeleteButton";
import FilmForm from "./FilmForm";
import { deleteFilmAction, launchPremiereAction, stopPremiereAction, updateFilmAction } from "./actions";
import { getPremiereStatus } from "@/lib/premiere";
import type { Artist, Film } from "@/data/types";
import styles from "../shared.module.css";

export default function FilmRowActions({
  film,
  artists,
  categories,
}: {
  film: Film;
  artists: Artist[];
  categories: string[];
}) {
  const [open, setOpen] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);
  const [isPending, startTransition] = useTransition();
  const premiereNotStarted = !!film.premiereAt && new Date(film.premiereAt).getTime() > Date.now();
  const premiereLive = getPremiereStatus(film) === "preview";

  return (
    <div className={styles.rowActions}>
      <button type="button" className={styles.editLink} onClick={() => setOpen(true)}>
        Modifier
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
      <Modal open={confirmStop} onClose={() => setConfirmStop(false)} title="Arrêter l'avant-première">
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
      <Modal open={open} onClose={() => setOpen(false)} title={`Modifier ${film.title}`}>
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
      <ConfirmDeleteButton action={deleteFilmAction.bind(null, film.id)} itemName={film.title} />
    </div>
  );
}
