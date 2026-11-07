import { db } from "@/db";
import { sql } from "drizzle-orm";

// Release asked for in a film/series submission (immediate, scheduled date,
// avant-première), as JSON. Kept out of the Drizzle schema and read with raw
// SQL, so the site keeps working if the code is deployed before this runs.
async function main() {
  try {
    await db.run(sql.raw(`ALTER TABLE film_submissions ADD COLUMN release_request text`));
    console.log("film_submissions.release_request: column added");
  } catch (e) {
    const message = e instanceof Error ? `${e.message} ${e.cause instanceof Error ? e.cause.message : ""}` : String(e);
    if (!/duplicate column name/i.test(message)) throw e;
    console.log("film_submissions.release_request: column already exists, skipping");
  }
  console.log("done");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
