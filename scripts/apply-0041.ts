import { db } from "@/db";
import { sql } from "drizzle-orm";

// Play counter of each trailer, kept apart from the content's own views.
async function main() {
  try {
    await db.run(sql.raw(`ALTER TABLE trailers ADD COLUMN views integer DEFAULT 0 NOT NULL`));
    console.log("trailers.views: column added");
  } catch (e) {
    const message = e instanceof Error ? `${e.message} ${e.cause instanceof Error ? e.cause.message : ""}` : String(e);
    if (!/duplicate column name/i.test(message)) throw e;
    console.log("trailers.views: column already exists, skipping");
  }
  console.log("done");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
