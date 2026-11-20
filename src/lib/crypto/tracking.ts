import { randomInt } from "node:crypto";
import { hmac } from "./hmac";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const format = (s: string) => `VJ-${s.slice(0, 4)}-${s.slice(4)}`;

export function newTrackingCode(): string {
  let s = "";
  for (let i = 0; i < 8; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return format(s);
}

export function normaliseTrackingCode(input: string): string | null {
  let s = input.toUpperCase().replace(/[\s_-]/g, "");
  if (s.startsWith("VJ")) s = s.slice(2);
  s = s.replace(/O/g, "0").replace(/[IL]/g, "1");
  return /^[0-9A-HJKMNP-TV-Z]{8}$/.test(s) ? format(s) : null;
}

export function trackingHash(code: string): string {
  const c = normaliseTrackingCode(code);
  if (!c) throw new Error("Invalid tracking code");
  return hmac("tracking", c);
}
