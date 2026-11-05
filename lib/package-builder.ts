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
  /** Paketin satış fiyatı (USD, KDV dahil); yalnız yönetim panelinde görünür. */
  sale_usd: number | null;
  linked_at: string | null;
  updated_at: string;
};

export const COST_ITEM_FIELDS = "id, code, name, grp, source, unit, currency, list, discount_pct, cost_usd, manual, active, updated_at";
export const PACKAGE_FIELDS = "id, name, product_id, lines, note, sale_usd, linked_at, updated_at";

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

/** Paket ekranındaki ürün kategorileri; kalemin tedarikçi grubundan ve adından çıkarılır (sıra önemli). */
export const ITEM_CATEGORIES = [
  "Hizmet ve kurulum",
  "Panel",
  "İnverter",
  "Batarya",
  "Montaj malzemeleri",
  "Kablo ve konnektör",
  "Pano ve aksesuar",
  "Sulama",
  "Isı pompası",
  "Şarj istasyonu",
  "Aydınlatma",
  "Rüzgar",
  "Diğer",
] as const;
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

const RULES: [ItemCategory, RegExp][] = [
  ["Hizmet ve kurulum", /^HİZMET VE KURULUM$/],
  ["Isı pompası", /ISI POMPA/],
  ["Şarj istasyonu", /ŞARJ İSTASYON|ARAÇ ŞARJ|EV CHARGE/],
  ["Aydınlatma", /AYDINLATMA|\bLED\b/],
  ["Rüzgar", /RÜZGAR|KANAT|ALTERNATÖR/],
  ["Sulama", /SULAMA|POMPA|AWES|VANA/],
  ["Batarya", /BATARYA|BATTARYA|AKÜ|LİTYUM|LFP|DEPOLAMA/],
  ["Pano ve aksesuar", /[Iİ]NVERTER AKSESUAR/],
  ["İnverter", /[Iİ]NVERT|EVİRİCİ|ŞARJ KONTROL|MPPT/],
  ["Panel", /PANEL/],
  ["Kablo ve konnektör", /KABLO|KONNEKT|MC4/],
  ["Montaj malzemeleri", /KONSTR|MONTAJ|PROFİL|TUTUCU|SONLANDIRICI|KANCA|VİDA|SOMUN|CIVATA|CİVATA|BALAST|ALTYAPI|CARPORT|EPDM|BAND/],
  ["Pano ve aksesuar", /PANO|ŞALT|SİGORTA|TOPRAKLAMA|ELEKTRİK MALZ|METER|DONGLE|AKSESUAR|OPTİMİZER|OPTIMIZER/],
];

export function categoryOf(it: Pick<CostItem, "grp" | "name">): ItemCategory {
  const g = (it.grp ?? "").toLocaleUpperCase("tr");
  const n = it.name.toLocaleUpperCase("tr");
  for (const [cat, re] of RULES) if (re.test(g)) return cat;
  for (const [cat, re] of RULES) if (re.test(n)) return cat;
  return "Diğer";
}
