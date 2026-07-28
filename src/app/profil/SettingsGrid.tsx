import SettingsCard from "@/components/SettingsCard/SettingsCard";
import MyRequestsCard from "@/components/SettingsCard/MyRequestsCard";
import NameForm from "./NameForm";
import EmailForm from "./EmailForm";
import PasswordForm from "./PasswordForm";
import DeleteAccountForm from "./DeleteAccountForm";
import type { FilmSubmission, ArtistSubmission } from "@/db/queries";
import styles from "./profil.module.css";

const icons = {
  name: (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  ),
  password: (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  ),
  danger: (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 3.9 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    </svg>
  ),
  requests: (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16v12H8l-4 4z" />
    </svg>
  ),
};

export default function SettingsGrid({
  name,
  email,
  nameChangedAt,
  filmSubmissions,
  artistSubmissions,
}: {
  name: string;
  email: string;
  nameChangedAt: string | null;
  filmSubmissions: FilmSubmission[];
  artistSubmissions: ArtistSubmission[];
}) {
  return (
    <div className={styles.grid}>
      <SettingsCard title="Pseudo" icon={icons.name}>
        <NameForm initialName={name} nameChangedAt={nameChangedAt} />
      </SettingsCard>
      <SettingsCard title="Email" icon={icons.email}>
        <EmailForm initialEmail={email} />
      </SettingsCard>
      <SettingsCard title="Mot de passe" icon={icons.password}>
        <PasswordForm />
      </SettingsCard>
      <SettingsCard title="Mes demandes en cours" icon={icons.requests} span2>
        <MyRequestsCard filmSubmissions={filmSubmissions} artistSubmissions={artistSubmissions} />
      </SettingsCard>
      <SettingsCard title="Zone de danger" icon={icons.danger} danger>
        <DeleteAccountForm />
      </SettingsCard>
    </div>
  );
}
