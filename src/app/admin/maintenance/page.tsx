import { getSiteSettings } from "@/db/queries";
import MaintenanceSettingsForm from "./MaintenanceSettingsForm";
import styles from "../shared.module.css";

export default async function AdminMaintenancePage() {
  const settings = await getSiteSettings();

  return (
    <main>
      <div className={styles.header}>
        <h1 className={styles.title}>Maintenance</h1>
      </div>
      <MaintenanceSettingsForm initialEnabled={settings.maintenanceEnabled} />
    </main>
  );
}
