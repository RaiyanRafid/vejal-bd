import fs from "node:fs";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { Pool } from "pg";
import type { TestProject } from "vitest/node";

// Applies drizzle migrations into schema "test" only. drizzle-kit emits "public".-qualified
// names in FK references, so we strip the qualifier and run under search_path=test with our
// own journal table, instead of drizzle's migrator (which would write to public/drizzle).
const REL_QUERY = `select n.nspname, c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public','drizzle') order by 1, 2`;

export default async function setup(project: TestProject) {
  if (fs.existsSync(".env")) process.loadEnvFile(".env");
  const url = process.env.TEST_DATABASE_URL;
  if (!url || !decodeURIComponent(url).includes("search_path=test")) {
    throw new Error("TEST_DATABASE_URL must be set and include search_path=test");
  }
  const pool = new Pool({ connectionString: url });
  try {
    const before = (await pool.query(REL_QUERY)).rows;
    await pool.query("create table if not exists test.__test_migrations (hash text primary key)");
    const done = new Set((await pool.query("select hash from test.__test_migrations")).rows.map((r) => r.hash));
    for (const m of readMigrationFiles({ migrationsFolder: "./drizzle" })) {
      if (done.has(m.hash)) continue;
      const client = await pool.connect();
      try {
        await client.query("begin");
        await client.query("set local search_path = test");
        for (const stmt of m.sql) await client.query(stmt.replaceAll('"public".', ""));
        await client.query("insert into test.__test_migrations (hash) values ($1)", [m.hash]);
        await client.query("commit");
      } catch (e) {
        await client.query("rollback");
        throw e;
      } finally {
        client.release();
      }
    }
    const after = (await pool.query(REL_QUERY)).rows;
    // Test isolation: setup must not create or remove anything in public/drizzle.
    project.provide("publicRelDelta" as never, (JSON.stringify(before) === JSON.stringify(after) ? [] : after) as never);
  } finally {
    await pool.end();
  }
}
