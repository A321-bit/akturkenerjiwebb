import { NextResponse } from "next/server";
import { z } from "zod";
import { googleAdsReport, setCampaignStatus, setDailyBudget } from "@/lib/google-ads";

// Admin "Reklamlar" → Google Ads: rapor (GET ?gun=N) ve kampanya yönetimi (POST:
// durdur/aç, günlük bütçe). /api/admin altı proxy ile korunur.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const days = Math.min(365, Math.max(1, Number(new URL(req.url).searchParams.get("gun")) || 30));
  try {
    return NextResponse.json(await googleAdsReport(days));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("durum"), campaignId: z.string(), status: z.enum(["ENABLED", "PAUSED"]) }),
  z.object({ action: z.literal("butce"), budgetResource: z.string(), amount: z.number() }),
]);

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  try {
    const d = parsed.data;
    await (d.action === "durum" ? setCampaignStatus(d.campaignId, d.status) : setDailyBudget(d.budgetResource, d.amount));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
