"use client";

export function trackEvent(type: "pageview" | "click", path: string, label?: string) {
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
