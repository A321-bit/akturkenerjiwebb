// Güneş enerjili tarımsal sulama ön fizibilite motoru (tarayıcıda çalışır).
//
// Su ihtiyacı: ürünün sezonluk net sulama suyu (mm, yağış düşülmüş, İç Anadolu ortalaması)
// aylara dağıtılır ve sulama yönteminin randımanına bölünür (1 mm = 1 m³/dönüm).
// Pompa: en yoğun günün suyu güneşli saatlerde (8 saat) basılacak debiyle, toplam manometrik
// yükseklik (pompa derinliği + sistem basıncı + kayıplar) üzerinden hesaplanır.
// Güneş: PVGIS aylık üretimiyle her ay basılabilecek su, ihtiyaçla karşılaştırılır.

import { PUMP_OPTIONS, PUMP_SIZING_FACTOR } from "./pumpOptions";
import { birimFiyatlar } from "./elektrik-tarife";

export type Urun = "misir" | "pancar" | "aycicegi" | "bugday" | "yonca" | "meyve" | "ceviz" | "sebze" | "patates" | "zeytin";
export type Yontem = "damla" | "yagmurlama" | "salma";
export type Enerji = "dizel" | "sebeke" | "yok";

/** Sezonluk net sulama suyu (mm), aylık dağılım (Oca-Ara) ve en yoğun günlük ihtiyaç (mm/gün). */
export const URUNLER: Record<Urun, { ad: string; mm: number; dagilim: number[]; tepe: number }> = {
  misir: { ad: "Mısır", mm: 600, dagilim: [0, 0, 0, 0, 0.1, 0.2, 0.32, 0.28, 0.1, 0, 0, 0], tepe: 7.5 },
  pancar: { ad: "Şeker pancarı", mm: 650, dagilim: [0, 0, 0, 0.05, 0.12, 0.2, 0.28, 0.24, 0.11, 0, 0, 0], tepe: 7 },
  aycicegi: { ad: "Ayçiçeği", mm: 450, dagilim: [0, 0, 0, 0, 0.12, 0.3, 0.38, 0.2, 0, 0, 0, 0], tepe: 6.5 },
  bugday: { ad: "Buğday / arpa", mm: 200, dagilim: [0, 0, 0, 0.3, 0.45, 0.25, 0, 0, 0, 0, 0, 0], tepe: 5 },
  yonca: { ad: "Yonca", mm: 800, dagilim: [0, 0, 0, 0.07, 0.14, 0.19, 0.22, 0.2, 0.13, 0.05, 0, 0], tepe: 7.5 },
  meyve: { ad: "Meyve bahçesi", mm: 550, dagilim: [0, 0, 0, 0.03, 0.12, 0.2, 0.27, 0.25, 0.13, 0, 0, 0], tepe: 6 },
  ceviz: { ad: "Ceviz", mm: 600, dagilim: [0, 0, 0, 0.03, 0.12, 0.2, 0.27, 0.25, 0.13, 0, 0, 0], tepe: 6.5 },
  sebze: { ad: "Sebze (domates, biber vb.)", mm: 500, dagilim: [0, 0, 0, 0.05, 0.15, 0.22, 0.27, 0.22, 0.09, 0, 0, 0], tepe: 6 },
  patates: { ad: "Patates", mm: 450, dagilim: [0, 0, 0, 0, 0.15, 0.28, 0.35, 0.22, 0, 0, 0, 0], tepe: 6.5 },
  zeytin: { ad: "Zeytin / badem", mm: 350, dagilim: [0, 0, 0, 0.05, 0.12, 0.2, 0.26, 0.25, 0.12, 0, 0, 0], tepe: 4 },
};

export const YONTEMLER: Record<Yontem, { ad: string; not: string; randiman: number; basincM: number }> = {
  damla: { ad: "Damla sulama", not: "En az su ve enerji (~1,5 bar)", randiman: 0.9, basincM: 15 },
  yagmurlama: { ad: "Yağmurlama", not: "Tabanca / sprinkler (~4 bar)", randiman: 0.75, basincM: 40 },
  salma: { ad: "Salma / karık", not: "Kanala ya da havuza basma", randiman: 0.5, basincM: 3 },
};

export const ENERJILER: Record<Enerji, string> = { dizel: "Dizel jeneratör / motopomp", sebeke: "Elektrik şebekesi", yok: "Henüz pompa yok" };

export const DIZEL_FIYAT = 98; // TL/L, Ekim 2026 pompa fiyatı (müşteri değiştirebilir)
const DIZEL_L_KWH = 0.33; // jeneratörde kWh başına yakıt
const VERIM = 0.55; // pompa × motor
const GUNES_SAAT = 8; // yaz gününde pompanın güneşle verimli çalıştığı saat
const SURUCU = 0.9; // pompa sürücüsü ve kablo kaybı
const AY_GUN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export type SulamaInput = {
  donum: number;
  urun: Urun;
  yontem: Yontem;
  /** Pompanın suyu çektiği derinlik (dinamik su seviyesi), m. */
  derinlikM: number;
  /** Bilinen mevcut pompa gücü (kW); verilirse öneri buna göre yapılır. */
  mevcutPompaKw?: number;
  enerji: Enerji;
  dizelFiyat: number;
};

export type SulamaPackage = { slug: string; name: string; kw: number; price?: number; href: string };

export type SulamaResult = {
  headM: number;
  peakFlowM3h: number;
  /** Hesaplanan gerekli pompa gücü (kW). */
  requiredKw: number;
  pumpKw: number;
  pumpHp: string;
  pvKwp: number;
  package: SulamaPackage | null;
  monthlyNeedM3: number[];
  monthlySolarM3: number[];
  annualNeedM3: number;
  coveragePct: number;
  annualKwh: number;
  costPerKwh: number;
  annualSavingTl: number;
  paybackYears: number | null;
  /** Sezon boyunca güneşle basılacak su (m³). */
  solarWaterM3: number;
};

export function calculateSulama(input: SulamaInput, yieldPerKwp: number[], packages: SulamaPackage[]): SulamaResult {
  const urun = URUNLER[input.urun];
  const yontem = YONTEMLER[input.yontem];
  // Toplam manometrik yükseklik: derinlik + sistem basıncı + boru ve armatür kayıpları (%10, en az 5 m).
  const headM = Math.round(input.derinlikM + yontem.basincM + Math.max(5, (input.derinlikM + yontem.basincM) * 0.1));
  const peakFlowM3h = (input.donum * urun.tepe) / yontem.randiman / GUNES_SAAT;
  const requiredKw = (peakFlowM3h * headM) / 367 / VERIM;

  const target = input.mevcutPompaKw && input.mevcutPompaKw > 0 ? input.mevcutPompaKw : requiredKw;
  const pump = PUMP_OPTIONS.find((p) => p.kw >= target - 0.01) ?? PUMP_OPTIONS[PUMP_OPTIONS.length - 1];
  const pkg = packages.filter((p) => p.kw >= pump.kw - 0.01).sort((a, b) => a.kw - b.kw)[0] ?? null;
  const pvKwp = Math.round(pump.kw * PUMP_SIZING_FACTOR * 10) / 10;

  const monthlyNeedM3 = urun.dagilim.map((w) => (input.donum * urun.mm * w) / yontem.randiman);
  // Güneşle basılabilecek su: aylık üretim → hidrolik enerji → m³; pompanın debi sınırı (günde 10 saat) ayrıca uygulanır.
  const pumpMaxM3h = (pump.kw * VERIM * 367) / headM;
  const monthlySolarM3 = yieldPerKwp.map((y, m) => Math.min((pvKwp * y * SURUCU * VERIM * 367) / headM, pumpMaxM3h * 10 * AY_GUN[m]));

  const kwhPerM3 = headM / 367 / VERIM;
  const annualNeedM3 = monthlyNeedM3.reduce((a, b) => a + b, 0);
  const solarWaterM3 = monthlyNeedM3.reduce((s, need, m) => s + Math.min(need, monthlySolarM3[m]), 0);
  const annualKwh = annualNeedM3 * kwhPerM3;
  const costPerKwh = input.enerji === "dizel" ? DIZEL_L_KWH * input.dizelFiyat : birimFiyatlar("tarimsal").dusuk;
  const annualSavingTl = solarWaterM3 * kwhPerM3 * costPerKwh;

  return {
    headM,
    peakFlowM3h: Math.round(peakFlowM3h * 10) / 10,
    requiredKw: Math.round(requiredKw * 10) / 10,
    pumpKw: pump.kw,
    pumpHp: pump.hp,
    pvKwp,
    package: pkg,
    monthlyNeedM3: monthlyNeedM3.map(Math.round),
    monthlySolarM3: monthlySolarM3.map(Math.round),
    annualNeedM3: Math.round(annualNeedM3),
    coveragePct: annualNeedM3 > 0 ? Math.round((solarWaterM3 / annualNeedM3) * 100) : 0,
    annualKwh: Math.round(annualKwh),
    costPerKwh: Math.round(costPerKwh * 100) / 100,
    annualSavingTl: Math.round(annualSavingTl),
    paybackYears: pkg?.price && annualSavingTl > 0 ? Math.round((pkg.price / annualSavingTl) * 10) / 10 : null,
    solarWaterM3: Math.round(solarWaterM3),
  };
}

/** Satış önceliği (0-100). */
export function sulamaScore(r: SulamaResult, input: SulamaInput): number {
  let s = Math.min(35, r.pumpKw * 2);
  s += Math.min(25, input.donum / 4);
  if (input.enerji === "dizel") s += 15;
  if (r.paybackYears != null && r.paybackYears <= 5) s += 15;
  if (r.package) s += 10;
  return Math.round(Math.min(100, s));
}
