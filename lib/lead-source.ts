// Web sitesi talebinin geldiği kanal: lead kaydındaki utm_*, ad_click_id ve
// referrer alanlarından okunur (alanları lib/attribution.ts doldurur).

export type LeadSourceFields = {
  source: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  ad_click_id: string | null;
  referrer?: string | null;
};

export type LeadChannel = "google_ads" | "meta_ads" | "search" | "social" | "ai" | "referral" | "direct" | "unknown";

export const CHANNELS: { key: LeadChannel; label: string; color: string }[] = [
  { key: "google_ads", label: "Google Reklam", color: "bg-[#1a73e8]/10 text-[#1a73e8] border-[#1a73e8]/30" },
  { key: "meta_ads", label: "Meta Reklam", color: "bg-[#0866ff]/10 text-[#0866ff] border-[#0866ff]/30" },
  { key: "search", label: "Google Arama (organik)", color: "bg-volt/10 text-volt border-volt/30" },
  { key: "social", label: "Sosyal Medya", color: "bg-[#d62976]/10 text-[#d62976] border-[#d62976]/30" },
  { key: "ai", label: "Yapay Zekâ (ChatGPT vb.)", color: "bg-[#10a37f]/10 text-[#10a37f] border-[#10a37f]/30" },
  { key: "referral", label: "Başka Site", color: "bg-sun/15 text-sun-soft border-sun/40" },
  { key: "direct", label: "Direkt Ziyaret", color: "bg-ink/5 text-ink border-line" },
  { key: "unknown", label: "Bilinmiyor", color: "bg-ink/5 text-slate border-line" },
];

const SEARCH = /^(google|bing|yandex|duckduckgo|yahoo)$/i;
const SOCIAL = /^(ig|fb|instagram|facebook|youtube|x|twitter|linkedin|whatsapp|tiktok)$/i;
const AI = /chatgpt|openai|perplexity|gemini|copilot|^ai$/i;

export function leadChannel(l: LeadSourceFields): LeadChannel {
  const src = (l.utm_source ?? "").trim();
  const med = (l.utm_medium ?? "").toLowerCase();
  const paid = /paid|cpc|ppc|ads/.test(med);
  if (l.ad_click_id?.startsWith("gclid:") || (paid && /google|youtube/i.test(src))) return "google_ads";
  if (l.ad_click_id?.startsWith("fbclid:") || (paid && /^(fb|ig|facebook|instagram|meta)$/i.test(src)) || l.source === "meta_landing") return "meta_ads";
  if (med === "ai" || AI.test(src)) return "ai";
  if (med === "organic" || SEARCH.test(src)) return "search";
  if (med === "social" || SOCIAL.test(src)) return "social";
  if (src === "direct") return "direct";
  if (med === "referral" || src) return "referral";
  return "unknown";
}

/** Kanalın yanında gösterilen ayrıntı: arama motoru, sosyal ağ, kampanya ya da yönlendiren site. */
export function channelDetail(l: LeadSourceFields): string | null {
  const ch = leadChannel(l);
  const parts: string[] = [];
  if (ch === "search" && l.utm_source && !/^google$/i.test(l.utm_source)) parts.push(l.utm_source);
  if ((ch === "social" || ch === "ai" || ch === "referral") && l.utm_source) parts.push(l.utm_source);
  if (l.utm_campaign) parts.push(`Kampanya: ${l.utm_campaign}`);
  if (ch === "meta_ads" && l.utm_source && /^(ig|instagram)$/i.test(l.utm_source)) parts.unshift("Instagram");
  if (ch === "meta_ads" && l.utm_source && /^(fb|facebook)$/i.test(l.utm_source)) parts.unshift("Facebook");
  return parts.length ? parts.join(" · ") : null;
}

export const FORM_TYPES: Record<string, string> = {
  quick_quote: "Hızlı teklif penceresi",
  website: "Teklif / iletişim formu",
  offgrid_calculator: "Off grid hesaplama aracı",
  meta_landing: "Reklam sayfası (/teklif-al)",
};
