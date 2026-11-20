import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { ipBlocks, rateLimits } from "@/lib/db/schema";

export { getClientIp } from "@/lib/clientip";

const HOUR = 3600;
const LIMITS = {
  report: { max: 5, sec: HOUR },
  track: { max: 20, sec: HOUR },
  admin_login: { max: 5, sec: 15 * 60 },
  upload: { max: 30, sec: HOUR },
} as const;

export async function checkRateLimit(
  key: string,
  action: keyof typeof LIMITS,
  now = new Date(),
): Promise<{ ok: boolean; retryAfterSec: number }> {
  const [block] = await db.select().from(ipBlocks).where(eq(ipBlocks.ipHash, key));
  if (block && block.until > now) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((block.until.getTime() - now.getTime()) / 1000)) };
  }
  const { max, sec } = LIMITS[action];
  const len = sec * 1000;
  const start = Math.floor(now.getTime() / len) * len;
  const [row] = await db
    .insert(rateLimits)
    .values({ key, action, windowStart: new Date(start), count: 1 })
    .onConflictDoUpdate({
      target: [rateLimits.key, rateLimits.action, rateLimits.windowStart],
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning({ count: rateLimits.count });
  if (row.count <= max) return { ok: true, retryAfterSec: 0 };
  return { ok: false, retryAfterSec: Math.max(1, Math.ceil((start + len - now.getTime()) / 1000)) };
}
