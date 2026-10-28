"use client";

// Ziyaretçinin siteye nereden geldiğini (reklam, Google arama, sosyal medya,
// yapay zekâ, direkt) ilk gelişte yakalayıp tarayıcıda saklıyoruz; form
// gönderiminde bu bilgi lead kaydına ekleniyor. "İlk dokunuş" modeli: kaynak
// 30 gün korunur. Tek istisna: önce organik gelip sonra reklama tıklayan
// ziyaretçide reklam kaynağı organiğin üzerine yazılır (reklamın getirdiği
// müşteriyi görebilmek için).

const STORAGE_KEY = "aktrk_attribution";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  adClickId?: string;
  /** Siteye gelmeden önceki dış sayfanın adresi (ör. https://www.google.com/). */
  referrer?: string;
  /** Sitede açılan ilk sayfa (ör. /blog/bag-evi-gunes-enerjisi-fiyatlari). */
  landingPage?: string;
  savedAt: number;
};

// UTM'siz gelişlerde kaynağı yönlendiren siteden çıkarırız (GA4'teki gibi kaynak / ortam).
const REFERRER_RULES: [RegExp, string, string][] = [
  [/(^|\.)google\./, "google", "organic"],
  [/(^|\.)bing\.com$/, "bing", "organic"],
  [/(^|\.)yandex\./, "yandex", "organic"],
  [/(^|\.)duckduckgo\.com$/, "duckduckgo", "organic"],
  [/(^|\.)yahoo\.com$/, "yahoo", "organic"],
  [/(^|\.)(instagram\.com)$/, "instagram", "social"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, "facebook", "social"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube", "social"],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, "x", "social"],
  [/(^|\.)linkedin\.com$/, "linkedin", "social"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "whatsapp", "social"],
  [/(^|\.)(chatgpt\.com|openai\.com)$/, "chatgpt", "ai"],
  [/(^|\.)perplexity\.ai$/, "perplexity", "ai"],
  [/(^|\.)(gemini\.google\.com|copilot\.microsoft\.com)$/, "ai", "ai"],
  [/(^|\.)sahibinden\.com$/, "sahibinden", "referral"],
];

function fromReferrer(ref: string): { utmSource: string; utmMedium: string } | null {
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "");
    if (!host || host.endsWith("akturkenerji.com")) return null; // site içi gezinme kaynak değildir
    for (const [re, source, medium] of REFERRER_RULES) if (re.test(host)) return { utmSource: source, utmMedium: medium };
    return { utmSource: host, utmMedium: "referral" };
  } catch {
    return null;
  }
}

const isPaid = (a: Attribution | null) => Boolean(a?.adClickId || (a?.utmMedium && /paid|cpc|ppc|ads/i.test(a.utmMedium)));

export function captureAttribution() {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get("fbclid") ?? undefined;
    const gclid = params.get("gclid") ?? params.get("gbraid") ?? params.get("wbraid") ?? undefined;
    const hasUtm = ["utm_source", "utm_medium", "utm_campaign"].some((k) => params.get(k));
    const referrer = document.referrer || undefined;
    const fromRef = referrer ? fromReferrer(referrer) : null;

    // Ne reklam parametresi ne de dış bir yönlendiren var: site içi sayfa geçişi ya da direkt yeniden ziyaret.
    if (!hasUtm && !fbclid && !gclid && !fromRef) {
      if (!getAttribution()) save({ utmSource: "direct", utmMedium: "none", landingPage: window.location.pathname, savedAt: Date.now() });
      return;
    }

    const next: Attribution = {
      utmSource: params.get("utm_source") ?? fromRef?.utmSource ?? (gclid ? "google" : fbclid ? "facebook" : undefined),
      utmMedium: params.get("utm_medium") ?? (gclid || fbclid ? "paid" : fromRef?.utmMedium),
      utmCampaign: params.get("utm_campaign") ?? undefined,
      utmContent: params.get("utm_content") ?? undefined,
      utmTerm: params.get("utm_term") ?? undefined,
      // Platformu admin panelde ayırt edebilmek için tıklama kimliğine önek eklenir (ör. "fbclid:AbC123").
      adClickId: fbclid ? `fbclid:${fbclid}` : gclid ? `gclid:${gclid}` : undefined,
      referrer,
      landingPage: window.location.pathname,
      savedAt: Date.now(),
    };

    const existing = getAttribution();
    // İlk dokunuş korunur; yalnızca reklamsız kayıt yeni bir reklam tıklamasıyla güncellenir,
    // "direkt" kayıt da sonradan gelinen gerçek kaynakla değiştirilir.
    if (existing && existing.utmSource !== "direct" && (isPaid(existing) || !isPaid(next))) return;
    save(next);
  } catch {
    // localStorage kapalıysa (gizli sekme vb.) sessizce yok say
  }
}

function save(a: Attribution) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
}

export function getAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attribution;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

// Lead formlarının /api/lead'e gönderdiği gövdeye eklenecek ortak alanlar.
export function buildLeadAttributionFields(formPage: string) {
  const attribution = getAttribution();
  return {
    formPage,
    utmSource: attribution?.utmSource,
    utmMedium: attribution?.utmMedium,
    utmCampaign: attribution?.utmCampaign,
    utmContent: attribution?.utmContent,
    utmTerm: attribution?.utmTerm,
    adClickId: attribution?.adClickId,
    referrer: attribution?.referrer,
    landingPage: attribution?.landingPage,
  };
}
