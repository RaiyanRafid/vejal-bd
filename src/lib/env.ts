import { z } from "zod";

const secret = z.string().min(32);
const optional = z.string().optional().transform((v) => v || undefined);

// Keep keys in sync with .env.example.
const schema = z.object({
  DATABASE_URL: z.string().min(1),
  TEST_DATABASE_URL: optional,
  PASSWORD_PEPPER_V1: secret,
  HMAC_USERNAME_KEY_V1: secret,
  HMAC_EMAIL_KEY_V1: secret,
  HMAC_TRACKING_KEY_V1: secret,
  // AES-256 key: exactly 32 bytes, base64.
  TOTP_ENC_KEY: secret.refine((v) => Buffer.from(v, "base64").length === 32, "must be 32 bytes, base64"),
  ALTCHA_HMAC_KEY: secret,
  S3_ENDPOINT: z.string().min(1),
  S3_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  CLOUDFLARE_ZONE_ID: optional,
  CLOUDFLARE_PURGE_TOKEN: optional,
  CF_ACCESS_REQUIRED: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

export type Env = z.infer<typeof schema>;

export function parseEnv(raw: Record<string, string | undefined>): Env {
  const result = schema.safeParse(raw);
  if (result.success) return result.data;
  // Names and messages only; never echo values.
  const keys = Object.keys(schema.shape);
  const bad = new Map<string, string>();
  for (const i of result.error.issues) bad.set(String(i.path[0]), i.message);
  const lines = keys.filter((k) => bad.has(k)).map((k) => `  ${k}: ${bad.get(k)}`);
  throw new Error(`Invalid environment:\n${lines.join("\n")}`);
}

let cached: Env | undefined;
// Parsed lazily so importing this module never throws by itself.
export const env: Env = new Proxy({} as Env, {
  get: (_, key) => (cached ??= parseEnv(process.env))[key as keyof Env],
});
