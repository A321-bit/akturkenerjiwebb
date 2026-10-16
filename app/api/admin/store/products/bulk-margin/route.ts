import { NextResponse } from "next/server";
import { z } from "zod";
import { adminClient } from "@/lib/data";
import { revalidateSite } from "@/lib/admin-crud";
import { recomputePrices } from "@/lib/store-pricing";

// Seçili ürünlere toplu kâr marjı / üstü çizili fiyat marjı verir. Gönderilmeyen
// alan değişmez; null = ürün marjını kaldır (kategori/genel marj geçerli olur).
const pct = z.number().min(-99).max(1000).nullable();
const schema = z.object({
  ids: z.array(z.number().int()).min(1),
  margin_pct: pct.optional(),
  list_margin_pct: pct.optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  const { ids, margin_pct, list_margin_pct } = parsed.data;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (margin_pct !== undefined) patch.margin_pct = margin_pct;
  if (list_margin_pct !== undefined) patch.list_margin_pct = list_margin_pct;
  const db = adminClient();
  const { error } = await db.from("store_products").update(patch).in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const repriced = await recomputePrices(db, { ids });
  revalidateSite();
  return NextResponse.json({ ok: true, updated: ids.length, repriced });
}
