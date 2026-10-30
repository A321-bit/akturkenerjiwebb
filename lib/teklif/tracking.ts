// Satış ve proje süreci: teklif görüşmesinden geçici kabule kadar tek akış.

export type Tracking = { stage: string; dates: Record<string, string>; followUp?: string; note?: string; lostReason?: string };

export const STAGES = [
  { key: "teklif", ad: "Teklif verildi", grup: "Satış" },
  { key: "gorusme", ad: "Görüşülüyor", grup: "Satış" },
  { key: "kabul", ad: "Kabul edildi", grup: "Satış" },
  { key: "kesif", ad: "Saha keşfi", grup: "Proje" },
  { key: "cagri", ad: "Çağrı mektubu", grup: "Proje" },
  { key: "proje", ad: "Proje onayı", grup: "Proje" },
  { key: "baglanti", ad: "Sistem bağlantı anlaşması", grup: "Proje" },
  { key: "tedarik", ad: "Tedarik", grup: "Proje" },
  { key: "kurulum", ad: "Kurulum ve montaj", grup: "Proje" },
  { key: "kabul-g", ad: "Geçici kabul", grup: "Proje" },
  { key: "tamam", ad: "Tamamlandı", grup: "Bitti" },
  { key: "kayip", ad: "Kaybedildi", grup: "Bitti" },
  { key: "arsiv", ad: "Arşiv", grup: "Bitti" },
] as const;

export const LOST_REASONS = ["Fiyat", "Rakibe gitti", "Vazgeçti", "Çatı uygun değil", "Ulaşılamadı", "Diğer"];
