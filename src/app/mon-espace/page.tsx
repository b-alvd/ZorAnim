import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCategories, getFilmEngagement, getFilmsByArtist, getFilmsByStudio, getUserIdentities } from "@/db/queries";
import { mergeCategories } from "@/lib/categories";
import IdentitySection from "./IdentitySection";
import styles from "./mon-espace.module.css";

export default async function MonEspacePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const [identities, existingCategories] = await Promise.all([getUserIdentities(user.id), getCategories()]);
  const categories = mergeCategories(existingCategories);

  if (identities.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Espace créateur</h1>
        </div>
        <p className={styles.empty}>
          Tu dois être artiste ou membre d&apos;un studio pour accéder à ton espace créateur.{" "}
          <Link href="/devenir-artiste" className={styles.link}>
            Devenir artiste
          </Link>
          .
        </p>
      </main>
    );
  }

  const sections = await Promise.all(
    identities.map(async (identity) => {
      const films = identity.isStudio ? await getFilmsByStudio(identity.id) : await getFilmsByArtist(identity.id);
      const engagement = await getFilmEngagement(films.map((f) => f.id));
      return { identity, films, engagement: Object.fromEntries(engagement) };
    })
  );

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Espace créateur</h1>
        <p className={styles.subtitle}>Gère tes films et tes profils artiste/studio.</p>
      </div>
      {sections.map(({ identity, films, engagement }) => (
        <IdentitySection
          key={identity.id}
          identity={identity}
          identities={identities}
          films={films}
          engagement={engagement}
          categories={categories}
        />
      ))}
    </main>
  );
}
