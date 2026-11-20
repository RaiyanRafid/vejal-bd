import { createHash } from "node:crypto";
import { createChallenge as create, randomInt, verifySolution, type Challenge, type Payload } from "altcha-lib";
import { deriveKey } from "altcha-lib/algorithms/sha";
import { db } from "@/lib/db/client";
import { rateLimits } from "@/lib/db/schema";
import { env } from "@/lib/env";

// altcha-lib v2 (required by altcha widget v3) has no maxNumber; the equivalent
// is the deterministic counter, drawn up to 100_000. SHA-256 keeps the solve fast.
export function createChallenge(): Promise<Challenge> {
  return create({
    algorithm: "SHA-256",
    cost: 1,
    counter: randomInt(10_000, 100_000),
    deriveKey,
    hmacSignatureSecret: env.ALTCHA_HMAC_KEY,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
}

export async function verifyCaptcha(payload: string): Promise<boolean> {
  try {
    const { challenge, solution } = JSON.parse(Buffer.from(payload, "base64").toString("utf8")) as Payload;
    const r = await verifySolution({ challenge, solution, deriveKey, hmacSignatureSecret: env.ALTCHA_HMAC_KEY });
    if (!r.verified) return false;
    // Single use: the first insert of this payload's hash wins. windowStart is the
    // challenge expiry so the PK is identical on replay (and cleanup drops it after 30 days).
    const exp = challenge.parameters.expiresAt;
    if (!exp) return false;
    const rows = await db
      .insert(rateLimits)
      .values({ key: createHash("sha256").update(payload).digest("hex"), action: "captcha_used", windowStart: new Date(exp * 1000), count: 1 })
      .onConflictDoNothing()
      .returning({ key: rateLimits.key });
    return rows.length === 1;
  } catch {
    return false; // never surface the payload through errors
  }
}
