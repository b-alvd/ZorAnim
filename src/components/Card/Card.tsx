"use client";

import { useState } from "react";
import Image from "next/image";
import type { Film } from "@/data/mock";
import FilmModal from "@/components/FilmModal/FilmModal";
import styles from "./Card.module.css";

export default function Card({ film }: { film: Film }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className={styles.card} onClick={() => setOpen(true)}>
        <Image
          src={film.poster}
          alt={film.title}
          fill
          sizes="340px"
          className={styles.bg}
          unoptimized
        />
        <span className={styles.title}>{film.title}</span>
      </button>
      {open && <FilmModal film={film} onClose={() => setOpen(false)} />}
    </>
  );
}
