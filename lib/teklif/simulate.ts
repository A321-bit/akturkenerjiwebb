// Saatlik enerji akışı tahmini: PVGIS aylık üretimi ve faturadan çıkan aylık tüketim, ayın tipik
// bir gününe dağıtılır. Üretim gün doğumu-batımı eğrisiyle, tüketim abonelik profiliyle yayılır.
// Teklif ekranı ve belgesindeki günlük grafikler ile batarya karşılaştırması bunu kullanır.

import type { AboneGrubu } from "../elektrik-tarife";

const GUN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const ORTA_GUN = [15, 46, 75, 105, 135, 162, 198, 228, 258, 288, 318, 344];
const ROUND_TRIP = 0.9;
const KULLANILABILIR = 0.9;

// 24 saatlik göreli tüketim (toplama bölünür).
const PROFIL: Record<AboneGrubu, number[]> = {
  mesken: [2, 1.6, 1.4, 1.4, 1.4, 1.6, 2.6, 3.4, 3, 2.6, 2.6, 2.8, 3, 2.8, 2.6, 2.8, 3.4, 4.6, 6, 6.6, 6.4, 5.4, 4, 2.8],
  ticarethane: [1, 1, 1, 1, 1, 1, 1.2, 2, 4.6, 6, 6.4, 6.4, 6, 6.2, 6.4, 6.2, 5.6, 4.6, 3, 2, 1.6, 1.4, 1.2, 1],
  sanayi: [1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.8, 3.4, 6, 6.6, 6.6, 6.4, 5.6, 6.4, 6.6, 6.4, 5.6, 3.4, 2, 1.6, 1.6, 1.4, 1.4, 1.4],
  tarimsal: [0.6, 0.6, 0.6, 0.6, 0.6, 1, 2.6, 5, 7, 8, 8.4, 8.4, 8.4, 8.4, 8.4, 8, 7, 5, 2.6, 1, 0.6, 0.6, 0.6, 0.6],
};

export type HourFlow = { pv: number; load: number; direct: number; toBattery: number; fromBattery: number; toGrid: number; fromGrid: number; soc: number };

/** Ayın tipik günü için saatlik üretim dağılımı (toplamı 1). */
function pvShape(month: number, lat: number, azimuth: number) {
  const phi = (lat * Math.PI) / 180;
  const decl = (23.45 * Math.PI * Math.sin((2 * Math.PI * (284 + ORTA_GUN[month])) / 365)) / 180;
  const ws = Math.acos(Math.max(-1, Math.min(1, -Math.tan(phi) * Math.tan(decl))));
  const half = (ws * 12) / Math.PI;
  // Doğuya bakan çatı sabah, batıya bakan öğleden sonra üretir.
  const noon = 12.3 + (azimuth / 15) * 0.4;
  const sr = noon - half;
  const out = Array.from({ length: 24 }, (_, h) => {
    const t = (h + 0.5 - sr) / (2 * half);
    return t > 0 && t < 1 ? Math.sin(Math.PI * t) ** 1.5 : 0;
  });
  const sum = out.reduce((a, b) => a + b, 0) || 1;
  return out.map((v) => v / sum);
}

/** Bataryalı ya da bataryasız tipik gün. İki tur çalıştırılır; ikinci tur günü dolu/boş başlangıçtan arındırır. */
export function simulateDay(input: { month: number; monthlyPv: number; monthlyLoad: number; abone: AboneGrubu; lat: number; azimuth: number; batteryKwh: number }): HourFlow[] {
  const { month, monthlyPv, monthlyLoad, abone, lat, azimuth, batteryKwh } = input;
  const days = GUN[month];
  const shape = pvShape(month, lat, azimuth);
  const prof = PROFIL[abone];
  const profSum = prof.reduce((a, b) => a + b, 0);
  const cap = batteryKwh * KULLANILABILIR;
  const eff = Math.sqrt(ROUND_TRIP);
  let stored = 0;
  let out: HourFlow[] = [];
  for (let pass = 0; pass < 2; pass++) {
    out = [];
    for (let h = 0; h < 24; h++) {
      const pv = (monthlyPv / days) * shape[h];
      const load = (monthlyLoad / days) * (prof[h] / profSum);
      const direct = Math.min(pv, load);
      let toBattery = 0;
      let fromBattery = 0;
      const surplus = pv - direct;
      const deficit = load - direct;
      if (surplus > 0 && cap > 0) {
        toBattery = Math.min(surplus, (cap - stored) / eff);
        stored += toBattery * eff;
      } else if (deficit > 0 && stored > 0) {
        fromBattery = Math.min(deficit, stored * eff);
        stored -= fromBattery / eff;
      }
      out.push({ pv, load, direct, toBattery, fromBattery, toGrid: surplus - toBattery, fromGrid: deficit - fromBattery, soc: cap > 0 ? stored / cap : 0 });
    }
  }
  return out;
}

export type YearFlow = { pv: number; load: number; selfUsed: number; toGrid: number; fromGrid: number; selfUsePct: number; independencePct: number };

/** Yıl toplamı: her ayın tipik günü, ayın gün sayısıyla çarpılır. */
export function simulateYear(input: { monthlyPv: number[]; monthlyLoad: number[]; abone: AboneGrubu; lat: number; azimuth: number; batteryKwh: number }): YearFlow {
  const t = { pv: 0, load: 0, selfUsed: 0, toGrid: 0, fromGrid: 0 };
  input.monthlyPv.forEach((monthlyPv, month) => {
    const day = simulateDay({ month, monthlyPv, monthlyLoad: input.monthlyLoad[month], abone: input.abone, lat: input.lat, azimuth: input.azimuth, batteryKwh: input.batteryKwh });
    for (const h of day) {
      t.pv += h.pv * GUN[month];
      t.load += h.load * GUN[month];
      t.selfUsed += (h.direct + h.fromBattery) * GUN[month];
      t.toGrid += h.toGrid * GUN[month];
      t.fromGrid += h.fromGrid * GUN[month];
    }
  });
  return { ...t, selfUsePct: t.pv > 0 ? (t.selfUsed / t.pv) * 100 : 0, independencePct: t.load > 0 ? (t.selfUsed / t.load) * 100 : 0 };
}

/** Akşam ve gece tüketimini karşılayacak yaklaşık batarya boyutu (kWh, 5'e yuvarlı). */
export function suggestBattery(monthlyLoad: number[], abone: AboneGrubu) {
  const avg = monthlyLoad.reduce((a, b) => a + b, 0) / 365;
  const prof = PROFIL[abone];
  const sum = prof.reduce((a, b) => a + b, 0);
  const night = [...prof.slice(18), ...prof.slice(0, 6)].reduce((a, b) => a + b, 0) / sum;
  return Math.max(5, Math.round((avg * night) / KULLANILABILIR / 5) * 5);
}

/** Yüzeylerin üretime göre ağırlıklı ortalama yönü. */
export const meanAzimuth = (faces: { azimuth: number; weight: number }[]) => {
  const w = faces.reduce((s, f) => s + f.weight, 0);
  return w > 0 ? faces.reduce((s, f) => s + f.azimuth * f.weight, 0) / w : 0;
};
