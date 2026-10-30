// Otomatik ürün seçimi: panel gücü ve sözleşme gücüne göre invertör; bataryalı teklifte
// hibrit invertör ve uyumlu batarya. Eşleşmeler mağazadaki hibrit paket reçetelerinden alınmıştır;
// seçim her zaman elle değiştirilebilir.

import type { BatteryChoice, InverterChoice } from "./proposal";

export type InverterOption = { name: string; kw: number; slug?: string; hybrid?: boolean; costUsd?: number; marginPct?: number; price?: number };
export type BatteryOption = Omit<BatteryChoice, "adet">;
export type Accessory = { name: string; costUsd: number };

const costOf = (i: { costUsd?: number }) => i.costUsd ?? Infinity;
const isMono = (name: string) => /monofaze/i.test(name);
const isTri = (name: string) => /trifaze/i.test(name);

/**
 * Bataryasız sistem. DC/AC oranı 0,85-1,30 aralığında kalan güçler içinden hedefe (sözleşme gücü, yoksa
 * DC/1,1) en yakını seçilir; sözleşme gücünü aşmayan güç önceliklidir. Aynı güçte en düşük maliyetli ürün
 * alınır. Gereken güç 5 kW'a kadarsa monofaze, üstünde trifaze; en büyük ürün yetmezse birden fazla adet.
 */
export function pickOnGridInverter(options: InverterOption[], dcKwp: number, contractKw = 0): InverterChoice | null {
  if (dcKwp <= 0) return null;
  const minKw = dcKwp / 1.3;
  const maxKw = dcKwp / 0.85;
  const target = contractKw > 0 ? contractKw : dcKwp / 1.1;
  const mono = Math.max(minKw, contractKw) <= 5;
  const pool = options.filter((o) => !o.hybrid && o.kw > 0 && o.costUsd && (mono ? isMono(o.name) : isTri(o.name)));
  if (!pool.length) return null;
  const largest = Math.max(...pool.map((o) => o.kw));
  const adet = minKw > largest ? Math.ceil(minKw / largest) : 1;
  const inRange = pool.filter((o) => o.kw * adet >= minKw && o.kw * adet <= maxKw);
  const allowed = contractKw > 0 ? inRange.filter((o) => o.kw * adet <= contractKw) : [];
  const cands = allowed.length ? allowed : inRange.length ? inRange : pool.filter((o) => o.kw * adet >= minKw);
  if (!cands.length) return null;
  const best = [...cands].sort((a, b) => Math.abs(a.kw * adet - target) - Math.abs(b.kw * adet - target) || costOf(a) - costOf(b))[0];
  return { ...best, adet };
}

type HybridSet = { maxKw: number; adet: number; inverter: RegExp; battery: RegExp; minModules: number; bms?: RegExp; bmsPerInverter?: boolean; meter: "uno" | "trio" };

// Hibrit paket reçeteleri: invertör, batarya modülü, en az modül sayısı ve BMS.
const SETLER: HybridSet[] = [
  { maxKw: 6, adet: 1, inverter: /Uno Hybrid N 6 kW LV/, battery: /PB Serisi.*5,12 kWh/, minModules: 1, meter: "uno" },
  { maxKw: 8, adet: 1, inverter: /Uno Hybrid N 8 kW LV/, battery: /PB Serisi.*5,12 kWh/, minModules: 1, meter: "uno" },
  { maxKw: 10, adet: 1, inverter: /Trio Hybrid S AIO 10 kW HV/, battery: /Hightech Power S 4 kWh HV/, minModules: 3, bms: /Hightech Power S HV BMS AIO/, meter: "trio" },
  { maxKw: 12, adet: 1, inverter: /Trio Hybrid S AIO LV 12 kW/, battery: /Modüler V Seri.*14,34 kWh/, minModules: 1, meter: "trio" },
  { maxKw: 15, adet: 1, inverter: /Trio Hybrid S AIO 15 kW HV/, battery: /Hightech Power S 4 kWh HV/, minModules: 4, bms: /Hightech Power S HV BMS AIO/, meter: "trio" },
  { maxKw: 20, adet: 1, inverter: /Trio Hybrid S AIO 20 kW HV/, battery: /Hightech Power S 4 kWh HV/, minModules: 5, bms: /Hightech Power S HV BMS AIO/, meter: "trio" },
  { maxKw: 30, adet: 1, inverter: /Trio Hybrid-L 30 kW HV/, battery: /Indoor 5,1 kWh/, minModules: 6, bms: /Indoor BMS/, bmsPerInverter: true, meter: "trio" },
  { maxKw: 60, adet: 2, inverter: /Trio Hybrid-L 30 kW HV/, battery: /Indoor 5,1 kWh/, minModules: 12, bms: /Indoor BMS/, bmsPerInverter: true, meter: "trio" },
  { maxKw: 80, adet: 1, inverter: /M80K 80 kW/, battery: /Hera Indoor 16,08 kWh/, minModules: 5, meter: "trio" },
];

/**
 * Bataryalı sistem. Güce uygun reçete seçilir; batarya modül sayısı istenen kWh'e göre artar, reçetenin
 * en az modül sayısının altına inmez. 80 kW üstü için reçete yok; elle seçilir (null döner).
 */
export function pickHybridSet(
  inverters: InverterOption[],
  batteries: BatteryOption[],
  accessories: Accessory[],
  dcKwp: number,
  contractKw: number,
  wantedKwh: number
): { inverter: InverterChoice; battery: BatteryChoice } | null {
  if (dcKwp <= 0) return null;
  const need = Math.max(contractKw > 0 ? contractKw : dcKwp / 1.1, dcKwp / 1.3);
  const set = SETLER.find((s) => need <= s.maxKw);
  if (!set) return null;
  const inv = inverters.find((i) => set.inverter.test(i.name));
  const bat = batteries.find((b) => set.battery.test(b.name));
  if (!inv || !bat) return null;
  const adet = Math.max(set.minModules, Math.ceil(wantedKwh / bat.kwh));
  const extras: NonNullable<BatteryChoice["extras"]> = [];
  const acc = (re: RegExp) => accessories.find((a) => re.test(a.name));
  const bms = set.bms && acc(set.bms);
  if (bms) extras.push({ ...bms, adet: set.bmsPerInverter ? set.adet : 1 });
  const meter = acc(set.meter === "uno" ? /Uno.*Smart Meter/i : /Trio Smart Meter/i);
  if (meter) extras.push({ ...meter, adet: 1 });
  const dongle = acc(/Dongle Wi-?Fi/i);
  if (dongle) extras.push({ ...dongle, adet: set.adet });
  return { inverter: { ...inv, adet: set.adet }, battery: { ...bat, adet, extras } };
}
