import { NextResponse } from "next/server";
import { runSocial } from "@/lib/social";

// Vercel Cron (vercel.json, 10:00 ve 19:00 TR): Facebook'a 29 gün ilerisini
// zamanlar, zamanı gelen Instagram gönderisini paylaşır.
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const fromCron = secret
    ? req.headers.get("authorization") === `Bearer ${secret}`
    : (req.headers.get("user-agent") ?? "").startsWith("vercel-cron/");
  if (!fromCron) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, ...(await runSocial()) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
