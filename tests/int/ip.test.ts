import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteOldSalts, ipHash } from "@/lib/crypto/ip";
import { db } from "@/lib/db/client";
import { ipSalts } from "@/lib/db/schema";
import { resetDb } from "./helpers";

beforeEach(resetDb);
afterEach(() => vi.restoreAllMocks());

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
  it("db failures never leak the salt or ip", async () => {
    const salt = Buffer.alloc(32, 7), ip = "203.0.113.77";
    const leaky = Object.assign(new Error(`Failed query: params: ${salt.toString("hex")},${ip}`), { params: [salt], cause: new Error(ip) });
    vi.spyOn(db, "insert").mockImplementation(() => { throw leaky; });
    const err = await ipHash(ip, new Date("2026-12-04T10:00Z")).catch((e: unknown) => e as Error);
    expect(err.message).toBe("ip salt unavailable");
    expect(err.cause).toBeUndefined();
    expect("params" in err).toBe(false);
    const dump = err.message + JSON.stringify(err, Object.getOwnPropertyNames(err));
    expect(dump).not.toContain(salt.toString("hex"));
    expect(dump).not.toContain(ip);
  });
});
