import { db } from "@/db";
import { sql } from "drizzle-orm";

// Series-level synopsis ("synopsis global"), shown on the series' fiche above
// the episodes' own synopses.
async function main() {
  await db.run(
    sql.raw(`CREATE TABLE IF NOT EXISTS series_meta (
      series_title text PRIMARY KEY NOT NULL,
      synopsis text,
      updated_at text DEFAULT (current_timestamp) NOT NULL
    )`)
  );
  console.log("series_meta: ready");
  console.log("done");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
