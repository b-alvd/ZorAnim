import { db } from "@/db";
import { sql } from "drizzle-orm";

async function main() {
  await db.run(
    sql.raw(`CREATE TABLE IF NOT EXISTS series_info (
      series_title text PRIMARY KEY NOT NULL,
      trailer_url text,
      updated_at text DEFAULT (current_timestamp) NOT NULL
    )`)
  );
  console.log("series_info: ready");
  console.log("done");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
