import { getSiteSettings } from "@/db/queries";
import RevealSettingsForm from "./RevealSettingsForm";
import styles from "../shared.module.css";

export default async function AdminRevealPage() {
  const settings = await getSiteSettings();

  return (
    <main>
      <div className={styles.header}>
        <h1 className={styles.title}>Compte à rebours</h1>
      </div>
      <RevealSettingsForm initialEnabled={settings.revealEnabled} initialRevealAt={settings.revealAt} />
    </main>
  );
}
