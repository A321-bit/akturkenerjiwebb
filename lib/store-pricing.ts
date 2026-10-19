import type { SupabaseClient } from "@supabase/supabase-js";

// Mağaza fiyatları USD tutulur; TL fiyat Mağaza Ayarları'ndaki kurla hesaplanıp
// ürün satırına yazılır (fiyat geçmişi kur değişimlerini de kaydetsin diye).
//
// Maliyetten fiyat: Üründe alış maliyeti (cost_usd, KDV hariç) ve geçerli bir
// kâr marjı varsa satış fiyatı otomatik hesaplanır:
//   satış USD = alış × (1 + KDV) × (1 + kâr %)
// Kâr marjı önceliği: ürün → kategori → genel (Mağaza Ayarları). Hiçbiri
// girilmemişse ürünün elle girilen USD fiyatı kullanılır. Üstü çizili fiyat da
// aynı şekilde "liste marjı"ndan hesaplanır.

/** Ürün seçeneği (veritabanı): alış (KDV hariç) ya da elle satış USD'si girilir, TL fiyatlar hesaplanır. */
export type ProductOption = {
  label: string;
  cost_usd?: number | null;
  price_usd?: number | null;
  list_price_usd?: number | null;
  sale_usd?: number | null;
  price?: number | null;
  list_price?: number | null;
};

export type PricingSettings = {
  rate: number | null;
  round: number;
  vatPct: number;
  defaultMargin: number | null;
  defaultListMargin: number | null;
};

const num = (v: unknown): number | null => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));

export async function getPricingSettings(db: SupabaseClient): Promise<PricingSettings> {
  const { data } = await db.from("store_settings").select("*").eq("id", 1).single();
  const rate = num(data?.usd_rate);
  return {
    rate: rate && rate > 0 ? rate : null,
    round: Math.max(1, Number(data?.price_round) || 1),
    vatPct: num(data?.vat_pct) ?? 20,
    defaultMargin: num(data?.default_margin_pct),
    defaultListMargin: num(data?.default_list_margin_pct),
  };
}

export function usdToTl(usd: number, s: PricingSettings): number | null {
  if (!s.rate) return null;
  const tl = usd * s.rate;
  return Math.max(s.round, Math.round(tl / s.round) * s.round);
}

export function effectiveMargin(productMargin: unknown, categoryMargin: unknown, s: PricingSettings): number | null {
  return num(productMargin) ?? num(categoryMargin) ?? s.defaultMargin;
}

export function effectiveListMargin(productMargin: unknown, categoryMargin: unknown, s: PricingSettings): number | null {
  return num(productMargin) ?? num(categoryMargin) ?? s.defaultListMargin;
}

/** Alış maliyeti (KDV hariç) ve kâr marjından KDV dahil satış fiyatı (USD). */
export function priceFromCost(costUsd: number, marginPct: number, s: PricingSettings): number {
  return Math.round(costUsd * (1 + s.vatPct / 100) * (1 + marginPct / 100) * 100) / 100;
}

/** Gövdede USD fiyat varsa TL karşılığını hesaplayıp ekler (gövdeyi değiştirir). */
export function applyUsd(body: Record<string, unknown>, s: PricingSettings) {
  for (const [usdKey, tlKey] of [
    ["price_usd", "price"],
    ["list_price_usd", "list_price"],
  ] as const) {
    if (!(usdKey in body)) continue;
    const n = num(body[usdKey]);
    if (n === null || n <= 0) {
      body[usdKey] = null;
      continue;
    }
    body[usdKey] = n;
    const tl = usdToTl(n, s);
    if (tl != null) body[tlKey] = tl;
  }
  return body;
}

/**
 * Fiyatları yeniden hesaplar: maliyeti ve marjı olan ürünlerde satış USD'yi
 * maliyetten üretir, ardından USD fiyatı olan bütün ürünlerin TL fiyatını kurla
 * günceller. `ids` ya da `category` verilirse yalnızca o ürünler işlenir.
 */
export async function recomputePrices(db: SupabaseClient, filter: { ids?: number[]; category?: string } = {}): Promise<number> {
  const s = await getPricingSettings(db);
  let q = db.from("store_products").select("id, category, price, list_price, price_usd, list_price_usd, cost_usd, margin_pct, list_margin_pct, options");
  if (filter.ids?.length) q = q.in("id", filter.ids);
  if (filter.category) q = q.eq("category", filter.category);
  const [{ data: products }, { data: cats }] = await Promise.all([q, db.from("store_categories").select("slug, margin_pct, list_margin_pct")]);
  const catMargin = new Map((cats ?? []).map((c) => [c.slug, c.margin_pct]));
  const catListMargin = new Map((cats ?? []).map((c) => [c.slug, c.list_margin_pct]));

  let n = 0;
  for (const p of products ?? []) {
    const patch: Record<string, number | null> = {};
    const cost = num(p.cost_usd);
    const margin = effectiveMargin(p.margin_pct, catMargin.get(p.category), s);
    const listMargin = effectiveListMargin(p.list_margin_pct, catListMargin.get(p.category), s);
    let priceUsd = num(p.price_usd);
    let listUsd = num(p.list_price_usd);
    if (cost !== null && cost > 0 && margin !== null) {
      priceUsd = priceFromCost(cost, margin, s);
      if (priceUsd !== num(p.price_usd)) patch.price_usd = priceUsd;
    }
    if (cost !== null && cost > 0 && listMargin !== null) {
      listUsd = priceFromCost(cost, listMargin, s);
      if (listUsd !== num(p.list_price_usd)) patch.list_price_usd = listUsd;
    }
    // Seçenekli ürün: her seçeneğin fiyatı kendi alışından (marjla) ya da elle girilen
    // USD fiyatından hesaplanır; ürünün fiyatı en ucuz seçeneğinkidir.
    let optionsOut: ProductOption[] | null = null;
    const opts = Array.isArray(p.options) ? (p.options as ProductOption[]) : [];
    if (opts.length) {
      optionsOut = opts.map((o) => {
        const oc = num(o.cost_usd);
        const sale = oc !== null && oc > 0 && margin !== null ? priceFromCost(oc, margin, s) : num(o.price_usd);
        const list = oc !== null && oc > 0 && listMargin !== null ? priceFromCost(oc, listMargin, s) : num(o.list_price_usd);
        return {
          ...o,
          sale_usd: sale,
          price: sale !== null && s.rate ? usdToTl(sale, s) : num(o.price),
          list_price: list !== null && s.rate ? usdToTl(list, s) : num(o.list_price),
        };
      });
      const cheapest = optionsOut.filter((o) => o.price != null).sort((a, b) => Number(a.price) - Number(b.price))[0];
      priceUsd = cheapest?.sale_usd ?? null;
      patch.price_usd = priceUsd;
      patch.price = cheapest?.price ?? null;
      patch.list_price_usd = null;
      patch.list_price = cheapest?.list_price ?? null;
    } else if (s.rate) {
      if (priceUsd !== null) patch.price = usdToTl(priceUsd, s);
      if (listUsd !== null) patch.list_price = usdToTl(listUsd, s);
    }
    const optionsChanged = optionsOut !== null && JSON.stringify(optionsOut) !== JSON.stringify(p.options);
    const changed = optionsChanged || Object.entries(patch).some(([k, v]) => num((p as Record<string, unknown>)[k]) !== v);
    if (!changed) continue;
    const r = await db.from("store_products").update(optionsOut ? { ...patch, options: optionsOut } : patch).eq("id", p.id);
    if (!r.error) n++;
  }
  return n;
}

/** Kur, KDV, yuvarlama ya da genel marjlar değişince bütün ürünler. */
export const recomputeAllPrices = (db: SupabaseClient) => recomputePrices(db);
