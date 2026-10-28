// On grid (şebeke bağlantılı) güneş enerjisi hesaplama motoru.
// Saf fonksiyonlardan oluşur: sitedeki hesaplayıcı, sunucudaki kayıt ve admin paneli
// aynı hesabı kullanır. Fatura ve tasarruf EPDK tarifesiyle (lib/elektrik-tarife) hesaplanır;
// üretim verisi konuma özel olarak PVGIS'ten (Avrupa Komisyonu
// JRC, /api/hesaplama/pvgis) gelir; gelmezse İç Anadolu ortalaması kullanılır.

import { faturaTutari, faturadanTuketim, type AboneGrubu } from "./elektrik-tarife";

export type Tariff = AboneGrubu;
export type RoofType = "egimli" | "duz" | "trapez";
export type UsageProfile = "dengeli" | "yaz_klima" | "kis_isitma" | "gunduz_isyeri";

export type OnGridInput = {
  tariff: Tariff;
  /** Aylık ortalama fatura (TL, vergiler dahil) ya da aylık tüketim (kWh); günlük tüketim girilirse ×30 verilir. */
  monthlyBillTl?: number;
  monthlyKwh?: number;
  /** Faturadaki sözleşme gücü (kW). Bilinmiyorsa sınır kontrolü yalnızca tarifeye göre yapılır. */
  contractKw?: number;
  /** Kullanılabilir çatı alanı (m²): haritada çizilen ya da elle girilen. */
  roofAreaM2?: number;
  roofType: RoofType;
  /** Yüzey yönü: 0 = güney, -90 = doğu, 90 = batı (PVGIS "aspect" ile aynı). */
  azimuth: number;
  /** Panel eğimi (derece). */
  tilt: number;
  profile: UsageProfile;
  /** 1 kWp'nin bu konumda aylık üretimi (kWh), 12 değer. */
  monthlyYieldPerKwp?: number[];
  /** Yıllık elektrik fiyatı artış varsayımı (%). Varsayılan 0 = bugünkü fiyatla. */
  priceIncreasePct?: number;
};

export type PackageOption = { slug: string; name: string; kw: number; price?: number; href: string };

/** Panel gücü (Wp): mağaza paketlerindeki TOPCon paneller 620–625 Wp. */
export const PANEL_WP = 620;
/** Bir panelin kapladığı alan (m²) ve çatı tipine göre kWp başına gereken alan. */
const PANEL_AREA_M2 = 2.6;
const AREA_FACTOR: Record<RoofType, number> = { egimli: 1.25, trapez: 1.2, duz: 2.0 }; // boşluk, bakım yolu, gölge mesafesi
const MESKEN_MAX_KW = 25;
const DC_AC_RATIO = 1.5; // panel gücü sözleşme gücünün en fazla 1,5 katı
const DEGRADATION = 0.005; // yıllık panel performans kaybı
const CO2_KG_PER_KWH = 0.44; // Türkiye şebekesi yaklaşık emisyon katsayısı
const YEARS = 25;

/** İç Anadolu ortalaması (Ankara, güneye 30°): PVGIS gelmezse kullanılır. */
export const FALLBACK_YIELD = [73, 88, 117, 134, 144, 148, 171, 167, 147, 121, 98, 73];

/** Tüketimin aylara dağılımı (toplam 12): klima yazı, elektrikli ısıtma kışı yükseltir. */
const PROFILES: Record<UsageProfile, number[]> = {
  dengeli: [1.05, 1, 0.95, 0.9, 0.9, 1, 1.1, 1.1, 0.95, 0.9, 1, 1.15],
  yaz_klima: [0.85, 0.8, 0.8, 0.8, 0.9, 1.25, 1.5, 1.5, 1.1, 0.85, 0.8, 0.85],
  kis_isitma: [1.6, 1.45, 1.2, 0.85, 0.7, 0.65, 0.7, 0.7, 0.7, 0.85, 1.2, 1.4],
  gunduz_isyeri: [0.95, 0.95, 1, 1, 1, 1.05, 1.05, 1.05, 1, 1, 0.95, 1],
};

const round = (n: number, d = 0) => Math.round(n * 10 ** d) / 10 ** d;

export type OnGridResult = {
  /** Bugünkü aylık ortalama fatura (TL) ve ortalama kWh fiyatı. */
  monthlyBillTl: number;
  unitPrice: number;
  annualKwh: number;
  monthlyKwh: number[];
  specificYield: number;
  /** Tüketimi karşılamak için gereken panel gücü. */
  neededKwp: number;
  /** Çatıya sığan en yüksek panel gücü (alan girildiyse). */
  roofMaxKwp: number | null;
  /** Mevzuat sınırı (sözleşme gücü / mesken 25 kW). */
  limitKw: number | null;
  limitNote: string | null;
  /** Önerilen sistem: AC gücü (paket) ve panel sayısı. */
  systemKw: number;
  panelCount: number;
  dcKwp: number;
  monthlyProduction: number[];
  annualProduction: number;
  /** Yıllık tüketimin güneşle karşılanan oranı (%). */
  coveragePct: number;
  annualSavingTl: number;
  paybackYears: number | null;
  savings25Tl: number;
  co2TonsPerYear: number;
  treesEquivalent: number;
  package: PackageOption | null;
  constrainedBy: "tuketim" | "cati" | "mevzuat";
};

export function calculateOnGrid(input: OnGridInput, packages: PackageOption[]): OnGridResult {
  const monthlyAvg = input.monthlyKwh && input.monthlyKwh > 0 ? input.monthlyKwh : faturadanTuketim(input.tariff, input.monthlyBillTl ?? 0);
  const monthlyBillTl = faturaTutari(input.tariff, monthlyAvg);
  const unitPrice = monthlyAvg > 0 ? monthlyBillTl / monthlyAvg : 0;
  const annualKwh = monthlyAvg * 12;
  const shape = PROFILES[input.profile];
  const monthlyKwh = shape.map((f) => monthlyAvg * f);

  const yieldPerKwp = input.monthlyYieldPerKwp?.length === 12 ? input.monthlyYieldPerKwp : FALLBACK_YIELD;
  const specificYield = yieldPerKwp.reduce((a, b) => a + b, 0);

  const neededKwp = specificYield > 0 ? annualKwh / specificYield : 0;
  const roofMaxKwp = input.roofAreaM2 && input.roofAreaM2 > 0 ? input.roofAreaM2 / (PANEL_AREA_M2 * AREA_FACTOR[input.roofType]) * (PANEL_WP / 1000) : null;

  // Mevzuat: AC gücü sözleşme gücünü (meskende ayrıca 25 kW'ı) aşamaz; panel gücü AC'nin 1,5 katına kadar çıkabilir.
  let limitKw: number | null = input.contractKw && input.contractKw > 0 ? input.contractKw : null;
  let limitNote: string | null = limitKw ? `Sözleşme gücünüz ${limitKw} kW` : null;
  if (input.tariff === "mesken" && (limitKw == null || limitKw > MESKEN_MAX_KW)) {
    limitKw = limitKw == null ? null : MESKEN_MAX_KW;
    limitNote = limitKw ? "Mesken aboneliklerinde en fazla 25 kW" : limitNote;
  }

  const candidates: { kwp: number; by: OnGridResult["constrainedBy"] }[] = [{ kwp: neededKwp, by: "tuketim" }];
  if (roofMaxKwp != null) candidates.push({ kwp: roofMaxKwp, by: "cati" });
  const acCap = limitKw ?? (input.tariff === "mesken" ? MESKEN_MAX_KW : Infinity);
  if (Number.isFinite(acCap)) candidates.push({ kwp: acCap * DC_AC_RATIO, by: "mevzuat" });
  const binding = candidates.reduce((a, b) => (b.kwp < a.kwp ? b : a));
  const targetKwp = Math.max(0, binding.kwp);

  // Paket: hedefi karşılayan en küçük paket (paketlerde panel gücü invertörün ~%10 üzerinde).
  // Hedef en küçük paketin çok altındaysa paket önerilmez; küçük sisteme özel teklif verilir.
  const usable = packages.filter((p) => p.kw <= acCap).sort((a, b) => a.kw - b.kw);
  const dcOf = (p: PackageOption) => p.kw * 1.1;
  const tooSmall = usable.length > 0 && targetKwp < dcOf(usable[0]) * 0.6;
  const pkg = tooSmall || !usable.length ? null : (usable.find((p) => dcOf(p) >= targetKwp * 0.95) ?? usable[usable.length - 1]);
  const systemKw = pkg ? pkg.kw : round(targetKwp / 1.1, 1);
  let panelCount = Math.max(1, Math.round((systemKw * 1.1 * 1000) / PANEL_WP));
  if (roofMaxKwp != null) panelCount = Math.min(panelCount, Math.max(1, Math.floor((roofMaxKwp * 1000) / PANEL_WP)));
  const dcKwp = round((panelCount * PANEL_WP) / 1000, 2);

  const monthlyProduction = yieldPerKwp.map((y) => y * dcKwp);
  const annualProduction = monthlyProduction.reduce((a, b) => a + b, 0);

  // Aylık mahsuplaşma: her ay faturadan düşen kısım = panelsiz fatura − panelli fatura (kademe farkı dahil).
  // Tüketimi aşan üretim temkinli olarak değerlendirilmez.
  const offset = monthlyProduction.reduce((s, p, i) => s + Math.min(p, monthlyKwh[i]), 0);
  const coveragePct = annualKwh > 0 ? Math.min(100, (offset / annualKwh) * 100) : 0;
  const annualSavingTl = monthlyKwh.reduce(
    (s, c, i) => s + faturaTutari(input.tariff, c) - faturaTutari(input.tariff, Math.max(0, c - monthlyProduction[i])),
    0
  );

  const growth = (input.priceIncreasePct ?? 0) / 100;
  let savings25 = 0;
  let cumulative = 0;
  let paybackYears: number | null = null;
  const cost = pkg?.price;
  for (let y = 0; y < YEARS; y++) {
    const yearSaving = annualSavingTl * (1 - DEGRADATION) ** y * (1 + growth) ** y;
    savings25 += yearSaving;
    if (cost && paybackYears == null) {
      if (cumulative + yearSaving >= cost) paybackYears = y + (cost - cumulative) / yearSaving;
      cumulative += yearSaving;
    }
  }

  const co2 = (annualProduction * CO2_KG_PER_KWH) / 1000;
  return {
    monthlyBillTl: round(monthlyBillTl),
    unitPrice: round(unitPrice, 2),
    annualKwh: round(annualKwh),
    monthlyKwh: monthlyKwh.map((v) => round(v)),
    specificYield: round(specificYield),
    neededKwp: round(neededKwp, 1),
    roofMaxKwp: roofMaxKwp == null ? null : round(roofMaxKwp, 1),
    limitKw,
    limitNote,
    systemKw,
    panelCount,
    dcKwp,
    monthlyProduction: monthlyProduction.map((v) => round(v)),
    annualProduction: round(annualProduction),
    coveragePct: round(coveragePct),
    annualSavingTl: round(annualSavingTl),
    paybackYears: paybackYears == null ? null : round(paybackYears, 1),
    savings25Tl: round(savings25),
    co2TonsPerYear: round(co2, 1),
    treesEquivalent: Math.round((co2 * 1000) / 21), // bir ağaç yılda ~21 kg CO₂ bağlar
    package: pkg,
    constrainedBy: binding.by,
  };
}

/** Satış önceliği (0–100): sistem büyüklüğü, tüketim, mevzuata uygunluk ve iletişim bilgisi. */
export function leadScore(r: OnGridResult, hasEmail: boolean): number {
  let s = 0;
  s += Math.min(40, r.systemKw * 3); // büyük sistem = büyük satış
  s += Math.min(25, r.annualKwh / 600);
  if (r.paybackYears != null && r.paybackYears <= 7) s += 15;
  if (r.constrainedBy !== "mevzuat") s += 10;
  if (hasEmail) s += 10;
  return Math.round(Math.min(100, s));
}
