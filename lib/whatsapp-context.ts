"use client";

import { getAttribution } from "./attribution";
import { CHANNELS, channelDetail, leadChannel, type LeadChannel } from "./lead-source";

// Sitedeki her WhatsApp bağlantısına, mesajın sonuna ziyaretçinin geldiği kanal ve
// (varsa) hesaplayıcıda açtığı raporun özeti eklenir; böylece WhatsApp'a düşen mesajda
// müşterinin reklamdan mı, aramadan mı geldiği ve neye ihtiyaç duyduğu görünür.

const CALC_KEY = "aktrk_calc_summary";
const MARK = "Kaynak:";

/** Hesaplayıcı raporu açıldığında özet saklanır (oturum boyunca WhatsApp mesajına eklenir). */
export function rememberCalculation(summary: string) {
  try {
    sessionStorage.setItem(CALC_KEY, summary.slice(0, 400));
  } catch {
    // gizli sekme vb.
  }
}

export function visitorChannel(): { key: LeadChannel; text: string } {
  const a = getAttribution();
  const fields = {
    source: "whatsapp",
    utm_source: a?.utmSource ?? null,
    utm_medium: a?.utmMedium ?? null,
    utm_campaign: a?.utmCampaign ?? null,
    ad_click_id: a?.adClickId ?? null,
    referrer: a?.referrer ?? null,
  };
  const key = a ? leadChannel(fields) : "unknown";
  const label = CHANNELS.find((c) => c.key === key)?.label ?? "Bilinmiyor";
  const detail = a ? channelDetail(fields) : null;
  return { key, text: [label, detail, a?.landingPage ? `ilk sayfa ${a.landingPage}` : null].filter(Boolean).join(" · ") };
}

/** wa.me bağlantısının hazır mesajına kaynak ve hesap özetini ekler (bir kez). */
export function tagWhatsappHref(href: string): { href: string; channel: LeadChannel } | null {
  try {
    const url = new URL(href, location.href);
    if (!/(^|\.)wa\.me$|api\.whatsapp\.com$/.test(url.hostname)) return null;
    const text = url.searchParams.get("text") ?? "";
    const ch = visitorChannel();
    if (text.includes(MARK)) return { href, channel: ch.key };
    let calc: string | null = null;
    try {
      calc = sessionStorage.getItem(CALC_KEY);
    } catch {
      // oturum deposu kapalı: yalnızca kaynak eklenir
    }
    const extra = [calc ? `Hesaplama: ${calc}` : null, `${MARK} ${ch.text}`].filter(Boolean).join("\n");
    // URLSearchParams boşluğu "+" yapar; WhatsApp'ta "+" olarak kalmasın diye elle kodlanır.
    url.searchParams.delete("text");
    const rest = url.searchParams.toString();
    const msg = encodeURIComponent(text ? `${text}\n\n${extra}` : extra);
    return { href: `${url.origin}${url.pathname}?${rest ? `${rest}&` : ""}text=${msg}`, channel: ch.key };
  } catch {
    return null;
  }
}

/** Form gönderiminden sonra WhatsApp'ı programla açan yerler için: etiketleyip yeni sekmede açar. */
export function openWhatsapp(href: string) {
  window.open(tagWhatsappHref(href)?.href ?? href, "_blank", "noopener,noreferrer");
}
