import argon2 from "argon2";
import { describe, expect, it } from "vitest";
import { CURRENT_KEY_VERSION, hmac, normaliseIdentity } from "@/lib/crypto/hmac";
import { hashPassword, verifyPassword } from "@/lib/crypto/password";
import { newTrackingCode, normaliseTrackingCode, trackingHash } from "@/lib/crypto/tracking";

// Test-only secrets; the real .env is never read. env is parsed lazily on first use.
const s = (c: string) => c.repeat(40);
Object.assign(process.env, {
  DATABASE_URL: "postgres://u:p@localhost:5432/db",
  PASSWORD_PEPPER_V1: s("a"),
  HMAC_USERNAME_KEY_V1: s("b"),
  HMAC_EMAIL_KEY_V1: s("c"),
  HMAC_TRACKING_KEY_V1: s("d"),
  TOTP_ENC_KEY: Buffer.alloc(32, 1).toString("base64"),
  ALTCHA_HMAC_KEY: s("e"),
  S3_ENDPOINT: "http://127.0.0.1:9000",
  S3_REGION: "us-east-1",
  S3_BUCKET: "b",
  S3_ACCESS_KEY: "k",
  S3_SECRET_KEY: "k",
});

describe("tracking codes", () => {
  it("normalises sloppy input", () => {
    const c = "VJ-7K2P-9QX4";
    for (const x of ["vj 7k2p9qx4", "vj-7k2p-9qx4", " VJ7K2P9QX4 ", "7k2p_9qx4"]) expect(normaliseTrackingCode(x)).toBe(c);
    expect(normaliseTrackingCode("VJ-7K2P")).toBeNull();
  });
  it("maps o/l/i and rejects u", () => {
    expect(normaliseTrackingCode("vj-o1l1-oooo")).toBe("VJ-0111-0000");
    expect(normaliseTrackingCode("vj-i1l1-0000")).toBe("VJ-1111-0000");
    expect(normaliseTrackingCode("VJ-7K2U-9QX4")).toBeNull();
    expect(normaliseTrackingCode("VJ-7K2P-9QX4-5")).toBeNull();
  });
  it("generated codes match format", () => {
    expect(newTrackingCode()).toMatch(/^VJ-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
  });
  it("hashes the canonical form and throws on invalid", () => {
    expect(trackingHash("vj 7k2p9qx4")).toBe(trackingHash("VJ-7K2P-9QX4"));
    expect(() => trackingHash("nope")).toThrow();
  });
});

describe("password", () => {
  it("verifies, rejects wrong, tolerates malformed", async () => {
    const h = await hashPassword("correct horse");
    expect(h.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword(h, "correct horse")).toBe(true);
    expect(await verifyPassword(h, "wrong")).toBe(false);
    expect(await verifyPassword("garbage", "x")).toBe(false);
  });
  it("fails for a hash made with a different pepper", async () => {
    const h = await argon2.hash("pw", { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, secret: Buffer.from(s("z")) });
    expect(await verifyPassword(h, "pw")).toBe(false);
  });
});

describe("hmac", () => {
  it("is deterministic and purpose-separated", () => {
    expect(hmac("email", "a@b.c")).toBe(hmac("email", "a@b.c"));
    expect(hmac("email", "a@b.c")).not.toBe(hmac("username", "a@b.c"));
  });
  it("rejects unknown versions without leaking keys", () => {
    expect(CURRENT_KEY_VERSION).toBe(1);
    expect(() => hmac("email", "x", 2)).toThrow(/email.*2/);
  });
  it("normaliseIdentity folds width, case and whitespace", () => {
    expect(normaliseIdentity("  ＡＬｉｃｅ ")).toBe("alice");
  });
});
