import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { makeItemHandlers, revalidateSite } from "@/lib/admin-crud";
import { applyUsd, getPricingSettings } from "@/lib/store-pricing";

export const { DELETE } = makeItemHandlers("store_products");

// Ürün güncelleme: USD fiyat değiştiyse TL fiyat kurla yeniden hesaplanır.
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = adminClient();
  const body = await req.json();
  delete body.id;
  if ("price_usd" in body || "list_price_usd" in body) applyUsd(body, await getPricingSettings(db));
  body.updated_at = new Date().toISOString();
  const { data, error } = await db.from("store_products").update(body).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateSite();
  return NextResponse.json(data);
}
