// Data migration: an announcement fiche has no video of its own. The views it
// still carries are old plays of its former teaser video, i.e. of its
// trailer: they move to that trailer's play counter (migration 0041).
//
// Runs as a dry run by default. Add --apply to write.
//   npx tsx --env-file=.env.local scripts/migrate-0042-announcement-views-to-trailers.ts
//   npx tsx --env-file=.env.local scripts/migrate-0042-announcement-views-to-trailers.ts --apply
import { db } from "@/db";
import { sql } from "drizzle-orm";

const apply = process.argv.includes("--apply");

type Fiche = {
  id: string;
  title: string;
  series_title: string | null;
  video_url: string;
  guest_view_count: number;
  member_views: number;
};

async function main() {
  console.log(apply ? "MODE : application des changements\n" : "MODE : simulation (rien n'est écrit, ajoute --apply)\n");

  try {
    await db.all(sql`SELECT views FROM trailers LIMIT 1`);
  } catch {
    throw new Error("La colonne trailers.views n'existe pas : lance d'abord scripts/apply-0041.ts.");
  }

  const fiches = await db.all<Fiche>(sql`
    SELECT f.id, coalesce(f.series_title, f.title) AS title, f.series_title, f.video_url, f.guest_view_count,
      (SELECT count(*) FROM watch_history w WHERE w.film_id = f.id) AS member_views
    FROM films f
    WHERE f.episode_kind IN ('announcement', 'teaser')
  `);

  let touched = 0;
  for (const f of fiches) {
    const views = f.member_views + f.guest_view_count;
    if (views === 0) continue;
    const trailers = await db.all<{ id: string; title: string; video_url: string }>(
      f.series_title
        ? sql`SELECT id, title, video_url FROM trailers WHERE series_title = ${f.series_title} ORDER BY position`
        : sql`SELECT id, title, video_url FROM trailers WHERE film_id = ${f.id} ORDER BY position`
    );
    // The trailer made from the former teaser video, else the first one.
    const target = trailers.find((t) => t.video_url === f.video_url) ?? trailers[0];
    if (!target) {
      console.log(`« ${f.title} » : ${views} vue(s), mais aucune bande-annonce pour les recevoir. Ignoré.`);
      continue;
    }
    touched++;
    console.log(`« ${f.title} » : ${views} vue(s) déplacée(s) vers la bande-annonce « ${target.title} »`);
    if (apply) {
      await db.run(sql`UPDATE trailers SET views = views + ${views} WHERE id = ${target.id}`);
      await db.run(sql`UPDATE films SET guest_view_count = 0 WHERE id = ${f.id}`);
      await db.run(sql`DELETE FROM watch_history WHERE film_id = ${f.id}`);
    }
  }
  if (touched === 0) console.log("Aucune vue à déplacer.");

  console.log(apply ? "\nTerminé." : "\nSimulation terminée. Relance avec --apply pour appliquer.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
