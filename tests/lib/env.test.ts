import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/env";

const secret = (c: string) => c.repeat(40);
const validEnv = {
  DATABASE_URL: "postgres://u:p@localhost:5432/db",
  PASSWORD_PEPPER_V1: secret("a"),
  HMAC_USERNAME_KEY_V1: secret("b"),
  HMAC_EMAIL_KEY_V1: secret("c"),
  HMAC_TRACKING_KEY_V1: secret("d"),
  TOTP_ENC_KEY: Buffer.alloc(32, 1).toString("base64"),
  ALTCHA_HMAC_KEY: secret("e"),
  S3_ENDPOINT: "http://127.0.0.1:9000",
  S3_REGION: "us-east-1",
  S3_BUCKET: "vejal-images",
  S3_ACCESS_KEY: "access",
  S3_SECRET_KEY: "secretsecret",
};

describe("parseEnv", () => {
  it("accepts a valid env and defaults optional keys", () => {
    const env = parseEnv(validEnv);
    expect(env.CF_ACCESS_REQUIRED).toBe(false);
    expect(env.CLOUDFLARE_ZONE_ID).toBeUndefined();
  });
  it("throws naming every missing secret", () => {
    expect(() => parseEnv({ DATABASE_URL: "postgres://x" })).toThrow(
      /PASSWORD_PEPPER_V1[\s\S]*HMAC_EMAIL_KEY_V1/,
    );
  });
  it("rejects secrets shorter than 32 bytes", () => {
    expect(() => parseEnv({ ...validEnv, PASSWORD_PEPPER_V1: "short" })).toThrow();
  });
  it("rejects a TOTP key that is not 32 bytes", () => {
    const TOTP_ENC_KEY = Buffer.alloc(24, 1).toString("base64") + "AAAAAAAAAAAAAAAA";
    expect(() => parseEnv({ ...validEnv, TOTP_ENC_KEY })).toThrow(/TOTP_ENC_KEY/);
  });
  it("treats empty Cloudflare keys as absent", () => {
    const env = parseEnv({ ...validEnv, CLOUDFLARE_ZONE_ID: "", CLOUDFLARE_PURGE_TOKEN: "" });
    expect(env.CLOUDFLARE_PURGE_TOKEN).toBeUndefined();
  });
  it("parses CF_ACCESS_REQUIRED", () => {
    expect(parseEnv({ ...validEnv, CF_ACCESS_REQUIRED: "true" }).CF_ACCESS_REQUIRED).toBe(true);
    expect(parseEnv({ ...validEnv, CF_ACCESS_REQUIRED: "false" }).CF_ACCESS_REQUIRED).toBe(false);
  });
  it("never leaks secret values in the error", () => {
    const bad = secret("z");
    try {
      parseEnv({ ...validEnv, TOTP_ENC_KEY: bad, PASSWORD_PEPPER_V1: "short-secret-value" });
      throw new Error("should have thrown");
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toMatch(/TOTP_ENC_KEY/);
      expect(msg).not.toContain(bad);
      expect(msg).not.toContain("short-secret-value");
    }
  });
});
