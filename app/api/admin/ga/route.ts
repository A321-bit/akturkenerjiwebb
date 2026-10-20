import { NextResponse } from "next/server";
import { gaOverview, gaRealtime } from "@/lib/ga";

// Admin "Google Analytics" sayfası: ?tip=anlik (son 30 dk) ya da özet. /api/admin altı proxy ile korunur.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const tip = new URL(req.url).searchParams.get("tip");
  try {
    return NextResponse.json(tip === "anlik" ? await gaRealtime() : await gaOverview());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
