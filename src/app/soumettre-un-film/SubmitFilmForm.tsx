"use client";

import { useRef, useState, useTransition } from "react";
import Dropdown from "@/components/Dropdown/Dropdown";
import FileUpload from "@/components/FileUpload/FileUpload";
import { RATING_OPTIONS } from "@/lib/ratings";
import { submitFilmAction, submitSeriesAction, type EpisodeInput } from "./actions";
import type { Artist } from "@/data/types";
import styles from "../devenir-artiste/community.module.css";
import seriesStyles from "./series.module.css";

const SEASON_TYPE_OPTIONS = ["Teaser", "Saison 1", "Saison 2", "Saison 3", "Saison 4", "Saison 5", "Saison 6"];

function seasonTypeLabel(episodeKind: "episode" | "teaser", seasonNumber: number): string {
  return episodeKind === "teaser" ? "Teaser" : `Saison ${seasonNumber}`;
}

const emptyEpisode = (previous?: EpisodeInput): EpisodeInput => ({
  title: "",
  synopsis: "",
  year: previous?.year ?? new Date().getFullYear(),
  durationMinutes: 0,
  episodeKind: previous?.episodeKind ?? "teaser",
  seasonNumber: previous?.seasonNumber ?? 1,
  episodeNumber: previous ? previous.episodeNumber + 1 : 1,
  poster: "",
  videoUrl: "",
});

export default function SubmitFilmForm({
  categories,
  identities,
  initialEmail,
}: {
  categories: string[];
  identities: Artist[];
  initialEmail: string;
}) {
  const [rating, setRating] = useState(RATING_OPTIONS[0]);
  const [category, setCategory] = useState(categories[0]);
  const [artistId, setArtistId] = useState(identities[0].id);
  const [contentType, setContentType] = useState("Film");
  const [poster, setPoster] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [seriesTitle, setSeriesTitle] = useState("");
  const [episodes, setEpisodes] = useState<EpisodeInput[]>([emptyEpisode()]);
  const [sent, setSent] = useState(false);
  const [valid, setValid] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const identityNames = identities.map((a) => a.name);
  const selectedIdentityName = identities.find((a) => a.id === artistId)?.name ?? identityNames[0];

  const updateValidity = () => setValid(formRef.current?.checkValidity() ?? false);

  const updateEpisode = (index: number, patch: Partial<EpisodeInput>) => {
    setEpisodes((prev) => prev.map((ep, i) => (i === index ? { ...ep, ...patch } : ep)));
  };

  const addEpisode = () => setEpisodes((prev) => [...prev, emptyEpisode(prev[prev.length - 1])]);
  const removeEpisode = (index: number) => setEpisodes((prev) => prev.filter((_, i) => i !== index));

  const seriesReady =
    contentType === "Série" &&
    seriesTitle.trim() &&
    episodes.length > 0 &&
    episodes.every(
      (ep) =>
        ep.title.trim() &&
        ep.synopsis.trim() &&
        ep.year > 0 &&
        ep.durationMinutes > 0 &&
        (ep.episodeKind === "teaser" || ep.seasonNumber > 0) &&
        ep.episodeNumber > 0 &&
        ep.poster &&
        ep.videoUrl
    );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (contentType === "Série") {
      if (!seriesReady) return;
      startTransition(async () => {
        await submitSeriesAction({
          artistId,
          contactEmail: initialEmail,
          seriesTitle: seriesTitle.trim(),
          rating,
          category,
          episodes,
        });
        setSent(true);
      });
      return;
    }
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await submitFilmAction(formData);
      setSent(true);
    });
  };

  if (sent) {
    return (
      <div className={styles.success}>
        <p className={styles.successTitle}>Demande envoyée</p>
        <p className={styles.successText}>
          Merci pour ta soumission, on la regarde et on revient vers toi dès que possible.
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      className={styles.form}
      onSubmit={handleSubmit}
      onChange={updateValidity}
      onInput={updateValidity}
    >
      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Nom d&apos;artiste / studio</span>
          <input type="hidden" name="artistId" value={artistId} />
          <Dropdown
            options={identityNames}
            value={selectedIdentityName}
            onChange={(name) => {
              const found = identities.find((a) => a.name === name);
              if (found) setArtistId(found.id);
            }}
          />
        </div>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Email de contact</span>
          <input
            name="contactEmail"
            type="email"
            required
            readOnly
            defaultValue={initialEmail}
            className={`${styles.input} ${styles.inputMuted}`}
          />
        </label>
      </div>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>Type de contenu</span>
        <Dropdown options={["Film", "Série"]} value={contentType} onChange={setContentType} />
      </div>

      {contentType === "Film" ? (
        <>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Titre du film</span>
            <input name="title" required className={styles.input} />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Synopsis</span>
            <textarea name="synopsis" required rows={4} className={styles.textarea} />
          </label>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Année</span>
              <input name="year" type="number" required className={styles.input} />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Durée (minutes)</span>
              <input name="durationMinutes" type="number" min={1} required className={styles.input} />
            </label>
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Classification</span>
              <input type="hidden" name="rating" value={rating} />
              <Dropdown options={RATING_OPTIONS} value={rating} onChange={setRating} />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Catégorie</span>
              <input type="hidden" name="category" value={category} />
              <Dropdown options={categories} value={category} onChange={setCategory} />
            </div>
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Poster</span>
            <FileUpload name="poster" label="Choisir une image" accept="image/*" value={poster} onChange={setPoster} preview />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Vidéo</span>
            <FileUpload
              name="videoUrl"
              label="Choisir une vidéo"
              accept="video/*"
              value={videoUrl}
              onChange={setVideoUrl}
              maxSizeMB={100}
            />
          </div>
          <button type="submit" className={styles.cta} disabled={isPending || !valid || !poster || !videoUrl}>
            {isPending ? "Envoi..." : "Envoyer ma demande"}
          </button>
        </>
      ) : (
        <>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Titre de la série</span>
            <input
              value={seriesTitle}
              onChange={(e) => setSeriesTitle(e.target.value)}
              required
              className={styles.input}
            />
          </label>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Classification</span>
              <Dropdown options={RATING_OPTIONS} value={rating} onChange={setRating} />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Catégorie</span>
              <Dropdown options={categories} value={category} onChange={setCategory} />
            </div>
          </div>

          <div className={seriesStyles.episodes}>
            {episodes.map((episode, index) => (
              <div key={index} className={seriesStyles.episodeCard}>
                <div className={seriesStyles.episodeHeader}>
                  <span className={seriesStyles.episodeNumber}>
                    {episode.episodeKind === "teaser"
                      ? `Teaser ${episode.episodeNumber || "?"}`
                      : `Saison ${episode.seasonNumber || "?"} · Épisode ${episode.episodeNumber || "?"}`}
                  </span>
                  {episodes.length > 1 && (
                    <button
                      type="button"
                      className={seriesStyles.removeBtn}
                      onClick={() => removeEpisode(index)}
                    >
                      Retirer
                    </button>
                  )}
                </div>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Type</span>
                    <Dropdown
                      options={SEASON_TYPE_OPTIONS}
                      value={seasonTypeLabel(episode.episodeKind, episode.seasonNumber)}
                      onChange={(label) => {
                        if (label === "Teaser") {
                          updateEpisode(index, { episodeKind: "teaser" });
                        } else {
                          updateEpisode(index, {
                            episodeKind: "episode",
                            seasonNumber: Number(label.replace("Saison ", "")),
                          });
                        }
                      }}
                    />
                  </div>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Numéro</span>
                    <input
                      value={episode.episodeNumber || ""}
                      onChange={(e) => updateEpisode(index, { episodeNumber: Number(e.target.value) })}
                      type="number"
                      min={1}
                      required
                      className={styles.input}
                    />
                  </label>
                </div>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Titre de l&apos;épisode</span>
                  <input
                    value={episode.title}
                    onChange={(e) => updateEpisode(index, { title: e.target.value })}
                    required
                    className={styles.input}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Synopsis</span>
                  <textarea
                    value={episode.synopsis}
                    onChange={(e) => updateEpisode(index, { synopsis: e.target.value })}
                    required
                    rows={3}
                    className={styles.textarea}
                  />
                </label>
                <div className={styles.fieldRow}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Année</span>
                    <input
                      value={episode.year || ""}
                      onChange={(e) => updateEpisode(index, { year: Number(e.target.value) })}
                      type="number"
                      required
                      className={styles.input}
                    />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Durée (minutes)</span>
                    <input
                      value={episode.durationMinutes || ""}
                      onChange={(e) => updateEpisode(index, { durationMinutes: Number(e.target.value) })}
                      type="number"
                      min={1}
                      required
                      className={styles.input}
                    />
                  </label>
                </div>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Poster</span>
                  <FileUpload
                    name={`episode-${index}-poster`}
                    label="Choisir une image"
                    accept="image/*"
                    value={episode.poster}
                    onChange={(url) => updateEpisode(index, { poster: url })}
                    preview
                  />
                </div>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Vidéo</span>
                  <FileUpload
                    name={`episode-${index}-video`}
                    label="Choisir une vidéo"
                    accept="video/*"
                    value={episode.videoUrl}
                    onChange={(url) => updateEpisode(index, { videoUrl: url })}
                    maxSizeMB={100}
                  />
                </div>
              </div>
            ))}
          </div>

          <button type="button" className={seriesStyles.addEpisodeBtn} onClick={addEpisode}>
            + Ajouter un épisode
          </button>

          <button type="submit" className={styles.cta} disabled={isPending || !seriesReady}>
            {isPending ? "Envoi..." : `Envoyer ma demande (${episodes.length} épisode${episodes.length > 1 ? "s" : ""})`}
          </button>
        </>
      )}
    </form>
  );
}
