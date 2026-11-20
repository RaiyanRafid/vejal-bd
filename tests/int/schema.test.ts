import { getTableColumns, sql } from "drizzle-orm";
import { describe, expect, it, inject } from "vitest";
import { db } from "@/lib/db/client";
import { seed } from "@/lib/db/seed";
import { districts, divisions, issueTypes, reports, upazilas, users } from "@/lib/db/schema";
import { resetDb } from "./helpers";

describe("schema", () => {
  it("seeds 8 divisions and 64 districts, no upazilas", async () => {
    await resetDb();
    expect(await db.$count(divisions)).toBe(8);
    expect(await db.$count(districts)).toBe(64);
    expect(await db.$count(issueTypes)).toBe(2);
    expect(await db.$count(upazilas)).toBe(0);
  });

  it("seed is idempotent", async () => {
    await seed(db);
    expect(await db.$count(divisions)).toBe(8);
    expect(await db.$count(districts)).toBe(64);
    expect(await db.$count(issueTypes)).toBe(2);
  });

  it("users table has no plaintext identity columns", () => {
    const cols = Object.keys(getTableColumns(users));
    for (const bad of ["email", "username", "phone", "name"]) expect(cols).not.toContain(bad);
  });

  it("enum-like columns are text with CHECK constraints, no pg enums", async () => {
    const enums = await db.execute(sql`select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
      where t.typtype = 'e' and n.nspname in ('test', 'public')`);
    expect(enums.rows).toHaveLength(0);
    await expect(db.execute(sql`insert into reports (public_id, issue_type, status, division, district, incident_month,
      description, category, tracking_hash, idempotency_key)
      values ('AAAAAAAA','ghush','bogus','dhaka','dhaka','2026-01-01','d','c','h',gen_random_uuid())`)).rejects.toThrow();
    expect(Object.keys(getTableColumns(reports))).toContain("rejectReason");
  });

  it("test migrations landed in schema test and never touched public/drizzle", async () => {
    const r = await db.execute<{ s: string }>(sql`select current_schema() as s`);
    expect(r.rows[0].s).toBe("test");
    const t = await db.execute(sql`select 1 from pg_tables where schemaname = 'test' and tablename = 'reports'`);
    expect(t.rows).toHaveLength(1);
    expect(inject("publicRelDelta" as never)).toEqual([]);
  });
});
