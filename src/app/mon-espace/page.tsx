import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  getBanner,
  getCategories,
  getFilmEngagement,
  getFilmsByArtist,
  getFilmsByStudio,
  getPendingSubmissionsWithRelease,
  getUserIdentities,
} from "@/db/queries";
import { mergeCategories } from "@/lib/categories";
import { isAnnouncement, isReleased } from "@/lib/series";
import CreatorSpace, { type ContentStatus, type IdentityData } from "./CreatorSpace";
import styles from "./mon-espace.module.css";

// Release status computed on the server, where reading the clock is fine.
function statusOf(film: Parameters<typeof isReleased>[0]): ContentStatus {
  if (isAnnouncement(film)) return "announcement";
  return isReleased(film) ? "online" : "soon";
}

export default async function MonEspacePage({
  searchParams,
}: {
  searchParams: Promise<{ profil?: string; proposer?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  const { profil, proposer } = await searchParams;

  const [identities, existingCategories, pending] = await Promise.all([
    getUserIdentities(user.id),
    getCategories(),
    getPendingSubmissionsWithRelease(user.id),
  ]);
  const categories = mergeCategories(existingCategories);

  if (identities.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.emptyHero}>
          <h1 className={styles.title}>Espace créateur</h1>
          <p className={styles.subtitle}>
            Publie tes animations, suis leurs vues et gère ton profil d&apos;artiste ou ton studio.
          </p>
          <Link href="/devenir-artiste" className={styles.primaryBtn}>
            Devenir artiste
          </Link>
        </div>
      </main>
    );
  }

  const data: IdentityData[] = await Promise.all(
    identities.map(async (identity) => {
      const films = identity.isStudio ? await getFilmsByStudio(identity.id) : await getFilmsByArtist(identity.id);
      const [engagement, banner] = await Promise.all([
        getFilmEngagement(films.map((f) => f.id)),
        getBanner(identity.isStudio ? "studio" : "artist", identity.id),
      ]);
      return {
        identity,
        films,
        engagement: Object.fromEntries(engagement),
        banner,
        status: Object.fromEntries(films.map((f) => [f.id, statusOf(f)])),
      };
    }),
  );

  return (
    <main className={styles.page}>
      <CreatorSpace
        data={data}
        identities={identities}
        categories={categories}
        initialIdentityId={profil ?? identities[0].id}
        pending={pending}
        openProposal={proposer === "1"}
      />
    </main>
  );
}
