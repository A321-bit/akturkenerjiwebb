import { NextResponse } from "next/server";
import { buildDailyReport, sendDailyReport } from "@/lib/daily-report";

// Admin: günlük raporun önizlemesi (GET, HTML) ve hemen gönderme (POST). /api/admin altı proxy ile korunur.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const r = await buildDailyReport();
  return new NextResponse(r.html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function POST() {
  try {
    return NextResponse.json({ ok: true, ...(await sendDailyReport()) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
