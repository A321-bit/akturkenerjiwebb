import { NextResponse } from "next/server";
import { sendDailyReport } from "@/lib/daily-report";

// Vercel Cron (vercel.json, her gün 19:30 UTC = 22:30 TR): günlük raporu e-postayla gönderir.
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const fromCron = secret
    ? req.headers.get("authorization") === `Bearer ${secret}`
    : (req.headers.get("user-agent") ?? "").startsWith("vercel-cron/");
  if (!fromCron) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, ...(await sendDailyReport()) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
