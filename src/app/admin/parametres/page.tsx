import { getSiteSettings } from "@/db/queries";
import SettingsPanels from "./SettingsPanels";
import shared from "../shared.module.css";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <main>
      <div className={shared.header}>
        <h1 className={shared.title}>Paramètres</h1>
      </div>
      <SettingsPanels
        maintenanceEnabled={settings.maintenanceEnabled}
        patchNoteEnabled={settings.patchNoteEnabled}
        patchNoteTitle={settings.patchNoteTitle}
        patchNoteMessage={settings.patchNoteMessage}
      />
    </main>
  );
}
