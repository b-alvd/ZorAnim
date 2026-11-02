"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload/FileUpload";
import shared from "../shared.module.css";
import styles from "./films.module.css";

export function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Rounded to the minute, never 0: what the "Durée" field should show for a
// detected video length.
export function minutesFromSeconds(seconds: number): number {
  return Math.max(1, Math.round(seconds / 60));
}

// A foldable form section. Folding only hides it (display: none): its inputs
// stay mounted, so they are still submitted and validated.
export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className={styles.formSection}>
      <h3 className={styles.formSectionTitle}>
        <button type="button" className={styles.formSectionToggle} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <svg
            viewBox="0 0 24 24"
            width="12"
            height="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className={styles.formSectionChevron}
            style={{ transform: open ? "rotate(90deg)" : "none" }}
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
          {title}
        </button>
      </h3>
      <div className={styles.formSectionBody} hidden={!open}>
        {children}
      </div>
    </section>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className={styles.segmented} role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={`${styles.segment} ${value === o.value ? styles.segmentActive : ""}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// An optional block that stays folded behind a switch until it's needed.
// Turning it off calls onDisable so the parent can clear what was entered.
export function OptionalToggle({
  label,
  hint,
  defaultOn = false,
  onDisable,
  children,
}: {
  label: string;
  hint?: string;
  defaultOn?: boolean;
  onDisable?: () => void;
  children: React.ReactNode;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className={`${styles.optional} ${on ? styles.optionalOn : ""}`}>
      <label className={styles.switchRow}>
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => {
            setOn(e.target.checked);
            if (!e.target.checked) onDisable?.();
          }}
        />
        <span className={styles.switch} />
        <span className={styles.switchText}>
          <span className={styles.switchLabel}>{label}</span>
          {hint && <span className={styles.switchHint}>{hint}</span>}
        </span>
      </label>
      {on && <div className={styles.optionalBody}>{children}</div>}
    </div>
  );
}

export type ReleaseMode = "now" | "scheduled" | "premiere";

export type ReleaseValue = {
  // Chosen explicitly in the form; derived from the dates when absent.
  mode?: ReleaseMode;
  // datetime-local strings (browser local time); converted to ISO on submit.
  premiereAt: string;
  releaseAt: string;
  premiereBanner: string;
  releaseBanner: string;
  premiereAdUrl: string;
  premiereAdDurationSeconds: number | null;
};

export function releaseModeOf(value: ReleaseValue): ReleaseMode {
  return value.mode ?? (value.premiereAt ? "premiere" : value.releaseAt ? "scheduled" : "now");
}

// Whether the dates required by the chosen mode are filled in.
export function releaseComplete(value: ReleaseValue): boolean {
  const mode = releaseModeOf(value);
  if (mode === "premiere") return !!value.premiereAt;
  if (mode === "scheduled") return !!value.releaseAt;
  return true;
}

export const EMPTY_RELEASE: ReleaseValue = {
  premiereAt: "",
  releaseAt: "",
  premiereBanner: "",
  releaseBanner: "",
  premiereAdUrl: "",
  premiereAdDurationSeconds: null,
};

const RELEASE_MODES: { value: ReleaseMode; label: string }[] = [
  { value: "now", label: "Tout de suite" },
  { value: "scheduled", label: "Sortie programmée" },
  { value: "premiere", label: "Avant-première" },
];

// How and when the content becomes available. Fields are only rendered for
// the chosen mode, so a form submit never carries values of a hidden mode.
// Field names (optionally prefixed) match what readFilmInput expects.
export function ReleaseFields({
  value,
  onChange,
  namePrefix,
}: {
  value: ReleaseValue;
  onChange: (patch: Partial<ReleaseValue>) => void;
  namePrefix?: string;
}) {
  const mode = releaseModeOf(value);
  const n = (field: string) => (namePrefix ? `${namePrefix}-${field}` : field);

  const switchMode = (next: ReleaseMode) => {
    if (next === "now") onChange({ ...EMPTY_RELEASE, mode: next });
    else if (next === "scheduled") onChange({ ...EMPTY_RELEASE, mode: next, releaseAt: value.releaseAt });
    else onChange({ mode: next });
  };

  return (
    <div className={styles.release}>
      <Segmented options={RELEASE_MODES} value={mode} onChange={switchMode} />

      {mode === "now" && <p className={styles.formHint}>Disponible dès l&apos;enregistrement.</p>}

      {mode === "scheduled" && (
        <div className={shared.field}>
          <label htmlFor={n("releaseAt")}>Date de sortie</label>
          <input
            id={n("releaseAt")}
            name={n("releaseAt")}
            type="datetime-local"
            value={value.releaseAt}
            onChange={(e) => onChange({ releaseAt: e.target.value })}
            required
          />
          <span className={styles.formHint}>Masqué du catalogue jusqu&apos;à cette date.</span>
        </div>
      )}

      {mode === "premiere" && (
        <>
          <div className={shared.row2}>
            <div className={shared.field}>
              <label htmlFor={n("premiereAt")}>Début du direct</label>
              <input
                id={n("premiereAt")}
                name={n("premiereAt")}
                type="datetime-local"
                value={value.premiereAt}
                onChange={(e) => onChange({ premiereAt: e.target.value })}
                required
              />
            </div>
            <div className={shared.field}>
              <label htmlFor={n("releaseAt")}>Sortie officielle</label>
              <input
                id={n("releaseAt")}
                name={n("releaseAt")}
                type="datetime-local"
                value={value.releaseAt}
                onChange={(e) => onChange({ releaseAt: e.target.value })}
              />
            </div>
          </div>
          <span className={styles.formHint}>
            Sans sortie officielle, le contenu devient disponible juste après le direct.
          </span>
          <OptionalToggle
            label="Bannières d'accueil"
            hint="Grande bannière en haut de l'accueil pendant l'avant-première, puis après la sortie."
            defaultOn={!!value.premiereBanner || !!value.releaseBanner}
            onDisable={() => onChange({ premiereBanner: "", releaseBanner: "" })}
          >
            <div className={styles.release}>
              <div className={shared.field}>
                <label>Avant et pendant le direct</label>
                <FileUpload
                  allowUrl
                  name={n("premiereBanner")}
                  label="Choisir une image"
                  accept="image/*"
                  value={value.premiereBanner}
                  onChange={(url) => onChange({ premiereBanner: url })}
                  preview
                />
              </div>
              <div className={shared.field}>
                <label>Après le direct (facultatif, sinon la première est réutilisée)</label>
                <FileUpload
                  allowUrl
                  name={n("releaseBanner")}
                  label="Choisir une image"
                  accept="image/*"
                  value={value.releaseBanner}
                  onChange={(url) => onChange({ releaseBanner: url })}
                  preview
                />
              </div>
            </div>
          </OptionalToggle>
          <OptionalToggle
            label="Diffuser une publicité avant le direct"
            hint="Jouée pour tout le monde en même temps, juste avant l'épisode."
            defaultOn={!!value.premiereAdUrl}
            onDisable={() => onChange({ premiereAdUrl: "", premiereAdDurationSeconds: null })}
          >
            <input type="hidden" name={n("premiereAdDurationSeconds")} value={value.premiereAdDurationSeconds ?? ""} />
            <FileUpload
              allowUrl
              name={n("premiereAdUrl")}
              label="Choisir une vidéo"
              accept="video/*"
              value={value.premiereAdUrl}
              onChange={(url) => onChange({ premiereAdUrl: url, premiereAdDurationSeconds: null })}
              onDurationChange={(seconds) => onChange({ premiereAdDurationSeconds: Math.round(seconds) })}
              maxSizeMB={100}
            />
          </OptionalToggle>
        </>
      )}
    </div>
  );
}
