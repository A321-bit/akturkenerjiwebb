import { NextResponse } from "next/server";
import { z } from "zod";
import {
  addKeywords,
  addNegatives,
  listAds,
  listAssets,
  listKeywords,
  listNegatives,
  listSearchTerms,
  removeKeyword,
  removeNegative,
  setAdStatus,
  setKeywordStatus,
} from "@/lib/google-ads-manage";

// Admin "Google Ads": listeler (GET ?liste=…&gun=N) ve işlemler (POST). /api/admin altı proxy ile korunur.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const days = Math.min(365, Math.max(1, Number(q.get("gun")) || 30));
  try {
    switch (q.get("liste")) {
      case "kelimeler":
        return NextResponse.json(await listKeywords(days));
      case "terimler":
        return NextResponse.json(await listSearchTerms(days));
      case "negatifler":
        return NextResponse.json(await listNegatives());
      case "reklamlar":
        return NextResponse.json(await listAds());
      case "uzantilar":
        return NextResponse.json(await listAssets());
      default:
        return NextResponse.json({ error: "Geçersiz liste." }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

const match = z.enum(["EXACT", "PHRASE", "BROAD"]);
const status = z.enum(["ENABLED", "PAUSED"]);
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("kelime-durum"), id: z.string(), status }),
  z.object({ action: z.literal("kelime-sil"), id: z.string() }),
  z.object({ action: z.literal("kelime-ekle"), adGroupId: z.string(), texts: z.array(z.string()).min(1).max(200), match }),
  z.object({ action: z.literal("negatif-ekle"), campaignIds: z.array(z.string()).min(1), texts: z.array(z.string()).min(1).max(500), match }),
  z.object({ action: z.literal("negatif-sil"), id: z.string() }),
  z.object({ action: z.literal("reklam-durum"), id: z.string(), status }),
]);

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  const d = parsed.data;
  try {
    if (d.action === "kelime-durum") await setKeywordStatus(d.id, d.status);
    else if (d.action === "kelime-sil") await removeKeyword(d.id);
    else if (d.action === "kelime-ekle") await addKeywords(d.adGroupId, d.texts, d.match);
    else if (d.action === "negatif-ekle") await addNegatives(d.campaignIds, d.texts, d.match);
    else if (d.action === "negatif-sil") await removeNegative(d.id);
    else await setAdStatus(d.id, d.status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
