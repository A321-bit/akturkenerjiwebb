import { NextResponse } from "next/server";
import { gaGoogleAds, gaOverview, gaRealtime } from "@/lib/ga";

// Admin "Google Analytics" sayfası: ?tip=anlik (son 30 dk) ya da özet; ?tip=googleads&gun=N (Reklamlar sayfası). /api/admin altı proxy ile korunur.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const tip = q.get("tip");
  try {
    if (tip === "googleads") return NextResponse.json(await gaGoogleAds(Math.min(365, Math.max(1, Number(q.get("gun")) || 30))));
    return NextResponse.json(tip === "anlik" ? await gaRealtime() : await gaOverview());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
