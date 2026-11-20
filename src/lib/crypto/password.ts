import argon2 from "argon2";
import { env } from "@/lib/env";

const opts = () => ({ memoryCost: 19456, timeCost: 2, secret: Buffer.from(env.PASSWORD_PEPPER_V1) });

export const hashPassword = (pw: string): Promise<string> => argon2.hash(pw, { type: argon2.argon2id, ...opts() });

export async function verifyPassword(hash: string, pw: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, pw, { secret: opts().secret });
  } catch {
    return false; // malformed hash
  }
}
