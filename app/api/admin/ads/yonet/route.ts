import { NextResponse } from "next/server";
import { z } from "zod";
import { createLeadCampaign, ensureAudiences, searchTargeting, setMetaAdSetBudget, setMetaCampaignStatus } from "@/lib/meta-ads-manage";
import { VILLA_PLAN, retargetPlan } from "@/lib/meta-ads-plan";

// Admin "Reklamlar" (Meta) yönetimi: hedefleme araması (GET ?ara=konum|ilgi&q=…),
// kitle kurulumu, kampanya durum ve bütçe (POST). /api/admin altı proxy ile korunur.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const kind = q.get("ara");
  if ((kind !== "konum" && kind !== "ilgi") || !q.get("q")) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  try {
    return NextResponse.json(await searchTargeting(kind, q.get("q")!));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("kitleler") }),
  z.object({ action: z.literal("kampanya-kur"), plan: z.enum(["villa", "yeniden"]) }),
  z.object({ action: z.literal("durum"), campaignId: z.string(), status: z.enum(["ACTIVE", "PAUSED"]) }),
  z.object({ action: z.literal("butce"), adSetId: z.string(), amount: z.number() }),
]);

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  const d = parsed.data;
  try {
    if (d.action === "kitleler") return NextResponse.json(await ensureAudiences());
    // Plandan anlık form kampanyası (DURDURULMUŞ kurulur).
    if (d.action === "kampanya-kur") return NextResponse.json(await createLeadCampaign(d.plan === "villa" ? VILLA_PLAN : retargetPlan(await ensureAudiences())));
    if (d.action === "durum") await setMetaCampaignStatus(d.campaignId, d.status);
    else await setMetaAdSetBudget(d.adSetId, d.amount);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
