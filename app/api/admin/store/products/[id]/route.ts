import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { makeItemHandlers, revalidateStore } from "@/lib/admin-crud";
import { applyUsd, getPricingSettings, recomputePrices } from "@/lib/store-pricing";
import { sanitizeCostFields } from "@/lib/store-cost";

export const { DELETE } = makeItemHandlers("store_products");

// Ürün güncelleme: USD fiyat değiştiyse TL fiyat kurla hesaplanır; maliyet ve
// kâr marjı varsa satış fiyatı maliyetten yeniden üretilir.
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = adminClient();
  const body = sanitizeCostFields(await req.json());
  delete body.id;
  if ("price_usd" in body || "list_price_usd" in body) applyUsd(body, await getPricingSettings(db));
  body.updated_at = new Date().toISOString();
  const { error } = await db.from("store_products").update(body).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await recomputePrices(db, { ids: [Number(id)] });
  const { data } = await db.from("store_products").select("*").eq("id", id).single();
  revalidateStore(data ?? undefined);
  return NextResponse.json(data);
}
