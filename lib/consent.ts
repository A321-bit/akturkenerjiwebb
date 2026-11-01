// Çerez tercihi. Zorunlu olmayan etiketler yalnızca burada kayıtlı onaya göre yüklenir;
// asıl yükleyici app/layout.tsx içindeki satır içi betiktir (window.__applyConsent).

export const CONSENT_KEY = "aktrk_cerez_tercih";
export const CONSENT_EVENT = "aktrk:cerez-tercih";
export const CONSENT_OPEN_EVENT = "aktrk:cerez-ac";

export type Consent = { analytics: boolean; marketing: boolean; at: string };

declare global {
  interface Window {
    __applyConsent?: (c: Pick<Consent, "analytics" | "marketing">, now?: boolean) => void;
  }
}

// Tarayıcı deposu kapalıysa tercih yalnız bu sayfa açıkken geçerli olur.
let memory: string | null = null;

export function readConsentRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(CONSENT_KEY) ?? memory;
  } catch {
    return memory;
  }
}

export function readConsent(): Consent | null {
  const raw = readConsentRaw();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Consent;
  } catch {
    return null;
  }
}

export const hasConsent = (kind: "analytics" | "marketing") => Boolean(readConsent()?.[kind]);

const TRACKING_COOKIE = /^(_ga|_gid|_gat|_gcl|_fbp|_fbc|_clck|_clsk|CLID|MUID|ANONCHK|MR|SM)/;

function clearTrackingCookies() {
  const parts = location.hostname.split(".");
  const domains = ["", location.hostname, `.${location.hostname}`, `.${parts.slice(-2).join(".")}`];
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0].trim();
    if (!TRACKING_COOKIE.test(name)) continue;
    for (const d of domains) document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ""}`;
  }
}

export function saveConsent(analytics: boolean, marketing: boolean) {
  const before = readConsent();
  const raw = JSON.stringify({ analytics, marketing, at: new Date().toISOString() } satisfies Consent);
  memory = raw;
  try {
    localStorage.setItem(CONSENT_KEY, raw);
  } catch {
    // depo kapalı: bellekte kalır
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
  // Onay geri alındıysa yüklenmiş betikler ancak sayfa yenilenince durur.
  if ((before?.analytics && !analytics) || (before?.marketing && !marketing)) {
    clearTrackingCookies();
    location.reload();
    return;
  }
  window.__applyConsent?.({ analytics, marketing }, true);
}

export const openConsentSettings = () => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
