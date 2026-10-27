import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { makeItemHandlers, revalidateStoreCategory } from "@/lib/admin-crud";
import { recomputePrices } from "@/lib/store-pricing";
import { sanitizeCostFields } from "@/lib/store-cost";
import { requireAdmin } from "@/lib/admin-guard";

export const { DELETE } = makeItemHandlers("store_categories");

// Kategori güncelleme: kategori kâr marjı değişirse o kategorideki maliyetli ürünlerin fiyatı yeniden hesaplanır.
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const db = adminClient();
  const raw = await req.json();
  const marginChanged = "margin_pct" in raw || "list_margin_pct" in raw;
  const body = { ...raw };
  for (const k of ["margin_pct", "list_margin_pct"]) if (k in raw) body[k] = sanitizeCostFields({ [k]: raw[k] })[k];
  delete body.id;
  body.updated_at = new Date().toISOString();
  const { data, error } = await db.from("store_categories").update(body).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const repriced = marginChanged ? await recomputePrices(db, { category: data.slug }) : 0;
  revalidateStoreCategory(data.slug);
  return NextResponse.json({ ...data, repriced });
}
