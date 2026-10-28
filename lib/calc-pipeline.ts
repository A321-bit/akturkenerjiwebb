// Hesaplama taleplerinin satış aşamaları ve sıcaklık (skor) bantları; admin listesi ve API ortak kullanır.

export const CALC_STAGES = ["Yeni", "Arandı", "Keşif Planlandı", "Teklif Verildi", "Satış", "Olumsuz"] as const;
export type CalcStage = (typeof CALC_STAGES)[number];

export const CALC_TYPES: Record<string, string> = {
  on_grid: "On grid",
  off_grid: "Off grid",
  sulama: "Tarımsal sulama",
  isi_pompasi: "Isı pompası",
};

export function heat(score: number | null): { label: string; color: string } {
  const s = score ?? 0;
  if (s >= 70) return { label: "Sıcak", color: "bg-red-500/10 text-red-600 border-red-500/30" };
  if (s >= 40) return { label: "Ilık", color: "bg-sun/15 text-sun-soft border-sun/40" };
  return { label: "Soğuk", color: "bg-[#3f74c4]/10 text-[#3f74c4] border-[#3f74c4]/30" };
}
