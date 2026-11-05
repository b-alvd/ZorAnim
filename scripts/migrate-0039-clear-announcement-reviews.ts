// Data migration: announcements (fiches without video) can't be rated or
// commented anymore. Removes the ratings and comments already on them: they
// were given to the former teaser videos, not to the films or series.
//
// Runs as a dry run by default. Add --apply to write.
//   npx tsx --env-file=.env.local scripts/migrate-0039-clear-announcement-reviews.ts
//   npx tsx --env-file=.env.local scripts/migrate-0039-clear-announcement-reviews.ts --apply
import { db } from "@/db";
import { sql } from "drizzle-orm";

const apply = process.argv.includes("--apply");

async function main() {
  console.log(apply ? "MODE : application des changements\n" : "MODE : simulation (rien n'est écrit, ajoute --apply)\n");

  const fiches = await db.all<{ id: string; title: string; ratings: number; comments: number }>(sql`
    SELECT f.id, coalesce(f.series_title, f.title) AS title,
      (SELECT count(*) FROM film_ratings r WHERE r.film_id = f.id) AS ratings,
      (SELECT count(*) FROM comments c WHERE c.film_id = f.id) AS comments
    FROM films f
    WHERE f.episode_kind IN ('announcement', 'teaser')
  `);

  let touched = 0;
  for (const f of fiches) {
    if (f.ratings === 0 && f.comments === 0) continue;
    touched++;
    console.log(`Annonce « ${f.title} » : ${f.ratings} note(s) et ${f.comments} commentaire(s) retiré(s)`);
    if (apply) {
      await db.run(sql`DELETE FROM comment_reactions WHERE comment_id IN (SELECT id FROM comments WHERE film_id = ${f.id})`);
      await db.run(sql`DELETE FROM comments WHERE film_id = ${f.id}`);
      await db.run(sql`DELETE FROM film_ratings WHERE film_id = ${f.id}`);
    }
  }
  if (touched === 0) console.log("Aucune note ni commentaire sur des annonces.");

  console.log(apply ? "\nTerminé." : "\nSimulation terminée. Relance avec --apply pour appliquer.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
