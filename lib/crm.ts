// Müşteri yönetimi ortak tanımları. Telefon anahtarı, mükerrer kaydı önleyen tek kimliktir.

export const phoneKey = (phone: string | null | undefined) => {
  const d = String(phone ?? "").replace(/\D/g, "").replace(/^0090/, "").replace(/^90(?=\d{10}$)/, "").replace(/^0(?=\d{10}$)/, "");
  return d.length === 10 ? d : null;
};

export const ACTIVITY_KINDS = [
  { key: "arama", ad: "Telefon görüşmesi" },
  { key: "whatsapp", ad: "WhatsApp" },
  { key: "toplanti", ad: "Görüşme / ziyaret" },
  { key: "kesif", ad: "Saha keşfi" },
  { key: "not", ad: "Not" },
  { key: "gorev", ad: "Görev" },
] as const;
export const ACTIVITY_LABEL: Record<string, string> = { ...Object.fromEntries(ACTIVITY_KINDS.map((k) => [k.key, k.ad])), teklif: "Teklif", asama: "Aşama", odeme: "Ödeme" };

export const SEGMENTS = ["Mesken", "İşyeri", "Sanayi", "Tarımsal"];

/** Kaynak: reklam ve form kayıtlarından okunabilir kanal. */
export function channelOf(source: string | null | undefined) {
  const s = (source ?? "").toLowerCase();
  if (!s) return "Bilinmiyor";
  if (/meta|facebook|instagram|fb|ig/.test(s)) return "Meta reklam";
  if (/google|gclid|adwords/.test(s)) return "Google";
  if (/calculator|hesaplama/.test(s)) return "Hesaplama aracı";
  if (/live_chat|canlı/.test(s)) return "Canlı destek";
  if (/tavsiye|referans/.test(s)) return "Tavsiye";
  if (/elle|manuel|teklif/.test(s)) return "Personel girişi";
  return "Web sitesi";
}

/** Satışa dönmüş aşamalar. */
export const WON_STAGES = ["kabul", "kesif", "cagri", "proje", "baglanti", "tedarik", "kurulum", "kabul-g", "tamam"];
export const LOST_STAGES = ["kayip", "arsiv"];
