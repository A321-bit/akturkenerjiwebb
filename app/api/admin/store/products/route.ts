import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { makeListCreateHandlers, revalidateSite } from "@/lib/admin-crud";
import { applyUsd, getPricingSettings } from "@/lib/store-pricing";

export const { GET } = makeListCreateHandlers("store_products");

// Yeni ürün: USD fiyat girildiyse TL fiyat kurla hesaplanır.
export async function POST(req: Request) {
  const db = adminClient();
  const body = await req.json();
  delete body.id;
  applyUsd(body, await getPricingSettings(db));
  const { data, error } = await db.from("store_products").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateSite();
  return NextResponse.json(data);
}
