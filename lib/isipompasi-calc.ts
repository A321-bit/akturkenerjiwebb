// Isı pompası ön fizibilite motoru (tarayıcıda çalışır).
//
// Isı ihtiyacı: bina ısı kaybı katsayısı H (W/K) = alan × yalıtım katsayısı × bina tipi çarpanı.
// Saatlik yük = H × (denge sıcaklığı − dış sıcaklık); dış sıcaklık dağılımı PVGIS tipik yılından
// (aylık, 2 °C aralıklı saat sayıları) gelir. Verim (COP) her sıcaklık aralığında, tesisatın
// gidiş suyu sıcaklığına (dış hava kompanzasyonlu) göre hesaplanır; cihaz kapasitesini aşan yük
// elektrikli ısıtıcıyla (COP 1) karşılanır. Müşteri geçen kışki harcamasını girerse model buna
// göre ölçeklenir (gerçek binaya kalibrasyon).

import { birimFiyatlar } from "./elektrik-tarife";

export const BIN_MIN = -30;
export const BIN_STEP = 2;
export const BIN_COUNT = 32;

export type Climate = { bins: number[][]; monthlyMeanT: number[]; designT: number };
export type BinaTipi = "mustakil" | "apartman" | "isyeri";
export type Yalitim = "yok" | "kismi" | "standart" | "iyi";
export type Tesisat = "yerden" | "fancoil" | "radyator";
export type Yakit = "dogalgaz" | "elektrik" | "motorin" | "komur";

export type HeatPumpInput = {
  areaM2: number;
  bina: BinaTipi;
  yalitim: Yalitim;
  tesisat: Tesisat;
  /** Sıcak su kullanan kişi sayısı (0: sıcak su hesaba katılmaz). */
  kisi: number;
  yakit: Yakit;
  /** Mevcut yakıtın birim fiyatı (TL / m³, L, kg ya da kWh). */
  yakitFiyat: number;
  /** Geçen kış ısınma + sıcak su için toplam harcama (TL); verilirse model buna göre ölçeklenir. */
  yillikHarcama?: number;
};

export type HeatPumpOption = { slug: string; name: string; kw: number; price?: number; href: string };

export const BINA_ADLARI: Record<BinaTipi, string> = { mustakil: "Müstakil ev / villa", apartman: "Apartman dairesi", isyeri: "İşyeri / ofis" };
export const YALITIM_ADLARI: Record<Yalitim, string> = { yok: "Yalıtımsız", kismi: "Kısmi yalıtım", standart: "Mantolama var", iyi: "Yeni bina, iyi yalıtım" };
export const TESISAT_ADLARI: Record<Tesisat, string> = { yerden: "Yerden ısıtma", fancoil: "Fancoil", radyator: "Petek" };

/** Yakıt bilgileri. Fiyatlar müşterinin değiştirebileceği varsayılanlardır (Ekim 2026). */
export const YAKITLAR: Record<Yakit, { ad: string; birim: string; kwh: number; verim: number; fiyat: number | null; co2: number; not: string }> = {
  dogalgaz: { ad: "Doğalgaz", birim: "m³", kwh: 9.59, verim: 0.9, fiyat: 17, co2: 0.202, not: "Konut 1. kademe, KDV dahil (dağıtım bölgesine göre değişir)" },
  elektrik: { ad: "Elektrik (klima, elektrikli kalorifer)", birim: "kWh", kwh: 1, verim: 1, fiyat: null, co2: 0.44, not: "EPDK tarifesinden alınır" },
  motorin: { ad: "Motorin / kalorifer yakıtı", birim: "L", kwh: 9.96, verim: 0.85, fiyat: 98, co2: 0.267, not: "Ekim 2026 pompa fiyatı" },
  komur: { ad: "Kömür / odun", birim: "kg", kwh: 6, verim: 0.65, fiyat: null, co2: 0.341, not: "Ton fiyatını kg'a çevirip girin" },
};

// Taban alanı başına ısı kaybı (W/m²·K, ~2,7 m kat yüksekliği; duvar, pencere, çatı ve hava değişimi dahil).
const U: Record<Yalitim, number> = { yok: 2.3, kismi: 1.8, standart: 1.35, iyi: 0.95 };
// Apartman dairesi komşu dairelerle sarılı olduğu için daha az ısı kaybeder.
const BINA_CARPANI: Record<BinaTipi, number> = { mustakil: 1, apartman: 0.7, isyeri: 1.1 };
// Gidiş suyu: ılıkken alt değer, tasarım sıcaklığında üst değer (dış hava kompanzasyonu).
const GIDIS: Record<Tesisat, [number, number]> = { yerden: [28, 35], fancoil: [35, 45], radyator: [40, 55] };

const T_IC = 20; // iç ortam
const T_DENGE = 15; // iç kazançlarla bu sıcaklığın üstünde ısıtma gerekmez
const DHW_KWH_KISI_GUN = 1.8; // 45-50 L/gün, 10 → 45 °C
const DHW_COP = 2.8;
const SEBEKE_CO2 = 0.44;
const AY_GUN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Dış sıcaklığa ve gidiş suyuna göre COP (Carnot verimi %50, 5 K eşanjör farkı). */
export function cop(tOut: number, tFlow: number) {
  return Math.min(5.5, Math.max(1.5, (0.5 * (tFlow + 273.15)) / (tFlow - tOut + 5)));
}

/** Nominal (A7/W35) kapasitenin dış sıcaklıkla kalan oranı (EVI kompresör). */
function kapasiteOrani(tOut: number) {
  return tOut >= 7 ? 1 : Math.max(0.6, 1 - 0.015 * (7 - tOut));
}

export type HeatPumpResult = {
  heatLossWK: number;
  peakKw: number;
  /** Seçilen cihazın nominal gücü (kW); hazır cihaz yoksa ihtiyaç. */
  deviceKw: number;
  package: HeatPumpOption | null;
  monthlyHeatKwh: number[];
  monthlyElKwh: number[];
  monthlyCurrentTl: number[];
  monthlyHpTl: number[];
  annualHeatKwh: number;
  annualElKwh: number;
  scop: number;
  backupSharePct: number;
  currentAnnualTl: number;
  hpAnnualTl: number;
  annualSavingTl: number;
  paybackYears: number | null;
  co2TonsPerYear: number;
  elPrice: number;
  /** Evin ısınma dışı tüketiminin (alt kademe) birim fiyatı; güneş fazlası bununla değerlenir. */
  elPriceBase: number;
  /** Isı pompasının yıllık elektriğini karşılayacak güneş sistemi (kWp). */
  pvKwp: number;
  calibrated: boolean;
};

export function calculateHeatPump(input: HeatPumpInput, climate: Climate, options: HeatPumpOption[]): HeatPumpResult {
  const yakit = YAKITLAR[input.yakit];
  const tarife = input.bina === "isyeri" ? "ticarethane" : "mesken";
  const bf = birimFiyatlar(tarife);
  // Isı pompası tüketimi kademe sınırını aşacağı için ek tüketim yüksek kademeden fiyatlanır.
  const elPrice = bf.yuksek ?? bf.dusuk;
  const fuelPrice = input.yakit === "elektrik" ? input.yakitFiyat || elPrice : input.yakitFiyat;

  const [fMin, fMax] = GIDIS[input.tesisat];
  const span = Math.max(1, T_DENGE - climate.designT);
  const flow = (t: number) => fMin + (fMax - fMin) * Math.min(1, Math.max(0, (T_DENGE - t) / span));
  const binT = (i: number) => BIN_MIN + BIN_STEP * i + BIN_STEP / 2;

  const dhwMonthly = AY_GUN.map((d) => input.kisi * DHW_KWH_KISI_GUN * d);
  const dhwAnnual = dhwMonthly.reduce((a, b) => a + b, 0);

  let H = input.areaM2 * U[input.yalitim] * BINA_CARPANI[input.bina];
  const heatFor = (h: number) => climate.bins.reduce((s, row) => s + row.reduce((a, n, i) => a + (h * Math.max(0, T_DENGE - binT(i)) * n) / 1000, 0), 0);

  // Kalibrasyon: geçen kışın harcamasından binanın gerçek ısı ihtiyacı çıkarılır.
  let calibrated = false;
  if (input.yillikHarcama && input.yillikHarcama > 0 && fuelPrice > 0) {
    const delivered = (input.yillikHarcama / fuelPrice) * yakit.kwh * yakit.verim;
    const model = heatFor(H);
    if (model > 0) {
      H *= Math.min(2.5, Math.max(0.4, Math.max(0, delivered - dhwAnnual) / model));
      calibrated = true;
    }
  }

  const peakKw = (H * (T_IC - climate.designT)) / 1000 + input.kisi * 0.15;
  // En ucuz yeterli cihaz; eşit fiyatta küçük olan.
  const fits = options.filter((o) => o.kw >= peakKw).sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity) || a.kw - b.kw);
  const pkg = fits[0] ?? null;
  const deviceKw = pkg?.kw ?? Math.ceil(peakKw);

  const monthlyHeatKwh: number[] = [];
  const monthlyElKwh: number[] = [];
  let backup = 0;
  climate.bins.forEach((row, m) => {
    let heat = 0;
    let el = 0;
    row.forEach((n, i) => {
      if (!n) return;
      const t = binT(i);
      const load = (H * Math.max(0, T_DENGE - t)) / 1000;
      if (load <= 0) return;
      const byHp = Math.min(load, deviceKw * kapasiteOrani(t));
      heat += load * n;
      el += (byHp / cop(t, flow(t))) * n + (load - byHp) * n;
      backup += (load - byHp) * n;
    });
    monthlyHeatKwh.push(heat + dhwMonthly[m]);
    monthlyElKwh.push(el + dhwMonthly[m] / DHW_COP);
  });

  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const annualHeatKwh = sum(monthlyHeatKwh);
  const annualElKwh = sum(monthlyElKwh);
  const monthlyCurrentTl = monthlyHeatKwh.map((q) => (q / (yakit.kwh * yakit.verim)) * fuelPrice);
  const monthlyHpTl = monthlyElKwh.map((e) => e * elPrice);
  const currentAnnualTl = sum(monthlyCurrentTl);
  const hpAnnualTl = sum(monthlyHpTl);
  const annualSavingTl = currentAnnualTl - hpAnnualTl;

  return {
    heatLossWK: Math.round(H),
    peakKw: Math.round(peakKw * 10) / 10,
    deviceKw,
    package: pkg,
    monthlyHeatKwh: monthlyHeatKwh.map(Math.round),
    monthlyElKwh: monthlyElKwh.map(Math.round),
    monthlyCurrentTl: monthlyCurrentTl.map(Math.round),
    monthlyHpTl: monthlyHpTl.map(Math.round),
    annualHeatKwh: Math.round(annualHeatKwh),
    annualElKwh: Math.round(annualElKwh),
    scop: Math.round((annualHeatKwh / Math.max(1, annualElKwh)) * 100) / 100,
    backupSharePct: Math.round((backup / Math.max(1, annualHeatKwh)) * 1000) / 10,
    currentAnnualTl: Math.round(currentAnnualTl),
    hpAnnualTl: Math.round(hpAnnualTl),
    annualSavingTl: Math.round(annualSavingTl),
    paybackYears: pkg?.price && annualSavingTl > 0 ? Math.round((pkg.price / annualSavingTl) * 10) / 10 : null,
    co2TonsPerYear: Math.round(((annualHeatKwh / yakit.verim) * yakit.co2 - annualElKwh * SEBEKE_CO2) / 100) / 10,
    elPrice,
    elPriceBase: bf.dusuk,
    pvKwp: Math.max(1, Math.round((annualElKwh / PV_KWH_PER_KWP) * 2) / 2),
    calibrated,
  };
}

export const PV_KWH_PER_KWP = 1450;
/** Güneş fazlasının evin diğer tüketimine sayılan üst sınırı (kWh/yıl; ortalama konut tüketimi). */
export const EV_TUKETIMI_KWH = 3000;

/** Isı pompası + güneş paketi: yatırım, yıllık kazanç ve geri ödeme. */
export function solarCombo(r: HeatPumpResult, solar: { kw: number; price?: number } | null) {
  if (!solar?.price || !r.package?.price) return null;
  const production = solar.kw * 1.1 * PV_KWH_PER_KWP;
  const extraKwh = Math.min(EV_TUKETIMI_KWH, Math.max(0, production - r.annualElKwh));
  const saving = r.currentAnnualTl + extraKwh * r.elPriceBase;
  const cost = r.package.price + solar.price;
  return { cost, saving: Math.round(saving), extraKwh: Math.round(extraKwh), production: Math.round(production), payback: Math.round((cost / saving) * 10) / 10 };
}

/** Satış önceliği (0-100): büyük ihtiyaç, yüksek tasarruf ve kısa geri ödeme öne çıkar. */
export function heatPumpScore(r: HeatPumpResult): number {
  let s = Math.min(35, r.deviceKw * 2);
  s += Math.min(30, r.annualSavingTl / 3000);
  if (r.paybackYears != null && r.paybackYears <= 6) s += 20;
  else if (r.paybackYears != null && r.paybackYears <= 10) s += 10;
  if (r.package) s += 10;
  return Math.round(Math.min(100, s));
}

/** İklim verisi alınamazsa kullanılan genel profil (İç Anadolu'ya yakın, tasarım -12 °C). */
export function fallbackClimate(): Climate {
  const means = [0.3, 1.8, 6, 11.4, 16.2, 20.5, 23.8, 23.6, 19.2, 13.4, 7, 2.4];
  const bins = means.map((mu, m) => {
    const row = Array<number>(BIN_COUNT).fill(0);
    const hours = AY_GUN[m] * 24;
    // Ay içi sıcaklık dağılımı: ortalama etrafında ~5 °C sapmalı normal dağılım.
    const w = row.map((_, i) => Math.exp(-((BIN_MIN + BIN_STEP * i + 1 - mu) ** 2) / (2 * 25)));
    const tot = w.reduce((a, b) => a + b, 0);
    return w.map((x) => Math.round((x / tot) * hours));
  });
  return { bins, monthlyMeanT: means, designT: -12 };
}
