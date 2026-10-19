import { NextResponse } from "next/server";
import { daysAgo, syncGsc } from "@/lib/gsc";

// Vercel Cron (vercel.json) her sabah son 5 günün Search Console verisini
// yeniler: yeni gün eklenir, ön veriler kesinleşmiş değerlerle güncellenir.
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const fromCron = secret
    ? req.headers.get("authorization") === `Bearer ${secret}`
    : (req.headers.get("user-agent") ?? "").startsWith("vercel-cron/");
  if (!fromCron) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  try {
    const result = await syncGsc(daysAgo(5), daysAgo(0));
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
