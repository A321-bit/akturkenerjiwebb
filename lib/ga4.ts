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
