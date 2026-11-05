// Paket Oluştur: tedarikçi maliyet listesi (cost_items) ve paket reçeteleri (product_packages).
// Maliyetler USD ve KDV hariç saklanır; ekranda KDV dahil gösterilir. Paket bir mağaza
// ürününe bağlanınca satırları ürünün malzeme listesine (bom) yazılır, ürünün alış
// maliyeti ve satış fiyatı oradan hesaplanır.

export type CostItem = {
  id: string;
  code: string | null;
  name: string;
  grp: string | null;
  source: string | null;
  unit: string | null;
  currency: string;
  list: number | null;
  discount_pct: number | null;
  cost_usd: number | null;
  manual: boolean;
  /** Aynı ürün birden çok listede varsa seçilmeyen fiyat pasife alınır. */
  active: boolean;
  updated_at: string;
};

/** Paket satırı: birim maliyet (USD, KDV hariç) kataloğun varsayılanından farklı girilebilir. */
export type PackageLine = { itemId: string | null; name: string; qty: number; unitUsd: number | null };

export type ProductPackage = {
  id: number;
  name: string;
  product_id: number | null;
  lines: PackageLine[];
  note: string | null;
  linked_at: string | null;
  updated_at: string;
};

export const COST_ITEM_FIELDS = "id, code, name, grp, source, unit, currency, list, discount_pct, cost_usd, manual, active, updated_at";
export const PACKAGE_FIELDS = "id, name, product_id, lines, note, linked_at, updated_at";

const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

/** İstekten gelen paket satırlarını temizler (boş ad ya da sıfır adet atılır). */
export function cleanLines(raw: unknown): PackageLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((l) => {
      const x = l as Record<string, unknown>;
      const unit = toNum(x.unitUsd);
      return {
        itemId: x.itemId ? String(x.itemId) : null,
        name: String(x.name ?? "").trim().slice(0, 300),
        qty: toNum(x.qty) ?? 0,
        unitUsd: unit !== null && unit >= 0 ? Math.round(unit * 10000) / 10000 : null,
      };
    })
    .filter((l) => l.name && l.qty > 0)
    .slice(0, 200);
}

/** Ürün adındaki panel gücü ("635Wp", "640 Wp") → watt; panel değilse 0. */
export const wattOf = (name: string) => Number(name.match(/(\d{3,4})\s*Wp\b/i)?.[1] ?? 0);
