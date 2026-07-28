"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/Modal/Modal";
import ConfirmDeleteButton from "../ConfirmDeleteButton";
import ArtistForm from "./ArtistForm";
import { deleteArtistAction, updateArtistAction } from "./actions";
import type { Artist } from "@/data/types";
import styles from "../shared.module.css";

export default function ArtistRowActions({ artist }: { artist: Artist }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className={styles.rowActions}>
      <button type="button" className={styles.editLink} onClick={() => setOpen(true)}>
        Modifier
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Modifier ${artist.name}`}>
        <ArtistForm
          initial={artist}
          pending={isPending}
          onSubmit={(formData) =>
            startTransition(async () => {
              await updateArtistAction(artist.id, formData);
              setOpen(false);
            })
          }
        />
      </Modal>
      <ConfirmDeleteButton action={deleteArtistAction.bind(null, artist.id)} itemName={artist.name} />
    </div>
  );
}
