// Teklif verisi ve finansal hesap (tasarım, üretim, fiyat kalemleri, tasarruf).

import { faturaTutari, faturadanTuketim, type AboneGrubu } from "../elektrik-tarife";
import { evMonthlyKwh } from "../ongrid-calc";
import type { LatLon, PanelCell, PanelModel, RoofFace } from "./geometry";

/** birimFiyat, teklifin para biriminde (yeni tekliflerde USD) satış fiyatıdır. */
export type PriceLine = { id: string; ad: string; adet: number; birim: string; birimFiyat: number; maliyetUsd?: number; marjPct?: number; kind?: "panel" | "inverter" | "inverter2" | "battery" };
export type PaymentStep = { id: string; ad: string; pct: number; sure: string };
/** malzeme: kalem toplamı · kwp: kWp başına tutar · manuel: elle girilen toplam. */
export type PriceMode = "malzeme" | "kwp" | "manuel";

export type InverterChoice = { name: string; kw: number; price?: number; slug?: string; adet: number; costUsd?: number; marginPct?: number };
export type BatteryChoice = { name: string; kwh: number; slug?: string; adet: number; costUsd?: number; marginPct?: number; extras?: { name: string; adet: number; costUsd: number }[] };

export type Proposal = {
  id?: number;
  proposalNo: string;
  status: "Taslak" | "Gönderildi" | "Kabul edildi" | "Reddedildi";
  createdAt: string;
  validDays: number;
  calcId?: number;
  customer: { name: string; phone: string; email: string; address: string; province: string; mahalle?: string; ada?: string; parsel?: string };
  /** Parsel Sorgu'dan bulunan sınır (haritada gösterilir). */
  parcelRing?: LatLon[] | null;
  abone: AboneGrubu;
  monthlyBillTl: number;
  site: { center: LatLon; zoom: number; label?: string };
  panel: PanelModel;
  faces: RoofFace[];
  cells: PanelCell[];
  setbackM: number;
  gapM: number;
  inverter: InverterChoice | null;
  /** Teklife dahil batarya (kWh); 0 ya da boşsa bataryasız. */
  batteryKwh?: number;
  battery?: BatteryChoice | null;
  /** Sözleşme gücü (kW) ve üzerine eklenecek PV payı. */
  contractKw?: number;
  oversizePct?: number;
  roofType?: import("./pricing").RoofKind;
  /** "USD" ise fiyatlar dolardır; boşsa eski TL teklif. */
  priceCurrency?: "USD";
  priceMode?: PriceMode;
  kwpUsd?: number;
  manualUsd?: number;
  usdTry?: number;
  usdDate?: string;
  /** Belgede TL göster. */
  showTl?: boolean;
  /** Belgede kalem fiyatlarını göster. */
  showLinePrices?: boolean;
  /** Elektrik fiyatının bugüne göre artışı (%): 2. yıldan 10. yıla; sonrası sabit. */
  hikeTable?: number[];
  paymentPlan?: PaymentStep[];
  /** Ek invertörler (farklı model); kalemle aynı id'yi taşır. */
  extraInverters?: (InverterChoice & { id: string })[];
  /** optimal: tüketime/sözleşmeye göre · maksimum: çatının tamamı. */
  reportType?: "optimal" | "maksimum";
  /** Tüketim kaynağı: fatura tutarı ya da günlük kWh. */
  consumptionMode?: "fatura" | "gunluk";
  dailyKwh?: number;
  /** Faturada olmayan elektrikli araç şarjı: yıllık km. */
  evKm?: number;
  /** Elle birim fiyat (kuruş/kWh, KDV hariç); boşsa EPDK tarifesi. */
  unitKr?: number;
  /** Yüzey kimliğine göre PVGIS aylık üretimi (1 kWp, kWh). */
  yields: Record<string, number[]>;
  lines: PriceLine[];
  pricesIncludeVat: boolean;
  discountTl: number;
  paymentTerms: string;
  scopeNotes: string;
  warrantyNotes: string;
  images?: { perspective?: string; top?: string };
  /** Müşteri linki ve açılma takibi. */
  shareToken?: string;
  views?: number;
  lastViewAt?: string;
  notifiedAt?: string;
};

export const DEFAULT_TERMS = {
  payment: "%50 sipariş onayında, %40 malzeme sahaya teslim edildiğinde, %10 kabul ve devreye alma sonrasında ödenir.",
  scope:
    "Teklife; güneş panelleri, invertör, montaj konstrüksiyonu, DC ve AC kablolama, koruma panosu, montaj ve işçilik, elektrik projesi ile dağıtım şirketi başvuru ve kabul işlemleri dahildir. Çatı onarımı, çatıda güçlendirme ve sayaç/trafo değişikliği gerekirse ayrıca fiyatlandırılır.",
  warranty:
    "Panel ve invertörlerde üretici garanti koşulları geçerlidir. Montaj ve işçilik için Aktürk Enerji garanti verir. Garanti süreleri ürün belgelerinde ve sözleşmede belirtilir.",
};

export function newProposalNo(d = new Date()) {
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `AE-${ymd}-${String(Math.floor(Math.random() * 900) + 100)}`;
}

const PROFIL = [1.05, 1, 0.95, 0.9, 0.9, 1, 1.1, 1.1, 0.95, 0.9, 1, 1.15];
const DEGRADATION = 0.005;

export type ProposalNumbers = {
  panelCount: number;
  dcKwp: number;
  acKw: number;
  dcAcRatio: number | null;
  byFace: { faceId: string; name: string; count: number; kwp: number; annualKwh: number }[];
  monthlyProduction: number[];
  annualProduction: number;
  specificYield: number;
  monthlyKwh: number[];
  annualKwh: number;
  /** Bugünkü tahmini aylık fatura. */
  monthlyBillTl: number;
  annualSavingTl: number;
  coveragePct: number;
  subtotal: number;
  total: number;
  /** Geri ödeme hesabı için TL karşılığı. */
  totalTl: number;
  vat: number;
  paybackYears: number | null;
  /** Elektrik zammı olmadan geri ödeme. */
  paybackFlatYears: number | null;
  savings25Tl: number;
  /** Yıl sonu birikimli net kazanç (tasarruf − yatırım), 25 yıl. */
  cumulativeTl: number[];
  co2Tons: number;
};

export function computeNumbers(p: Proposal): ProposalNumbers {
  const wp = p.panel.wp;
  const byFace = p.faces.map((f) => {
    const count = p.cells.filter((c) => c.faceId === f.id).length;
    const kwp = (count * wp) / 1000;
    const y = p.yields[f.id];
    return { faceId: f.id, name: f.name, count, kwp, annualKwh: y ? y.reduce((a, b) => a + b, 0) * kwp : 0, y };
  });
  const monthlyProduction = Array.from({ length: 12 }, (_, m) => byFace.reduce((s, f) => s + (f.y ? f.y[m] * f.kwp : 0), 0));
  const annualProduction = monthlyProduction.reduce((a, b) => a + b, 0);
  const panelCount = byFace.reduce((s, f) => s + f.count, 0);
  const dcKwp = (panelCount * wp) / 1000;
  const acKw = (p.inverter ? p.inverter.kw * p.inverter.adet : 0) + (p.extraInverters ?? []).reduce((a, i) => a + i.kw * i.adet, 0);

  // Elle birim fiyat varsa fatura: kWh × kuruş, tüketim vergisi ve KDV ile; yoksa EPDK tarifesi.
  const vergi = (1 + (p.abone === "sanayi" ? 0.01 : 0.05)) * (1 + (p.abone === "mesken" || p.abone === "tarimsal" ? 0.1 : 0.2));
  const kr = p.unitKr ?? 0;
  const bill = (kwh: number) => (kr > 0 ? (kwh * kr * vergi) / 100 : faturaTutari(p.abone, kwh));
  const fromBill = (tl: number) => (kr > 0 ? (tl * 100) / (kr * vergi) : faturadanTuketim(p.abone, tl));
  const avg = p.consumptionMode === "gunluk" ? (p.dailyKwh ?? 0) * 30.4 : p.monthlyBillTl > 0 ? fromBill(p.monthlyBillTl) : 0;
  const ev = p.evKm ? evMonthlyKwh(p.evKm) : 0;
  const monthlyKwh = PROFIL.map((f) => avg * f + ev);
  const annualKwh = monthlyKwh.reduce((a, b) => a + b, 0);
  const annualSavingTl = monthlyKwh.reduce((s, c, i) => s + bill(c) - bill(Math.max(0, c - monthlyProduction[i])), 0);
  const offset = monthlyKwh.reduce((s, c, i) => s + Math.min(c, monthlyProduction[i]), 0);

  const lineSum = p.lines.reduce((s, l) => s + l.adet * l.birimFiyat, 0);
  const mode = p.priceMode ?? "malzeme";
  const subtotal = mode === "kwp" ? dcKwp * (p.kwpUsd ?? 0) : mode === "manuel" ? (p.manualUsd ?? 0) : lineSum;
  const total = Math.max(0, subtotal - p.discountTl);
  const vat = p.pricesIncludeVat ? total - total / 1.2 : total * 0.2;
  const grand = p.pricesIncludeVat ? total : total + vat;
  const totalTl = p.priceCurrency === "USD" ? grand * (p.usdTry ?? 0) : grand;

  // Elektrik fiyatı çarpanı: 1. yıl bugünkü fiyat, 2-10. yıl tablodan, sonrası sabit.
  const table = p.hikeTable ?? [];
  const hikeAt = (y: number) => (y === 0 || !table.length ? 1 : 1 + (table[Math.min(y - 1, table.length - 1)] ?? 0) / 100);
  const paybackOf = (factor: (y: number) => number) => {
    let cum = 0;
    for (let y = 0; y < 25; y++) {
      const ys = annualSavingTl * (1 - DEGRADATION) ** y * factor(y);
      if (totalTl > 0 && ys > 0 && cum + ys >= totalTl) return y + (totalTl - cum) / ys;
      cum += ys;
    }
    return null;
  };
  let s25 = 0;
  const cumulativeTl: number[] = [];
  for (let y = 0; y < 25; y++) {
    s25 += annualSavingTl * (1 - DEGRADATION) ** y * hikeAt(y);
    cumulativeTl.push(s25 - totalTl);
  }

  return {
    panelCount,
    dcKwp,
    acKw,
    dcAcRatio: acKw > 0 ? dcKwp / acKw : null,
    byFace: byFace.map((f) => ({ faceId: f.faceId, name: f.name, count: f.count, kwp: f.kwp, annualKwh: f.annualKwh })),
    monthlyProduction,
    annualProduction,
    specificYield: dcKwp > 0 ? annualProduction / dcKwp : 0,
    monthlyKwh,
    annualKwh,
    monthlyBillTl: avg > 0 ? bill(avg) : 0,
    annualSavingTl,
    coveragePct: annualKwh > 0 ? Math.min(100, (offset / annualKwh) * 100) : 0,
    subtotal,
    total: grand,
    totalTl,
    vat,
    paybackYears: paybackOf(hikeAt),
    paybackFlatYears: paybackOf(() => 1),
    savings25Tl: s25,
    cumulativeTl,
    co2Tons: (annualProduction * 0.44) / 1000,
  };
}
