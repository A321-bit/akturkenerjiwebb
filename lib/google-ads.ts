import { googleAccessToken } from "./google-auth";

// Google Ads API (REST). Servis hesabı (GSC_SERVICE_ACCOUNT) reklam hesabına kullanıcı
// olarak ekli; erişim seviyesi Google Cloud projesine bağlı (geliştirici anahtarı yok).
// Servis hesabı reklam hesabına doğrudan ekli; istekler MCC başlığı olmadan gider.

export const ADS_API_VERSION = process.env.GOOGLE_ADS_API_VERSION ?? "v23";
export const ADS_CUSTOMER = "3342768968"; // Aktürk Enerji Teknoloji
export const ADS_MANAGER = "8592628554"; // AktürkAdsYonetim (MCC)
const SCOPE = "https://www.googleapis.com/auth/adwords";
const API = () => `https://googleads.googleapis.com/${ADS_API_VERSION}`;

async function headers(viaManager = false): Promise<Record<string, string>> {
  return {
    Authorization: `Bearer ${await googleAccessToken(SCOPE)}`,
    "Content-Type": "application/json",
    ...(viaManager ? { "login-customer-id": ADS_MANAGER } : {}),
  };
}

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = Array.isArray(data) ? data[0]?.error : data.error;
    const detail = e?.details?.[0]?.errors?.[0]?.message;
    throw new Error(`Google Ads: ${detail ?? e?.message ?? res.status}`);
  }
  return data as T;
}

/** Servis hesabının erişebildiği reklam hesapları (bağlantı testi). */
export async function accessibleCustomers(): Promise<string[]> {
  const res = await fetch(`${API()}/customers:listAccessibleCustomers`, { headers: await headers(false), cache: "no-store" });
  return (await parse<{ resourceNames?: string[] }>(res)).resourceNames ?? [];
}

/** GAQL sorgusu (searchStream sonuçları düzleştirilir). */
export async function adsQuery<T = Record<string, unknown>>(query: string, customer = ADS_CUSTOMER): Promise<T[]> {
  const res = await fetch(`${API()}/customers/${customer}/googleAds:searchStream`, {
    method: "POST",
    headers: await headers(),
    body: JSON.stringify({ query }),
    cache: "no-store",
  });
  const chunks = await parse<{ results?: T[] }[]>(res);
  return chunks.flatMap((c) => c.results ?? []);
}
