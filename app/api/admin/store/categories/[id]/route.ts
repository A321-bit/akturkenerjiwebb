import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { makeItemHandlers, revalidateSite } from "@/lib/admin-crud";
import { recomputePrices } from "@/lib/store-pricing";
import { sanitizeCostFields } from "@/lib/store-cost";

export const { DELETE } = makeItemHandlers("store_categories");

// Kategori güncelleme: kategori kâr marjı değişirse o kategorideki maliyetli ürünlerin fiyatı yeniden hesaplanır.
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = adminClient();
  const raw = await req.json();
  const marginChanged = "margin_pct" in raw;
  const body = { ...raw };
  if (marginChanged) body.margin_pct = sanitizeCostFields({ margin_pct: raw.margin_pct }).margin_pct;
  delete body.id;
  body.updated_at = new Date().toISOString();
  const { data, error } = await db.from("store_categories").update(body).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const repriced = marginChanged ? await recomputePrices(db, { category: data.slug }) : 0;
  revalidateSite();
  return NextResponse.json({ ...data, repriced });
}
