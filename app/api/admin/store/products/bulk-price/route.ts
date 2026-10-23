import { NextResponse } from "next/server";
import { z } from "zod";
import { adminClient } from "@/lib/data";
import { revalidateStore } from "@/lib/admin-crud";
import { getPricingSettings, usdToTl } from "@/lib/store-pricing";

// Toplu fiyat güncelleme: seçili ürünlerin fiyatını yüzde olarak artırır/azaltır.
// USD fiyatı olan üründe USD fiyat değişir ve TL kurla yeniden hesaplanır;
// yalnızca TL fiyatı olan üründe TL fiyat değişip istenen basamağa yuvarlanır.
const schema = z.object({
  percent: z.number().min(-90).max(500),
  ids: z.array(z.number().int()).min(1),
  /** TL yuvarlama basamağı (yalnız TL fiyatlı ürünlerde). */
  roundTo: z.number().int().min(1).max(100000).default(1000),
  /** Liste (üstü çizili) fiyat da aynı oranda değişsin mi? */
  includeList: z.boolean().default(true),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  const { percent, ids, roundTo, includeList } = parsed.data;

  const db = adminClient();
  const pricing = await getPricingSettings(db);
  const { data, error } = await db
    .from("store_products")
    .select("id, price, list_price, price_usd, list_price_usd, cost_usd")
    .in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const f = 1 + percent / 100;
  const tl = (v: number | null) => (v == null ? null : Math.max(roundTo, Math.round((v * f) / roundTo) * roundTo));
  const usd = (v: number | null) => (v == null ? null : Math.round(Number(v) * f * 100) / 100);

  let updated = 0;
  let skipped = 0;
  for (const p of data ?? []) {
    // Maliyetten fiyatlanan ürünlerde fiyat kâr marjıyla değişir; toplu % burada uygulanmaz.
    if (p.cost_usd != null) {
      skipped++;
      continue;
    }
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (p.price_usd != null) {
      patch.price_usd = usd(p.price_usd);
      patch.price = usdToTl(patch.price_usd as number, pricing) ?? p.price;
    } else {
      patch.price = tl(p.price);
    }
    if (includeList) {
      if (p.list_price_usd != null) {
        patch.list_price_usd = usd(p.list_price_usd);
        patch.list_price = usdToTl(patch.list_price_usd as number, pricing) ?? p.list_price;
      } else {
        patch.list_price = tl(p.list_price);
      }
    }
    const r = await db.from("store_products").update(patch).eq("id", p.id);
    if (r.error) return NextResponse.json({ error: r.error.message, updated }, { status: 500 });
    updated++;
  }
  revalidateStore();
  return NextResponse.json({ ok: true, updated, skipped });
}
