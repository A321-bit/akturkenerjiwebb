// "Paketi Tamamla": inverter + batarya paketine panel, montaj seti, solar kablo
// ve MC4 konnektör önerisi. Hesap kuralları burada; arayüz
// components/store/PackageCompleter.tsx. Tekli panel mağazada satışa kapalıdır,
// yalnızca bu bölümden paketle birlikte eklenebilir (fiyatı pasif üründen gelir).

export type PcOption = { label: string; price: number };
export type PcPanel = { key: string; label: string; watt: number; price: number };
export type PcData = {
  panels: PcPanel[];
  defaultPanel: string;
  /** Seçenek etiketleri "10 panel" biçiminde (panel sayısına göre set). */
  trapezSet?: { name: string; options: PcOption[] };
  kiremitSet?: { name: string; options: PcOption[] };
  /** Panel başına fiyat. */
  zemin?: { name: string; price: number };
  /** Seçenek etiketleri "50 metre" biçiminde. */
  cableRed?: { name: string; options: PcOption[] };
  cableBlack?: { name: string; options: PcOption[] };
  mc4?: { name: string; price: number };
};

/** Panel/inverter güç oranı: panel gücü inverter gücünün ~1,1 katı. */
export const DC_RATIO = 1.1;

export function suggestedPanels(inverterKw: number, watt: number): number {
  if (!inverterKw || !watt) return 2;
  return Math.max(2, Math.ceil((inverterKw * 1000 * DC_RATIO) / watt));
}

const firstNumber = (s: string) => parseFloat(s.replace(/\./g, "").replace(",", ".").match(/[\d.]+/)?.[0] ?? "NaN");

/** Panel sayısını karşılayan en ekonomik set kombinasyonu: en büyük setten gerektiği kadar, kalan için en küçük yeterli set. */
export function pickSets(panels: number, options: PcOption[]): { label: string; count: number; price: number }[] {
  const sets = options
    .map((o) => ({ ...o, size: firstNumber(o.label) }))
    .filter((o) => Number.isFinite(o.size) && o.size > 0)
    .sort((a, b) => a.size - b.size);
  if (!sets.length || panels <= 0) return [];
  const biggest = sets[sets.length - 1];
  const out: { label: string; count: number; price: number }[] = [];
  let rest = panels;
  const full = rest > biggest.size ? Math.floor(rest / biggest.size) : 0;
  if (full) {
    out.push({ label: biggest.label, count: full, price: biggest.price });
    rest -= full * biggest.size;
  }
  if (rest > 0) {
    const fit = sets.find((s) => s.size >= rest) ?? biggest;
    const same = out.find((o) => o.label === fit.label);
    if (same) same.count += 1;
    else out.push({ label: fit.label, count: 1, price: fit.price });
  }
  return out;
}

/** Her renk için gereken kablo: panel başına ~2 m, en az 20 m; en kısa yeterli seçenek. */
export function pickCable(panels: number, options: PcOption[]): PcOption | undefined {
  const need = Math.max(20, panels * 2);
  const sorted = options.map((o) => ({ ...o, m: firstNumber(o.label) })).filter((o) => Number.isFinite(o.m)).sort((a, b) => a.m - b.m);
  return sorted.find((o) => o.m >= need) ?? sorted[sorted.length - 1];
}

/** MC4 konnektör seti: her dizi için 2 set (≈10 panel/dizi), en az 4. */
export function mc4Count(panels: number): number {
  return Math.max(4, 2 * Math.ceil(panels / 10));
}
