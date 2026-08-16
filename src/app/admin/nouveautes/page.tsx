import { getSiteSettings } from "@/db/queries";
import PatchNoteForm from "./PatchNoteForm";
import styles from "../shared.module.css";

export default async function AdminNouveautesPage() {
  const settings = await getSiteSettings();

  return (
    <main>
      <div className={styles.header}>
        <h1 className={styles.title}>Nouveautés</h1>
      </div>
      <PatchNoteForm
        initialEnabled={settings.patchNoteEnabled}
        initialTitle={settings.patchNoteTitle}
        initialMessage={settings.patchNoteMessage}
      />
    </main>
  );
}
