// Teklif fiyatlama: mağazadaki panel/invertör/batarya maliyetleri ile kW aralığına göre
// tanımlanan kurallardan malzeme listesi üretir. Tutarlar USD ve KDV hariçtir.

import type { PaymentStep, PriceLine } from "./proposal";

export type RoofKind = "kiremit" | "trapez" | "duz" | "arazi";
export const CATI_ADI: Record<RoofKind, string> = { kiremit: "Kiremit / eğimli çatı", trapez: "Trapez / sandviç çatı", duz: "Düz beton çatı", arazi: "Arazi / zemin" };

/** birim: sabit = iş başına, kwp = kWp başına, panel = panel başına. */
export type QuoteRule = { id: string; ad: string; birim: "sabit" | "kwp" | "panel"; kwFrom: number; kwTo: number; cati: RoofKind | "hepsi"; maliyetUsd: number; marjPct: number };

export type QuoteSettings = {
  rules: QuoteRule[];
  /** Mağaza ürününde kâr oranı yoksa kullanılır. */
  defaultMarginPct: number;
  /** Sözleşme gücünün üzerine eklenecek PV payı. */
  oversizePct: number;
  /** Yıllık elektrik zammı ve uygulandığı yıl sayısı. */
  hikePct: number;
  hikeYears: number;
  paymentPlan: PaymentStep[];
};

const rule = (id: string, ad: string, birim: QuoteRule["birim"], cati: QuoteRule["cati"] = "hepsi"): QuoteRule => ({ id, ad, birim, kwFrom: 0, kwTo: 100000, cati, maliyetUsd: 0, marjPct: 45 });

export const DEFAULT_SETTINGS: QuoteSettings = {
  rules: [
    rule("kons-kiremit", "Kiremit çatı montaj sistemi", "kwp", "kiremit"),
    rule("kons-trapez", "Trapez çatı montaj sistemi", "kwp", "trapez"),
    rule("kons-duz", "Düz çatı montaj sistemi", "kwp", "duz"),
    rule("kons-arazi", "Zemin tipi montaj sistemi", "kwp", "arazi"),
    rule("kablo", "Solar DC kablo ve MC4 konnektörler", "kwp"),
    rule("ag", "AG kablo ve kablo tavaları", "kwp"),
    rule("pano", "GES panosu ve şalt malzemeleri", "sabit"),
    rule("topraklama", "Topraklama malzemeleri", "sabit"),
    rule("montaj", "Konstrüksiyon, panel ve elektrik montajı", "kwp"),
    rule("nakliye", "Nakliye", "sabit"),
    rule("vinc", "Vinç hizmeti", "sabit"),
    rule("eproje", "Elektrik projesi", "sabit"),
    rule("sproje", "Statik proje", "sabit"),
    rule("muhendislik", "Başvuru, müşavirlik ve mühendislik hizmetleri", "sabit"),
  ],
  defaultMarginPct: 45,
  oversizePct: 20,
  hikePct: 25,
  hikeYears: 10,
  paymentPlan: [
    { id: "kesif", ad: "Saha keşfi", pct: 10, sure: "1. hafta" },
    { id: "proje", ad: "Proje onayı", pct: 20, sure: "9. hafta" },
    { id: "baglanti", ad: "Sistem bağlantı anlaşması", pct: 50, sure: "10. hafta" },
    { id: "kurulum", ad: "Tedarik, kurulum ve montaj", pct: 10, sure: "16. hafta" },
    { id: "kabul", ad: "Geçici kabul", pct: 10, sure: "18. hafta" },
  ],
};

/** Sözleşme gücüne göre hedef PV gücü (kWp). */
export const targetKwp = (contractKw: number, oversizePct: number) => (contractKw > 0 ? contractKw * (1 + oversizePct / 100) : 0);

export const salePrice = (costUsd: number, marginPct: number) => costUsd * (1 + marginPct / 100);

type Item = { name: string; costUsd?: number; marginPct?: number };

/** Tasarımdaki sisteme göre kalem listesi. Maliyeti girilmemiş kurallar 0 ile gelir; ekranda uyarılır. */
export function buildQuoteLines(input: {
  kwp: number;
  panelCount: number;
  roof: RoofKind;
  panel: Item;
  inverter?: (Item & { adet: number }) | null;
  battery?: (Item & { adet: number; extras?: { name: string; adet: number; costUsd: number }[] }) | null;
  settings: QuoteSettings;
  uid: () => string;
}): PriceLine[] {
  const { kwp, panelCount, roof, panel, inverter, battery, settings, uid } = input;
  const item = (ad: string, adet: number, birim: string, costUsd: number, marjPct: number): PriceLine => ({ id: uid(), ad, adet, birim, maliyetUsd: costUsd, marjPct, birimFiyat: salePrice(costUsd, marjPct) });
  const m = (i: Item) => i.marginPct ?? settings.defaultMarginPct;
  const lines = [item(panel.name, panelCount, "adet", panel.costUsd ?? 0, m(panel))];
  if (inverter) lines.push(item(inverter.name, inverter.adet, "adet", inverter.costUsd ?? 0, m(inverter)));
  if (battery) {
    lines.push(item(battery.name, battery.adet, "adet", battery.costUsd ?? 0, m(battery)));
    for (const x of battery.extras ?? []) lines.push(item(x.name, x.adet, "adet", x.costUsd, settings.defaultMarginPct));
  }
  for (const r of settings.rules) {
    if (r.cati !== "hepsi" && r.cati !== roof) continue;
    if (kwp < r.kwFrom || kwp > r.kwTo) continue;
    const adet = r.birim === "kwp" ? Math.round(kwp * 100) / 100 : r.birim === "panel" ? panelCount : 1;
    lines.push(item(r.ad, adet, r.birim === "kwp" ? "kWp" : r.birim === "panel" ? "adet" : "iş", r.maliyetUsd, r.marjPct));
  }
  return lines;
}
