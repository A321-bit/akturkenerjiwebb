"use client";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// Form gönderiminde Meta'nın standart "Lead" olayını tetikler — reklam
// algoritmasının hangi tıklamaların gerçek potansiyel müşteriye dönüştüğünü
// öğrenip reklam hedeflemesini buna göre optimize etmesini sağlar.
export function trackMetaLead(purpose?: string) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", "Lead", purpose ? { content_name: purpose } : undefined);
}
