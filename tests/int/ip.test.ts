import { beforeEach, describe, expect, it } from "vitest";
import { deleteOldSalts, ipHash } from "@/lib/crypto/ip";
import { db } from "@/lib/db/client";
import { ipSalts } from "@/lib/db/schema";
import { resetDb } from "./helpers";

beforeEach(resetDb);

describe("ipHash", () => {
  it("changes across days and old salts are deleted", async () => {
    const d1 = new Date("2026-12-01T10:00Z"), d2 = new Date("2026-12-02T10:00Z");
    const a = await ipHash("1.2.3.4", d1);
    expect(await ipHash("1.2.3.4", d1)).toBe(a);
    expect(await ipHash("1.2.3.4", d2)).not.toBe(a);
    await deleteOldSalts(d2);
    expect(await db.$count(ipSalts)).toBe(1);
  });
  it("concurrent first calls agree and leave one salt", async () => {
    const d = new Date("2026-12-03T10:00Z");
    const hs = await Promise.all(Array.from({ length: 8 }, () => ipHash("9.9.9.9", d)));
    expect(new Set(hs).size).toBe(1);
    expect(await db.$count(ipSalts)).toBe(1);
  });
});
