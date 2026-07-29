"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/Modal/Modal";
import FilmForm from "./FilmForm";
import { createFilmAction } from "./actions";
import type { Artist } from "@/data/types";
import styles from "../shared.module.css";

export default function FilmCreateButton({ artists, categories }: { artists: Artist[]; categories: string[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button type="button" className={styles.addBtn} onClick={() => setOpen(true)}>
        + Ajouter un film ou une série
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Ajouter un film ou une série">
        <FilmForm
          artists={artists}
          categories={categories}
          pending={isPending}
          onSubmit={(formData) =>
            startTransition(async () => {
              await createFilmAction(formData);
              setOpen(false);
            })
          }
        />
      </Modal>
    </>
  );
}
