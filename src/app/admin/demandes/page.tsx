import { getAdminRequests, getArtists, getCategories, getStudios } from "@/db/queries";
import { mergeCategories } from "@/lib/categories";
import RequestsManager from "./RequestsManager";
import styles from "../shared.module.css";

async function loadRequests() {
  const [requests, artists, studios, existingCategories] = await Promise.all([
    getAdminRequests(),
    getArtists(),
    getStudios(),
    getCategories(),
  ]);
  return {
    ...requests,
    identities: [...artists, ...studios],
    categories: mergeCategories(existingCategories),
    // Reference time for relative dates, so server and browser render alike.
    loadedAt: Date.now(),
  };
}

export default async function AdminDemandesPage() {
  const { films, artists, appeals, identities, categories, loadedAt } = await loadRequests();

  return (
    <main>
      <div className={styles.header}>
        <h1 className={styles.title}>Demandes</h1>
      </div>
      <RequestsManager
        films={films}
        artists={artists}
        appeals={appeals}
        identities={identities}
        categories={categories}
        now={loadedAt}
      />
    </main>
  );
}
