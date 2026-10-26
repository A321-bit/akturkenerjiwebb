import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { makeListCreateHandlers, revalidateStore } from "@/lib/admin-crud";
import { applyUsd, getPricingSettings, recomputePrices } from "@/lib/store-pricing";
import { sanitizeCostFields } from "@/lib/store-cost";
import { requireAdmin } from "@/lib/admin-guard";

export const { GET } = makeListCreateHandlers("store_products");

// Yeni ürün: USD fiyat girildiyse TL fiyat kurla, maliyet + marj varsa satış fiyatı maliyetten hesaplanır.
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const db = adminClient();
  const body = sanitizeCostFields(await req.json());
  delete body.id;
  applyUsd(body, await getPricingSettings(db));
  const { data, error } = await db.from("store_products").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await recomputePrices(db, { ids: [data.id] });
  revalidateStore(data);
  return NextResponse.json(data);
}
