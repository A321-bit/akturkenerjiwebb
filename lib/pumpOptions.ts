// Türkiye'de tarımsal sulamada satılan dalgıç pompaların gerçek sektör
// standardı güç kademeleri (IEC motor gücü serisine dayanır). 600W panel
// (Tommatech) ve VFD/kalkış kayıplarını karşılayan 1,3x boyutlandırma
// katsayısı, hem anasayfa hem tarımsal sulama sayfasındaki hesaplayıcılarda
// ortak kullanılır.
export const PUMP_OPTIONS = [
  { hp: "1 HP", kw: 0.75 },
  { hp: "1.5 HP", kw: 1.1 },
  { hp: "2 HP", kw: 1.5 },
  { hp: "3 HP", kw: 2.2 },
  { hp: "4 HP", kw: 3 },
  { hp: "5.5 HP", kw: 4 },
  { hp: "7.5 HP", kw: 5.5 },
  { hp: "10 HP", kw: 7.5 },
  { hp: "15 HP", kw: 11 },
  { hp: "20 HP", kw: 15 },
  { hp: "25 HP", kw: 18.5 },
  { hp: "30 HP", kw: 22 },
  { hp: "40 HP", kw: 30 },
  { hp: "50 HP", kw: 37 },
  { hp: "60 HP", kw: 45 },
  { hp: "75 HP", kw: 55 },
  { hp: "100 HP", kw: 75 },
] as const;

export const PUMP_SIZING_FACTOR = 1.3;
export const PUMP_PANEL_WATT = 600;

export function calcPumpSystem(kw: number) {
  const systemSizeKWp = kw * PUMP_SIZING_FACTOR;
  const panelCount = Math.ceil((systemSizeKWp * 1000) / PUMP_PANEL_WATT);
  return { systemSizeKWp, panelCount };
}
