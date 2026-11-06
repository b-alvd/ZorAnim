"use client";

import { useState, useTransition } from "react";
import { updateMaintenanceAction, updatePatchNoteAction } from "./actions";
import shared from "../shared.module.css";
import styles from "./settings.module.css";

// Save state shared by both panels: pending, saved, or an error message.
function useSave() {
  const [state, setState] = useState<{ saved: boolean; error: string | null }>({ saved: false, error: null });
  const [isPending, startTransition] = useTransition();
  const run = (action: () => Promise<{ error?: string }>) => {
    setState({ saved: false, error: null });
    startTransition(async () => {
      const result = await action();
      setState({ saved: !result.error, error: result.error ?? null });
    });
  };
  const touch = () => setState((s) => (s.saved || s.error ? { saved: false, error: null } : s));
  return { ...state, isPending, run, touch };
}

type Save = ReturnType<typeof useSave>;

function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <label className={styles.switchRow}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={styles.switch} />
      <span className={styles.switchText}>
        <span className={styles.switchLabel}>{label}</span>
        <span className={styles.switchHint}>{hint}</span>
      </span>
    </label>
  );
}

function PanelFooter({ dirty, save, onSave }: { dirty: boolean; save: Save; onSave: () => void }) {
  return (
    <div className={styles.footer}>
      {save.error && <span className={styles.error}>{save.error}</span>}
      {save.saved && !save.isPending && <span className={styles.saved}>Enregistré</span>}
      {!save.saved && !save.error && dirty && <span className={styles.dirty}>Modifications non enregistrées</span>}
      <button type="button" className={shared.submitBtn} onClick={onSave} disabled={save.isPending || !dirty}>
        {save.isPending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </div>
  );
}

function PanelHead({
  icon,
  title,
  desc,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  status: React.ReactNode;
}) {
  return (
    <header className={styles.panelHead}>
      <span className={styles.icon}>{icon}</span>
      <div className={styles.panelTitles}>
        <h2 className={styles.panelTitle}>{title}</h2>
        <p className={styles.panelDesc}>{desc}</p>
      </div>
      {status}
    </header>
  );
}

function MaintenancePanel({ initialEnabled }: { initialEnabled: boolean }) {
  const [saved, setSaved] = useState(initialEnabled);
  const [enabled, setEnabled] = useState(initialEnabled);
  const save = useSave();

  const onSave = () =>
    save.run(async () => {
      const result = await updateMaintenanceAction({ maintenanceEnabled: enabled });
      if (!result.error) setSaved(enabled);
      return result;
    });

  return (
    <section className={`${styles.panel} ${saved ? styles.panelAlert : ""}`}>
      <PanelHead
        icon={
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.7 6.3a1 1 0 0 0 1.4 0l1.6-1.6a5 5 0 0 1-6.6 6.6l-6.6 6.6a2 2 0 0 1-2.8-2.8l6.6-6.6a5 5 0 0 1 6.6-6.6l-1.6 1.6a1 1 0 0 0 0 1.4z" />
          </svg>
        }
        title="Maintenance"
        desc="Ferme temporairement le site aux visiteurs."
        status={
          <span className={`${styles.pill} ${saved ? styles.pillWarn : styles.pillOn}`}>
            {saved ? "Site fermé" : "Site ouvert"}
          </span>
        }
      />

      <Switch
        checked={enabled}
        onChange={(v) => {
          setEnabled(v);
          save.touch();
        }}
        label="Activer la page de maintenance"
        hint="Les admins et la page de connexion restent accessibles."
      />

      {enabled && !saved && (
        <p className={styles.warning}>Dès l&apos;enregistrement, tous les visiteurs verront la page de maintenance.</p>
      )}

      <PanelFooter dirty={enabled !== saved} save={save} onSave={onSave} />
    </section>
  );
}

function PatchNotePanel({
  initialEnabled,
  initialTitle,
  initialMessage,
}: {
  initialEnabled: boolean;
  initialTitle: string | null;
  initialMessage: string | null;
}) {
  const initial = { enabled: initialEnabled, title: initialTitle ?? "", message: initialMessage ?? "" };
  const [saved, setSaved] = useState(initial);
  const [form, setForm] = useState(initial);
  const save = useSave();

  const update = (patch: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...patch }));
    save.touch();
  };

  const dirty =
    form.enabled !== saved.enabled ||
    form.title.trim() !== saved.title.trim() ||
    form.message.trim() !== saved.message.trim();
  const live = saved.enabled && !!saved.message.trim();

  const onSave = () =>
    save.run(async () => {
      const result = await updatePatchNoteAction({
        patchNoteEnabled: form.enabled,
        patchNoteTitle: form.title.trim() || null,
        patchNoteMessage: form.message.trim() || null,
      });
      if (!result.error) setSaved(form);
      return result;
    });

  return (
    <section className={styles.panel}>
      <PanelHead
        icon={
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2 3 14h7l-1 8 11-14h-7l0-6z" />
          </svg>
        }
        title="Nouveautés"
        desc="Encart affiché sur la page d'accueil."
        status={<span className={`${styles.pill} ${live ? styles.pillOn : ""}`}>{live ? "Affiché" : "Masqué"}</span>}
      />

      <Switch
        checked={form.enabled}
        onChange={(v) => update({ enabled: v })}
        label="Afficher l'encart sur la page d'accueil"
        hint="Le texte est conservé quand l'encart est masqué."
      />

      <div className={shared.field}>
        <label htmlFor="patchTitle">Titre</label>
        <input
          id="patchTitle"
          value={form.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Ex : Nouveautés de la semaine"
        />
      </div>

      <div className={shared.field}>
        <label htmlFor="patchMessage">Message</label>
        <textarea
          id="patchMessage"
          rows={6}
          value={form.message}
          onChange={(e) => update({ message: e.target.value })}
          placeholder="Décris les dernières nouveautés du site…"
        />
      </div>

      <PanelFooter dirty={dirty} save={save} onSave={onSave} />
    </section>
  );
}

export default function SettingsPanels({
  maintenanceEnabled,
  patchNoteEnabled,
  patchNoteTitle,
  patchNoteMessage,
}: {
  maintenanceEnabled: boolean;
  patchNoteEnabled: boolean;
  patchNoteTitle: string | null;
  patchNoteMessage: string | null;
}) {
  return (
    <div className={styles.grid}>
      <MaintenancePanel initialEnabled={maintenanceEnabled} />
      <PatchNotePanel initialEnabled={patchNoteEnabled} initialTitle={patchNoteTitle} initialMessage={patchNoteMessage} />
    </div>
  );
}
