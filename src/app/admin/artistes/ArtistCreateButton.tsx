"use client";

import { useState, useTransition } from "react";
import Modal from "../Modal";
import ArtistForm from "./ArtistForm";
import { createArtistAction } from "./actions";
import styles from "../shared.module.css";

export default function ArtistCreateButton() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button type="button" className={styles.addBtn} onClick={() => setOpen(true)}>
        + Ajouter un artiste
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Ajouter un artiste">
        <ArtistForm
          pending={isPending}
          onSubmit={(formData) =>
            startTransition(async () => {
              await createArtistAction(formData);
              setOpen(false);
            })
          }
        />
      </Modal>
    </>
  );
}
