import { NextResponse } from "next/server";
import { adsDebug, adsReport, type AdsPeriod } from "@/lib/meta-ads";

// Admin "Reklamlar" sayfası: Meta reklam hesabı raporu. /api/admin altı proxy ile korunur.
export const dynamic = "force-dynamic";

const PERIODS: AdsPeriod[] = ["last_7d", "last_14d", "last_28d", "last_90d", "this_month", "last_month"];

export async function GET(req: Request) {
  const d = new URL(req.url).searchParams.get("donem") as AdsPeriod | null;
  try {
    if (new URL(req.url).searchParams.get("debug")) return NextResponse.json(await adsDebug());
    return NextResponse.json(await adsReport(d && PERIODS.includes(d) ? d : "last_7d"));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
