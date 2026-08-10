"use client";

import { useState } from "react";
import Modal from "@/components/Modal/Modal";
import AdminFilmSeriesForm from "./AdminFilmSeriesForm";
import type { Artist } from "@/data/types";
import styles from "../shared.module.css";

export default function FilmCreateButton({ artists, categories }: { artists: Artist[]; categories: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={styles.addBtn} onClick={() => setOpen(true)}>
        + Ajouter un film ou une série
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Ajouter un film ou une série">
        <AdminFilmSeriesForm artists={artists} categories={categories} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
