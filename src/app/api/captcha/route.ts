import { connection } from "next/server";
import { createChallenge } from "@/lib/captcha";

export async function GET() {
  await connection(); // fresh random challenge per request, never prerendered
  return Response.json(await createChallenge(), { headers: { "Cache-Control": "no-store" } });
}
