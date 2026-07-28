import { getAllStudiosWithDetails, getStudioMembers } from "@/db/queries";
import StudiosList from "./StudiosList";
import styles from "../shared.module.css";

export default async function AdminStudiosPage() {
  const studios = await getAllStudiosWithDetails();
  const withMembers = await Promise.all(
    studios.map(async (s) => ({ ...s, members: await getStudioMembers(s.id) }))
  );

  return (
    <main>
      <div className={styles.header}>
        <h1 className={styles.title}>Studios</h1>
      </div>
      <StudiosList studios={withMembers} />
    </main>
  );
}
