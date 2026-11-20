import { createHmac } from "node:crypto";
import { env } from "@/lib/env";

export const CURRENT_KEY_VERSION = 1;
export type HmacPurpose = "username" | "email" | "tracking";

const keys: Record<HmacPurpose, () => string> = {
  username: () => env.HMAC_USERNAME_KEY_V1,
  email: () => env.HMAC_EMAIL_KEY_V1,
  tracking: () => env.HMAC_TRACKING_KEY_V1,
};

export function hmac(purpose: HmacPurpose, value: string, version = CURRENT_KEY_VERSION): string {
  if (version !== 1 || !keys[purpose]) throw new Error(`No HMAC key for purpose "${purpose}" version ${version}`);
  return createHmac("sha256", keys[purpose]()).update(value).digest("hex");
}

export const normaliseIdentity = (v: string): string => v.trim().normalize("NFKC").toLowerCase();
