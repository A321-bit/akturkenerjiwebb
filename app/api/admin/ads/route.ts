import { NextResponse } from "next/server";
import { BRANDS, adsReport, type AdsPeriod, type Brand } from "@/lib/meta-ads";

// Admin "Reklamlar" sayfası: Meta reklam hesabı raporu. /api/admin altı proxy ile korunur.
export const dynamic = "force-dynamic";

const PERIODS: AdsPeriod[] = ["last_7d", "last_14d", "last_28d", "last_90d", "this_month", "last_month"];

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const d = q.get("donem") as AdsPeriod | null;
  const m = q.get("marka") as Brand | null;
  try {
    return NextResponse.json(await adsReport(d && PERIODS.includes(d) ? d : "last_7d", m && (m === "tumu" || m in BRANDS) ? m : "akturk"));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
