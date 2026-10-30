"use client";

// İletişim tıklamaları (WhatsApp, telefon) oturum başına bir kez kaydedilir: reklam ağı sitelerinden
// gelen bot trafiği aynı butona dakikada onlarca kez basıp sayıları şişiriyordu.
const ONCE_PER_SESSION = /whatsapp|wa_src:|call_button|phone/;

function seenThisSession(label: string) {
  try {
    const key = `aktrk_click_${label}`;
    if (sessionStorage.getItem(key)) return true;
    sessionStorage.setItem(key, "1");
  } catch {
    // oturum deposu kapalıysa her tıklama kaydedilir
  }
  return false;
}

export function trackEvent(type: "pageview" | "click", path: string, label?: string) {
  if (type === "click" && label && ONCE_PER_SESSION.test(label) && seenThisSession(label)) return;
  try {
    const body = JSON.stringify({
      type,
      path,
      label,
      referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
    });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/track", blob);
    } else {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // sessizce yok say — analitik asla kullanıcı deneyimini bozmamalı
  }
}
