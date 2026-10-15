import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { revalidateSite } from "@/lib/admin-crud";
import { recomputeAllPrices } from "@/lib/store-pricing";

export async function GET() {
  const { data, error } = await adminClient().from("store_settings").select("*").eq("id", 1).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const db = adminClient();
  const body = await req.json();
  delete body.id;
  delete body.usd_rate_updated_at;

  const { data: before } = await db.from("store_settings").select("usd_rate, price_round").eq("id", 1).single();
  if ("usd_rate" in body) {
    const rate = Number(String(body.usd_rate ?? "").replace(",", "."));
    body.usd_rate = Number.isFinite(rate) && rate > 0 ? rate : null;
    if (Number(before?.usd_rate) !== body.usd_rate) body.usd_rate_updated_at = new Date().toISOString();
  }
  body.updated_at = new Date().toISOString();

  const { data, error } = await db.from("store_settings").update(body).eq("id", 1).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Kur ya da yuvarlama değiştiyse USD fiyatlı ürünlerin TL fiyatları güncellenir.
  let repriced = 0;
  if (Number(before?.usd_rate) !== Number(data.usd_rate) || Number(before?.price_round) !== Number(data.price_round)) {
    repriced = await recomputeAllPrices(db);
  }
  revalidateSite();
  return NextResponse.json({ ...data, repriced });
}
