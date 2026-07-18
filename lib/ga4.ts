"use client";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// Form gönderiminde GA4'ün standart "generate_lead" event'ini tetikler.
// Bu event GA4'te key event olarak işaretlenip Google Ads'e aktarıldığında,
// reklam kampanyalarının teklif algoritması gerçek lead verisine göre
// optimize olabilir hale gelir (aksi halde Ads'in dönüşüm sinyali hiç yoktur).
export function trackGa4Lead(purpose?: string) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "generate_lead", purpose ? { lead_type: purpose } : undefined);
}

// WhatsApp ve "Hemen Ara" tıklamaları da birer dönüşüm niyeti taşıyor —
// form doldurmadan doğrudan iletişime geçen kullanıcıları da Ads'in
// teklif algoritmasına dahil edebilmek için ayrı event adlarıyla gönderiyoruz.
export function trackGa4WhatsappClick() {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "whatsapp_click");
}

export function trackGa4CallClick() {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "phone_call_click");
}
