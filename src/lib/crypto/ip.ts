import { createHmac, randomBytes } from "node:crypto";
import { eq, lt } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { ipSalts } from "@/lib/db/schema";

const dayOf = (now: Date) => now.toISOString().slice(0, 10);

async function saltFor(day: string): Promise<Buffer> {
  // Drizzle errors carry query params (the salt); never let them escape.
  try {
    // Race-safe across processes: first insert wins, everyone reads the winner.
    await db.insert(ipSalts).values({ day, salt: randomBytes(32) }).onConflictDoNothing({ target: ipSalts.day });
    const [row] = await db.select().from(ipSalts).where(eq(ipSalts.day, day));
    return row.salt;
  } catch {
    throw new Error("ip salt unavailable");
  }
}

export async function ipHash(ip: string, now = new Date()): Promise<string> {
  return createHmac("sha256", await saltFor(dayOf(now))).update(ip).digest("hex");
}

export async function deleteOldSalts(now = new Date()): Promise<void> {
  await db.delete(ipSalts).where(lt(ipSalts.day, dayOf(now)));
}
