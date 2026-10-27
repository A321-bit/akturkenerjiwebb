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

// Katalog (dinamik) reklamları için: content_ids, Meta kataloğundaki ürün kimliğiyle
// (google-merchant-feed.xml'deki g:id = ürün id) aynı olmalı.
export function trackMetaProduct(event: "ViewContent" | "AddToCart", p: { id: number; name: string; price?: number }) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", event, {
    content_ids: [String(p.id)],
    content_type: "product",
    content_name: p.name,
    ...(p.price != null ? { value: p.price, currency: "TRY" } : {}),
  });
}
