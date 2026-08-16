import { db } from "@/db";
import { sql } from "drizzle-orm";

async function addColumn(table: string, ddl: string) {
  try {
    await db.run(sql.raw(ddl));
    console.log(`${table}: column added`);
  } catch (e) {
    const message = e instanceof Error ? `${e.message} ${e.cause instanceof Error ? e.cause.message : ""}` : String(e);
    if (/duplicate column name/i.test(message)) {
      console.log(`${table}: column already exists, skipping`);
      return;
    }
    throw e;
  }
}

async function main() {
  await addColumn("site_settings", `ALTER TABLE site_settings ADD COLUMN patch_note_enabled integer NOT NULL DEFAULT 0`);
  await addColumn("site_settings", `ALTER TABLE site_settings ADD COLUMN patch_note_title text`);
  await addColumn("site_settings", `ALTER TABLE site_settings ADD COLUMN patch_note_message text`);
  console.log("done");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
