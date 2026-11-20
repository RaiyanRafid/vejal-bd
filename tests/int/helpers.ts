import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { seed } from "@/lib/db/seed";

export async function resetDb(): Promise<void> {
  const { rows } = await db.execute<{ t: string }>(
    sql`select quote_ident(tablename) as t from pg_tables where schemaname = current_schema() and tablename not like '\_\_%'`,
  );
  if (rows.length) await db.execute(sql.raw(`truncate ${rows.map((r) => r.t).join(", ")} restart identity cascade`));
  await seed(db);
}
