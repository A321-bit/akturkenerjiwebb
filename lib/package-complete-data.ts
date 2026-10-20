import type { StoreProduct } from "./store";
import { getProductsBySlugs } from "./store-data";
import type { PcData, PcOption } from "./package-complete";

// "Paketi Tamamla" bölümünün gösterildiği kategoriler ve fiyat kaynağı ürünler.
export const PACKAGE_COMPLETE_CATEGORIES = new Set(["inverter-batarya-paketleri"]);

const SLUG = {
  diamond: "panel-tekli-tommatech-620-wp-diamond-plus",
  alfa: "panel-tekli-alfa-solar-625-w",
  trapez: "trapez-sandvic-cati-montaj-seti",
  kiremit: "kiremit-cati-montaj-seti",
  kenet: "kenet-cati-montaj-seti",
  zemin: "zemin-tipi-montaj-sistemi",
  red: "solar-kablo-6mm-kirmizi",
  black: "solar-kablo-6mm-siyah",
  mc4: "mc4-konnektor-seti",
};

const opts = (p?: StoreProduct): PcOption[] =>
  (p?.options ?? []).filter((o): o is { label: string; price: number } => o.price != null).map((o) => ({ label: o.label, price: o.price }));

/** Paket tipine göre varsayılan panel: off grid → Diamond, şebekeye bağlı hibrit → Alfa (paket kuralı). */
export async function packageCompleteData(product: StoreProduct): Promise<PcData | null> {
  const rows = await getProductsBySlugs(Object.values(SLUG));
  const by = (s: string) => rows.find((r) => r.slug === s);
  const panels = [
    { key: "diamond", label: "TommaTech 620 Wp Diamond Plus", watt: 620, price: by(SLUG.diamond)?.price },
    { key: "alfa", label: "Alfa Solar 625 Wp", watt: 625, price: by(SLUG.alfa)?.price },
  ].filter((p): p is { key: string; label: string; watt: number; price: number } => p.price != null);
  if (!panels.length) return null;
  const offgrid = /off grid/i.test(product.name);
  const set = (s: string, name: string) => {
    const o = opts(by(s));
    return o.length ? { name, options: o } : undefined;
  };
  const single = (s: string, name: string) => {
    const p = by(s);
    return p?.price != null ? { name, price: p.price } : undefined;
  };
  return {
    panels,
    defaultPanel: offgrid ? "diamond" : panels.some((p) => p.key === "alfa") ? "alfa" : panels[0].key,
    kiremitSet: set(SLUG.kiremit, "Kiremit çatı montaj seti"),
    kenetSet: set(SLUG.kenet, "Kenet çatı montaj seti"),
    trapezSet: set(SLUG.trapez, "Trapez/sandviç çatı montaj seti"),
    zemin: single(SLUG.zemin, "Fixus zemin tipi montaj sistemi"),
    cableRed: set(SLUG.red, "6 mm² solar kablo kırmızı"),
    cableBlack: set(SLUG.black, "6 mm² solar kablo siyah"),
    mc4: single(SLUG.mc4, "MC4 konnektör seti"),
  };
}
