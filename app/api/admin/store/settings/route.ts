import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { revalidateStore } from "@/lib/admin-crud";
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

  const { data: before } = await db.from("store_settings").select("usd_rate, price_round, vat_pct, default_margin_pct, default_list_margin_pct").eq("id", 1).single();
  for (const k of ["vat_pct", "default_margin_pct", "default_list_margin_pct"] as const) {
    if (!(k in body)) continue;
    const n = Number(String(body[k] ?? "").replace(",", "."));
    body[k] = body[k] === "" || body[k] === null || !Number.isFinite(n) ? (k === "vat_pct" ? 20 : null) : n;
  }
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
  const changed = (k: string) => String((before as Record<string, unknown> | null)?.[k] ?? "") !== String((data as Record<string, unknown>)[k] ?? "");
  if (["usd_rate", "price_round", "vat_pct", "default_margin_pct", "default_list_margin_pct"].some(changed)) {
    repriced = await recomputeAllPrices(db);
  }
  revalidateStore();
  return NextResponse.json({ ...data, repriced });
}
