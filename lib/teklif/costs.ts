import { adminClient } from "@/lib/data";

// Maliyet yetkisi olmayan personel: maliyet alanları satış fiyatına çevrilir, kaydederken gerçek maliyet geri konur.

type L = { ad: string; birimFiyat: number; maliyetUsd?: number; marjPct?: number };
type WithCost = { costUsd?: number; marginPct?: number; price?: number };
const hide = <T extends WithCost>(x: T): T => {
  const c = { ...x };
  if (c.costUsd != null) c.costUsd = c.costUsd * (1 + (c.marginPct ?? 45) / 100);
  c.marginPct = 0;
  return c;
};

export function saleOnly<T extends object>(d: T): T {
  const p = d as T & { lines?: L[]; panel?: WithCost; inverter?: WithCost | null; battery?: WithCost | null; extraInverters?: WithCost[] };
  return {
    ...p,
    lines: (p.lines ?? []).map(({ maliyetUsd: _c, marjPct: _m, ...l }) => ({ ...l, maliyetUsd: l.birimFiyat, marjPct: 0 })),
    panel: p.panel ? hide(p.panel) : p.panel,
    inverter: p.inverter ? hide(p.inverter) : p.inverter,
    battery: p.battery ? hide(p.battery) : p.battery,
    extraInverters: p.extraInverters?.map(hide),
  };
}

/** Sunucu tarafında kalem adından gerçek maliyet; kâr raporu böyle doğru kalır. Bulunamayanın maliyeti boş kalır. */
export async function restoreCosts<T extends L>(lines: T[]): Promise<T[]> {
  const db = adminClient();
  const [{ data: prods }, { data: st }] = await Promise.all([db.from("store_products").select("name, cost_usd, bom"), db.from("quote_settings").select("data").eq("id", 1).maybeSingle()]);
  const map = new Map<string, number>();
  for (const p of prods ?? []) {
    if (p.cost_usd) {
      const count = Number(String(p.name).match(/\((\d+)\s*Adet\)/i)?.[1]) || 1;
      map.set(String(p.name).replace(/\s*—.*$/, "").replace(/\s*\(.*\)$/, ""), Number(p.cost_usd) / count);
      map.set(String(p.name), Number(p.cost_usd));
    }
    for (const b of (p.bom ?? []) as { name?: string; unit?: number }[]) if (b.name && b.unit && !map.has(b.name)) map.set(b.name, b.unit);
  }
  for (const r of ((st?.data as { rules?: { ad: string; maliyetUsd: number }[] } | null)?.rules ?? [])) map.set(r.ad, r.maliyetUsd);
  return lines.map((l) => {
    const cost = map.get(l.ad);
    return { ...l, maliyetUsd: cost, marjPct: cost ? (l.birimFiyat / cost - 1) * 100 : undefined };
  });
}
