import type { SupabaseClient } from "@supabase/supabase-js";

// Mağaza fiyatları admin panelde USD (KDV dahil) girilir; TL fiyat, Mağaza
// Ayarları'ndaki kurla hesaplanıp ürün satırına yazılır. TL fiyatın
// veritabanında tutulması fiyat geçmişinin (son 30 gün en düşük fiyat)
// kur değişimlerini de kaydetmesini sağlar.

export type PricingSettings = { rate: number | null; round: number };

export async function getPricingSettings(db: SupabaseClient): Promise<PricingSettings> {
  const { data } = await db.from("store_settings").select("usd_rate, price_round").eq("id", 1).single();
  const rate = data?.usd_rate != null ? Number(data.usd_rate) : null;
  return { rate: rate && rate > 0 ? rate : null, round: Math.max(1, Number(data?.price_round) || 1) };
}

export function usdToTl(usd: number, s: PricingSettings): number | null {
  if (!s.rate) return null;
  const tl = usd * s.rate;
  return Math.max(s.round, Math.round(tl / s.round) * s.round);
}

/** Gövdede USD fiyat varsa TL karşılığını hesaplayıp ekler (gövdeyi değiştirir). */
export function applyUsd(body: Record<string, unknown>, s: PricingSettings) {
  for (const [usdKey, tlKey] of [
    ["price_usd", "price"],
    ["list_price_usd", "list_price"],
  ] as const) {
    if (!(usdKey in body)) continue;
    const usd = body[usdKey];
    if (usd === null || usd === "") {
      body[usdKey] = null;
      continue;
    }
    const n = Number(usd);
    if (!Number.isFinite(n) || n <= 0) {
      body[usdKey] = null;
      continue;
    }
    body[usdKey] = n;
    const tl = usdToTl(n, s);
    if (tl != null) body[tlKey] = tl;
  }
  return body;
}

/** Kur ya da yuvarlama değişince USD fiyatlı tüm ürünlerin TL fiyatını günceller. */
export async function recomputeAllPrices(db: SupabaseClient): Promise<number> {
  const s = await getPricingSettings(db);
  if (!s.rate) return 0;
  const { data } = await db
    .from("store_products")
    .select("id, price, list_price, price_usd, list_price_usd")
    .or("price_usd.not.is.null,list_price_usd.not.is.null");
  let n = 0;
  for (const p of data ?? []) {
    const patch: Record<string, number | null> = {};
    if (p.price_usd != null) patch.price = usdToTl(Number(p.price_usd), s);
    if (p.list_price_usd != null) patch.list_price = usdToTl(Number(p.list_price_usd), s);
    if (patch.price === p.price && patch.list_price === p.list_price) continue;
    const r = await db.from("store_products").update(patch).eq("id", p.id);
    if (!r.error) n++;
  }
  return n;
}
