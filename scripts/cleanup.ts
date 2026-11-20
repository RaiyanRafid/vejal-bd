import { lt } from "drizzle-orm";
import { deleteOldSalts } from "@/lib/crypto/ip";
import { db } from "@/lib/db/client";
import { ipBlocks, rateLimits } from "@/lib/db/schema";

export async function cleanup(now = new Date()): Promise<void> {
  await db.delete(rateLimits).where(lt(rateLimits.windowStart, new Date(now.getTime() - 30 * 864e5)));
  await db.delete(ipBlocks).where(lt(ipBlocks.until, now));
  await deleteOldSalts(now);
}

if (process.argv[1]?.endsWith("cleanup.ts")) {
  cleanup().then(() => process.exit(0), () => { console.error("cleanup failed"); process.exit(1); });
}
