// String (dizi) tasarımı: panel ve invertör katalog değerlerinden dizideki panel sınırları,
// yüzey başına dizi sayısı ve akım/giriş kontrolleri. Değerler ürün veri sayfasından girilir.

export type PanelSpec = { voc: number; vmp: number; isc: number; tcVoc: number };
export type InverterSpec = { vMax: number; mpptMin: number; mpptMax: number; mpptCount: number; stringsPerMppt: number; iMax: number };
export type SiteTemps = { minC: number; maxCellC: number };

export const panelVocCold = (p: PanelSpec, t: SiteTemps) => p.voc * (1 - (Math.abs(p.tcVoc) / 100) * (t.minC - 25));
export const panelVmpHot = (p: PanelSpec, t: SiteTemps) => p.vmp * (1 - (Math.abs(p.tcVoc) / 100) * (t.maxCellC - 25));

export type FaceString = { name: string; panels: number; strings: number; perString: number[]; ok: boolean };
export type StringPlan = { nMin: number; nMax: number; faces: FaceString[]; usedStrings: number; capacity: number; problems: string[] };

export function planStrings(p: PanelSpec, inv: InverterSpec, adet: number, t: SiteTemps, faces: { name: string; panels: number }[]): StringPlan {
  const vocCold = panelVocCold(p, t);
  const vmpHot = panelVmpHot(p, t);
  const nMax = Math.floor(Math.min(inv.vMax, inv.mpptMax / 0.85) / vocCold);
  const nMin = Math.ceil(inv.mpptMin / vmpHot);
  const problems: string[] = [];
  if (nMax < nMin) problems.push("Bu panel ve invertörle uygun dizi uzunluğu yok: gerilim aralıkları uyuşmuyor.");
  const out = faces.filter((f) => f.panels > 0).map((f): FaceString => {
    const strings = Math.max(1, Math.ceil(f.panels / Math.max(1, nMax)));
    const base = Math.floor(f.panels / strings);
    const extra = f.panels % strings;
    const perString = Array.from({ length: strings }, (_, i) => base + (i < extra ? 1 : 0));
    const ok = perString.every((n) => n >= nMin && n <= nMax);
    if (!ok) problems.push(`${f.name}: ${f.panels} panel uygun dizilere bölünemiyor (dizi başına ${nMin}-${nMax} panel olmalı).`);
    return { name: f.name, panels: f.panels, strings, perString, ok };
  });
  const usedStrings = out.reduce((a, f) => a + f.strings, 0);
  const capacity = inv.mpptCount * inv.stringsPerMppt * adet;
  if (usedStrings > capacity) problems.push(`${usedStrings} dizi gerekiyor, invertör girişi ${capacity}.`);
  if (out.length > inv.mpptCount * adet) problems.push(`Farklı yönde ${out.length} yüzey var, MPPT sayısı ${inv.mpptCount * adet}; aynı MPPT'ye farklı yön bağlanması üretimi düşürür.`);
  if (p.isc * 1.25 > inv.iMax) problems.push(`Panel akımı (${(p.isc * 1.25).toFixed(1)} A, güvenlik payıyla) MPPT sınırını (${inv.iMax} A) aşıyor.`);
  return { nMin, nMax, faces: out, usedStrings, capacity, problems };
}
