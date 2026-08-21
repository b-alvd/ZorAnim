"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/Modal/Modal";
import ConfirmDeleteButton from "../ConfirmDeleteButton";
import FilmForm from "./FilmForm";
import { deleteFilmAction, launchPremiereAction, updateFilmAction } from "./actions";
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
  const [isPending, startTransition] = useTransition();
  const premiereNotStarted = !!film.premiereAt && new Date(film.premiereAt).getTime() > Date.now();

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
