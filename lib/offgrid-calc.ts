// Off grid paket hesaplama: cihaz listesinden günlük tüketim, invertör gücü,
// panel gücü ve batarya kapasitesi tahmini. Değerler yaklaşık hesaptır;
// kesin sistem keşif / görüşme sonrası netleşir.

export type Device = {
  id: string;
  name: string;
  /** Çalışırken çektiği güç (W). İnvertör seçimi için kullanılır. */
  watt: number;
  qty: number;
  /** Günde kaç saat çalıştığı (buzdolabı gibi cihazlarda kompresörün çalıştığı süre). */
  hours: number;
  /** Motorlu cihaz (kalkışta birkaç kat güç çeker). */
  motor?: boolean;
  /** Güneş enerjisiyle çalıştırılması önerilmeyen yüksek tüketimli ısıtıcı. */
  heater?: boolean;
  note?: string;
};

export const DEVICE_PRESETS: Omit<Device, "qty">[] = [
  { id: "led", name: "LED lamba", watt: 10, hours: 5 },
  { id: "buzdolabi", name: "Buzdolabı", watt: 150, hours: 8, motor: true, note: "Kompresör günde ~8 saat çalışır" },
  { id: "derin", name: "Derin dondurucu", watt: 150, hours: 10, motor: true },
  { id: "tv", name: "Televizyon", watt: 100, hours: 4 },
  { id: "uydu", name: "Uydu alıcısı", watt: 20, hours: 4 },
  { id: "modem", name: "Modem / internet", watt: 15, hours: 24 },
  { id: "telefon", name: "Telefon şarjı", watt: 10, hours: 2 },
  { id: "laptop", name: "Dizüstü bilgisayar", watt: 60, hours: 3 },
  { id: "kamera", name: "Güvenlik kamerası", watt: 10, hours: 24 },
  { id: "camasir", name: "Çamaşır makinesi", watt: 2000, hours: 0.5, motor: true, note: "Bir yıkama ~1 kWh" },
  { id: "bulasik", name: "Bulaşık makinesi", watt: 1800, hours: 0.6 },
  { id: "hidrofor", name: "Hidrofor", watt: 1000, hours: 1, motor: true },
  { id: "dalgic", name: "Dalgıç / bahçe pompası", watt: 750, hours: 2, motor: true },
  { id: "klima", name: "Klima (inverter, 12.000 BTU)", watt: 1000, hours: 5, motor: true },
  { id: "vantilator", name: "Vantilatör", watt: 50, hours: 6 },
  { id: "kettle", name: "Su ısıtıcı (kettle)", watt: 2000, hours: 0.15 },
  { id: "mikrodalga", name: "Mikrodalga fırın", watt: 1000, hours: 0.2 },
  { id: "firin", name: "Elektrikli fırın / ocak", watt: 2000, hours: 0.5 },
  { id: "utu", name: "Ütü", watt: 2000, hours: 0.3 },
  { id: "supurge", name: "Elektrikli süpürge", watt: 1500, hours: 0.3, motor: true },
  { id: "termosifon", name: "Termosifon / şofben", watt: 2000, hours: 2, heater: true },
  { id: "soba", name: "Elektrikli soba", watt: 2000, hours: 4, heater: true },
];

export type Season = "yaz" | "yil";

// Ankara için günlük tepe güneş saati (kWh/kWp/gün) ve sistem kayıpları.
const SUN_HOURS: Record<Season, number> = { yaz: 5.5, yil: 3 };
const SYSTEM_EFFICIENCY = 0.75; // invertör, kablo, sıcaklık, kirlenme ve batarya kayıpları
const NIGHT_SHARE = 0.6; // tüketimin bataryadan karşılanan kısmı (akşam + gece + sabah)
const BATTERY_DOD = 0.9; // LiFePO4 kullanılabilir kapasite oranı
const INVERTER_MARGIN = 1.25; // aynı anda çalışan yükün üzerine pay
const SHORT_USE_HOURS = 1; // günde 1 saatten az çalışan ağır cihazlar "kısa süreli" sayılır

export type CalcResult = {
  dailyKwh: number;
  peakW: number;
  inverterKw: number;
  pvKwp: number;
  batteryKwh: number;
  panelCount: number;
  hasMotor: boolean;
  heaters: string[];
};

const round = (n: number, step: number) => Math.ceil(n / step) * step;

/**
 * Aynı anda çalışan en yüksek güç: uzun süre çalışan cihazların toplamı + kısa süreli
 * ağır cihazlardan (kettle, ütü, çamaşır makinesi...) yalnızca en güçlüsü. "together"
 * işaretliyse bütün cihazlar aynı anda çalışıyor sayılır.
 */
function peakPower(active: Device[], together: boolean): number {
  if (together) return active.reduce((s, d) => s + d.watt * d.qty, 0);
  const short = active.filter((d) => d.hours < SHORT_USE_HOURS && d.watt >= 500);
  const long = active.filter((d) => !short.includes(d));
  const base = long.reduce((s, d) => s + d.watt * d.qty, 0);
  const biggestShort = short.reduce((m, d) => Math.max(m, d.watt), 0);
  return base + biggestShort;
}

export function calculate(devices: Device[], season: Season, autonomyDays: number, together = false): CalcResult {
  const active = devices.filter((d) => d.qty > 0 && d.hours > 0);
  const dailyWh = active.reduce((s, d) => s + d.watt * d.qty * d.hours, 0);
  const peakW = peakPower(active, together);
  const dailyKwh = dailyWh / 1000;
  const pvKwp = dailyKwh / (SUN_HOURS[season] * SYSTEM_EFFICIENCY);
  const batteryKwh = (dailyKwh * NIGHT_SHARE * Math.max(1, autonomyDays)) / BATTERY_DOD;
  return {
    dailyKwh,
    peakW,
    inverterKw: (peakW * INVERTER_MARGIN) / 1000,
    pvKwp: round(pvKwp, 0.1),
    batteryKwh: round(batteryKwh, 0.5),
    panelCount: Math.max(1, Math.ceil((pvKwp * 1000) / 600)),
    hasMotor: active.some((d) => d.motor),
    heaters: active.filter((d) => d.heater).map((d) => d.name),
  };
}

export type OffGridPackage = { name: string; href: string; kw: number; threePhase: boolean; price?: number };

/** Gereken invertör gücünü karşılayan en küçük paket (trifaze isteniyorsa trifaze paketler arasından). */
export function pickPackage(pkgs: OffGridPackage[], inverterKw: number, threePhase: boolean): OffGridPackage | null {
  const pool = pkgs.filter((p) => p.threePhase === threePhase).sort((a, b) => a.kw - b.kw);
  return pool.find((p) => p.kw >= inverterKw) ?? null;
}
