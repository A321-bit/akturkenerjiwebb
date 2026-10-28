"use client";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// Form gönderiminde GA4'ün standart "generate_lead" event'ini ve Meta Pikseli'nin "Lead" olayını tetikler.
// Bu event GA4'te key event olarak işaretlenip Google Ads'e aktarıldığında,
// reklam kampanyalarının teklif algoritması gerçek lead verisine göre
// optimize olabilir hale gelir (aksi halde Ads'in dönüşüm sinyali hiç yoktur).
export function trackGa4Lead(purpose?: string) {
  if (typeof window === "undefined") return;
  window.fbq?.("track", "Lead", purpose ? { content_category: purpose } : undefined);
  window.gtag?.("event", "generate_lead", purpose ? { lead_type: purpose } : undefined);
}

// Google Ads'in kendi "Fiyat teklifi isteyin" dönüşüm işlemi, GA4'ten ayrı
// bir etiket bekliyor — generate_lead event'i GA4'e düşse bile Ads bunu
// otomatik almaz, bu event'in ayrıca gönderilmesi gerekiyor. Ads > Hedefler >
// Fiyat teklifi isteyin > Yönet > Etkinlik snippet'i üzerinden alınan
// AW-ID/etiket çifti (18330659140 / e5yjCPPtnNIcEMTS3qRE).
export function trackGoogleAdsLead() {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "conversion", { send_to: "AW-18330659140/e5yjCPPtnNIcEMTS3qRE" });
}

// WhatsApp ve "Hemen Ara" tıklamaları da birer dönüşüm niyeti taşıyor —
// form doldurmadan doğrudan iletişime geçen kullanıcıları da Ads'in
// teklif algoritmasına dahil edebilmek için ayrı event adlarıyla gönderiyoruz.
// (Meta Pikseli'nin "Contact" olayı components/Analytics.tsx'te bütün WhatsApp/telefon linklerinden gider.)
// Ads'teki GA4 dönüşümlerinin sayımı "her tıklamada birden çok" ve API'den
// değiştirilemiyor; aynı ziyaretçinin tekrar tekrar dokunması dönüşümü
// şişirmesin diye her event oturum başına bir kez gönderilir.
function sendOncePerSession(name: string) {
  if (typeof window === "undefined") return;
  try {
    const key = `ga4_sent_${name}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {}
  window.gtag?.("event", name);
}

export function trackGa4WhatsappClick() {
  sendOncePerSession("whatsapp_click");
}

export function trackGa4CallClick() {
  sendOncePerSession("phone_call_click");
}
