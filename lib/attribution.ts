"use client";

// Hangi reklam/kaynaktan geldiğini (utm_* parametreleri, Meta/Google tıklama
// kimlikleri) ilk gelişte yakalayıp tarayıcıda saklıyoruz; form gönderiminde
// bu bilgi lead kaydına ekleniyor. "İlk dokunuş" (first-touch) modeli:
// bir kez kaydedilen kaynak, aynı ziyaretçi organik olarak geri dönse bile
// 30 gün boyunca korunur — hangi reklamın gerçek müşteri getirdiğini görebilmek için.

const STORAGE_KEY = "aktrk_attribution";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  adClickId?: string;
  savedAt: number;
};

export function captureAttribution() {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source") ?? undefined;
    const utmMedium = params.get("utm_medium") ?? undefined;
    const utmCampaign = params.get("utm_campaign") ?? undefined;
    const utmContent = params.get("utm_content") ?? undefined;
    const utmTerm = params.get("utm_term") ?? undefined;
    const fbclid = params.get("fbclid") ?? undefined;
    const gclid = params.get("gclid") ?? undefined;

    if (!utmSource && !utmMedium && !utmCampaign && !fbclid && !gclid) return;

    const existing = getAttribution();
    if (existing) return; // ilk dokunuş zaten kayıtlı, üzerine yazma

    // Hangi platformdan geldiğini admin panelde ayırt edebilmek için tıklama
    // kimliğinin başına platform önekini ekliyoruz (ör. "fbclid:AbC123").
    const adClickId = fbclid ? `fbclid:${fbclid}` : gclid ? `gclid:${gclid}` : undefined;

    const attribution: Attribution = {
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      adClickId,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // localStorage kapalıysa (gizli sekme vb.) sessizce yok say
  }
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
  };
}
