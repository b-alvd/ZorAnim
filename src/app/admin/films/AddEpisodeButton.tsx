"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/Modal/Modal";
import FilmForm from "./FilmForm";
import { createFilmAction } from "./actions";
import type { Artist, Film } from "@/data/types";
import sharedStyles from "../shared.module.css";

// Figures out sensible defaults for the next episode of an existing series:
// same season as the latest episode, next episode number after it.
function nextEpisodeDefaults(episodes: Film[]): { seasonNumber: number; episodeNumber: number } {
  const real = episodes.filter((e) => e.episodeKind !== "announcement");
  if (real.length === 0) return { seasonNumber: 1, episodeNumber: 1 };
  const sorted = [...real].sort(
    (a, b) => (a.seasonNumber ?? 0) - (b.seasonNumber ?? 0) || (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0)
  );
  const last = sorted[sorted.length - 1];
  return { seasonNumber: last.seasonNumber ?? 1, episodeNumber: (last.episodeNumber ?? 0) + 1 };
}

// Only offer the seasons this series actually has (plus the next one, to
// allow starting a new season).
function seasonOptionsFor(episodes: Film[]): string[] {
  const seasons = [
    ...new Set(episodes.filter((e) => e.episodeKind !== "announcement").map((e) => e.seasonNumber ?? 1)),
  ].sort((a, b) => a - b);
  const nextSeason = (seasons[seasons.length - 1] ?? 0) + 1;
  return [...seasons, nextSeason].map((n) => `Saison ${n}`);
}

export default function AddEpisodeButton({
  seriesTitle,
  episodes,
  artists,
  categories,
}: {
  seriesTitle: string;
  episodes: Film[];
  artists: Artist[];
  categories: string[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const sample = episodes[0];
  const { seasonNumber, episodeNumber } = nextEpisodeDefaults(episodes);
  const seasonOptions = seasonOptionsFor(episodes);

  return (
    <>
      <button
        type="button"
        className={sharedStyles.iconBtn}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        title={
          episodes.every((e) => e.episodeKind === "announcement")
            ? "Ajouter le 1er épisode (remplace la fiche d'annonce)"
            : "Ajouter un épisode"
        }
        aria-label="Ajouter un épisode"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Ajouter un épisode à « ${seriesTitle} »`} fixedHeight>
        <FilmForm
          artists={artists}
          categories={categories}
          lockedSeriesTitle={seriesTitle}
          seasonOptions={seasonOptions}
          initial={{
            title: "",
            synopsis: "",
            year: sample.year,
            durationMinutes: 0,
            rating: sample.rating,
            category: sample.category,
            artistId: sample.artistId,
            isNew: false,
            poster: "",
            videoUrl: "",
            seasonNumber,
            episodeNumber,
            episodeKind: "episode",
          }}
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
