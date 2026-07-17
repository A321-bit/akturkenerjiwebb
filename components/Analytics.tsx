"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/track";
import { captureAttribution } from "@/lib/attribution";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export default function Analytics() {
  const pathname = usePathname();
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
  }, []);

  return null;
}
