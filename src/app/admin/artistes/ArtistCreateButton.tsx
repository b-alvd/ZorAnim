"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/Modal/Modal";
import ArtistForm, { type AccountOption } from "./ArtistForm";
import { createArtistAction } from "./actions";
import styles from "../shared.module.css";

export default function ArtistCreateButton({ accounts }: { accounts: AccountOption[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        className={styles.addBtn}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        + Ajouter un artiste
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Ajouter un artiste">
        <ArtistForm
          accounts={accounts}
          pending={isPending}
          error={error}
          onSubmit={(formData) =>
            startTransition(async () => {
              const result = await createArtistAction(formData);
              if (result.error) setError(result.error);
              else setOpen(false);
            })
          }
        />
      </Modal>
    </>
  );
}
