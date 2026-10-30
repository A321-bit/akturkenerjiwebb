"use client";

import { useEffect, useRef } from "react";
import { usePagePath } from "@/lib/use-page-path";
import { trackEvent } from "@/lib/track";
import { captureAttribution } from "@/lib/attribution";
import { tagWhatsappHref } from "@/lib/whatsapp-context";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export default function Analytics() {
  const pathname = usePagePath();
  const isFirstPageview = useRef(true);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    trackEvent("pageview", pathname);

    // Meta Pixel'in temel kodu ilk sayfa yüklemesinde zaten kendi
    // PageView'ini gönderiyor; burada sadece sonraki (SPA) sayfa
    // geçişlerinde tekrar tetikliyoruz ki her sayfa ayrı ayrı sayılsın.
    if (isFirstPageview.current) {
      isFirstPageview.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  useEffect(() => {
    captureAttribution();
    // Meta reklamlarının "mesaj atan / arayan kişi"ye göre optimize olabilmesi için
    // sitedeki her WhatsApp ve telefon linki Piksel'e standart "Contact" olayı gönderir.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || location.pathname.startsWith("/admin")) return;
      const href = a.getAttribute("href") ?? "";
      if (/wa\.me|api\.whatsapp\.com|whatsapp:/.test(href)) {
        window.fbq?.("track", "Contact", { content_name: "whatsapp" });
        // Mesaja kaynak ve hesap özeti eklenir; tıklama kanalıyla birlikte ayrıca kaydedilir.
        const tagged = tagWhatsappHref(href);
        if (tagged) {
          a.setAttribute("href", tagged.href);
          trackEvent("click", location.pathname, `wa_src:${tagged.channel}`);
        }
      }
      else if (href.startsWith("tel:")) window.fbq?.("track", "Contact", { content_name: "telefon" });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
