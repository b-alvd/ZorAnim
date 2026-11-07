import { db } from "@/db";
import { sql } from "drizzle-orm";

// Banner image shown at the top of artist and studio pages (optional).
// Kept out of the Drizzle schema and read with raw SQL, so the site keeps
// working if the code is deployed before this migration runs.
async function addColumn(table: "artists" | "studios") {
  try {
    await db.run(sql.raw(`ALTER TABLE ${table} ADD COLUMN banner text`));
    console.log(`${table}.banner: column added`);
  } catch (e) {
    const message = e instanceof Error ? `${e.message} ${e.cause instanceof Error ? e.cause.message : ""}` : String(e);
    if (!/duplicate column name/i.test(message)) throw e;
    console.log(`${table}.banner: column already exists, skipping`);
  }
}

async function main() {
  await addColumn("artists");
  await addColumn("studios");
  console.log("done");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
