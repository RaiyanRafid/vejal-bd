import { beforeEach, describe, expect, it } from "vitest";
import { solveChallenge } from "altcha-lib";
import { deriveKey } from "altcha-lib/algorithms/sha";
import { cleanup } from "../../scripts/cleanup";
import { createChallenge, verifyCaptcha } from "@/lib/captcha";
import { db } from "@/lib/db/client";
import { ipBlocks, ipSalts, rateLimits } from "@/lib/db/schema";
import { checkRateLimit } from "@/lib/ratelimit";
import { resetDb } from "./helpers";

Object.assign(process.env, { ALTCHA_HMAC_KEY: "k".repeat(40) });
beforeEach(resetDb);

async function solvedPayload(): Promise<string> {
  const challenge = await createChallenge();
  const solution = await solveChallenge({ challenge, deriveKey });
  return Buffer.from(JSON.stringify({ challenge, solution })).toString("base64");
}

describe("checkRateLimit", () => {
  it("allows 5 reports per hour then blocks", async () => {
    for (let i = 0; i < 5; i++) expect((await checkRateLimit("k", "report")).ok).toBe(true);
    const r = await checkRateLimit("k", "report");
    expect(r.ok).toBe(false);
    expect(r.retryAfterSec).toBeGreaterThan(0);
    expect(r.retryAfterSec).toBeLessThanOrEqual(3600);
  });
  it("uses fixed windows aligned to the window length", async () => {
    const t = new Date("2026-12-01T10:59:00Z");
    for (let i = 0; i < 5; i++) await checkRateLimit("k", "report", t);
    const r = await checkRateLimit("k", "report", t);
    expect(r).toEqual({ ok: false, retryAfterSec: 60 });
    expect((await checkRateLimit("k", "report", new Date("2026-12-01T11:00:00Z"))).ok).toBe(true);
  });
  it("10 concurrent calls with max 5 yield exactly 5 ok", async () => {
    const rs = await Promise.all(Array.from({ length: 10 }, () => checkRateLimit("c", "report")));
    expect(rs.filter((r) => r.ok)).toHaveLength(5);
  });
  it("blocked ip hash is refused without counting", async () => {
    const now = new Date("2026-12-01T10:00:00Z");
    await db.insert(ipBlocks).values({ ipHash: "bad", until: new Date("2026-12-01T10:10:00Z") });
    expect(await checkRateLimit("bad", "track", now)).toEqual({ ok: false, retryAfterSec: 600 });
    expect(await db.$count(rateLimits)).toBe(0);
    expect((await checkRateLimit("bad", "track", new Date("2026-12-01T10:10:01Z"))).ok).toBe(true);
  });
});

describe("cleanup", () => {
  it("removes old rate limits, expired blocks and old salts", async () => {
    const now = new Date("2026-12-31T12:00:00Z");
    const old = new Date(now.getTime() - 31 * 864e5), recent = new Date(now.getTime() - 864e5);
    await db.insert(rateLimits).values([
      { key: "a", action: "report", windowStart: old, count: 1 },
      { key: "b", action: "report", windowStart: recent, count: 1 },
    ]);
    await db.insert(ipBlocks).values([
      { ipHash: "x", until: new Date(now.getTime() - 1000) },
      { ipHash: "y", until: new Date(now.getTime() + 1000) },
    ]);
    await db.insert(ipSalts).values({ day: "2026-12-01", salt: Buffer.alloc(32) });
    await cleanup(now);
    expect((await db.select().from(rateLimits)).map((r) => r.key)).toEqual(["b"]);
    expect((await db.select().from(ipBlocks)).map((r) => r.ipHash)).toEqual(["y"]);
    expect(await db.$count(ipSalts)).toBe(0);
  });
});

describe("captcha", () => {
  it("verifies once; replay is rejected", async () => {
    const p = await solvedPayload();
    expect(await verifyCaptcha(p)).toBe(true);
    expect(await verifyCaptcha(p)).toBe(false);
  });
  it("re-encoded or altered copies of a used payload are rejected", async () => {
    const p = await solvedPayload();
    const obj = JSON.parse(Buffer.from(p, "base64").toString());
    const enc = (o: unknown, sp?: number) => Buffer.from(JSON.stringify(o, null, sp)).toString("base64");
    expect(await verifyCaptcha(p)).toBe(true);
    expect(await verifyCaptcha(enc(obj, 2))).toBe(false);
    expect(await verifyCaptcha(enc({ solution: obj.solution, challenge: obj.challenge }))).toBe(false);
    expect(await verifyCaptcha(enc({ ...obj, solution: { ...obj.solution, time: (obj.solution.time ?? 0) + 1 } }))).toBe(false);
    expect(await verifyCaptcha(p + "==")).toBe(false);
  });
  it("rejects garbage, tampered and expired payloads without throwing", async () => {
    expect(await verifyCaptcha("")).toBe(false);
    expect(await verifyCaptcha("!!!")).toBe(false);
    expect(await verifyCaptcha(Buffer.from("{}").toString("base64"))).toBe(false);
    const p = JSON.parse(Buffer.from(await solvedPayload(), "base64").toString());
    p.challenge.parameters.expiresAt = 1;
    expect(await verifyCaptcha(Buffer.from(JSON.stringify(p)).toString("base64"))).toBe(false);
  });
});
