import { eq } from "drizzle-orm";
import bd from "@/lib/locations/bd.json";
import { db as defaultDb, type Db } from "./client";
import { districts, divisions, issueTypes } from "./schema";

export async function seed(db: Db = defaultDb) {
  await db.insert(issueTypes).values([
    { slug: "ghush", nameBn: "ঘুষ" },
    { slug: "vejal", nameBn: "ভেজাল" },
  ]).onConflictDoNothing();
  for (const d of bd) {
    await db.insert(divisions).values({ slug: d.slug, nameBn: d.nameBn }).onConflictDoNothing();
    const [{ id }] = await db.select({ id: divisions.id }).from(divisions).where(eq(divisions.slug, d.slug));
    await db.insert(districts)
      .values(d.districts.map((x) => ({ ...x, divisionId: id })))
      .onConflictDoNothing();
  }
}

if (process.argv[1]?.endsWith("seed.ts")) {
  seed().then(() => defaultDb.$client.end());
}
