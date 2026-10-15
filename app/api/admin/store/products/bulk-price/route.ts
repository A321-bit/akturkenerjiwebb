import { NextResponse } from "next/server";
import { z } from "zod";
import { adminClient } from "@/lib/data";
import { revalidateSite } from "@/lib/admin-crud";

// Toplu fiyat güncelleme: seçili ürünlerin (ya da bir kategorinin) satış ve
// liste fiyatını yüzde olarak artırır/azaltır, istenen basamağa yuvarlar.
const schema = z.object({
  percent: z.number().min(-90).max(500),
  ids: z.array(z.number().int()).min(1),
  /** Yuvarlama basamağı (ör. 1000 → en yakın bin TL). */
  roundTo: z.number().int().min(1).max(100000).default(1000),
  /** Liste (üstü çizili) fiyat da aynı oranda değişsin mi? */
  includeList: z.boolean().default(true),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  const { percent, ids, roundTo, includeList } = parsed.data;

  const db = adminClient();
  const { data, error } = await db.from("store_products").select("id, price, list_price").in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const apply = (v: number | null) => (v == null ? null : Math.max(roundTo, Math.round((v * (1 + percent / 100)) / roundTo) * roundTo));
  let updated = 0;
  for (const p of data ?? []) {
    const patch: Record<string, unknown> = { price: apply(p.price), updated_at: new Date().toISOString() };
    if (includeList) patch.list_price = apply(p.list_price);
    const r = await db.from("store_products").update(patch).eq("id", p.id);
    if (r.error) return NextResponse.json({ error: r.error.message, updated }, { status: 500 });
    updated++;
  }
  revalidateSite();
  return NextResponse.json({ ok: true, updated });
}
