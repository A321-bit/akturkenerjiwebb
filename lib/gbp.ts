import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { adminClient } from "@/lib/data";

// Google İşletme Profili API: OAuth bağlantısı (yenileme anahtarı şifreli olarak
// integration_tokens tablosunda), işletmeler, yorumlar, gönderiler ve performans.
// Yayınlama işlemleri yalnızca admin panelden kullanıcı tıklamasıyla yapılır.

const SCOPE = "https://www.googleapis.com/auth/business.manage";
const PROVIDER = "google_business";
export const GBP_REDIRECT_URI = "https://akturkenerji.com/api/admin/gbp/callback";
const STATE_TTL = 10 * 60e3;

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("ADMIN_SESSION_SECRET tanımlı değil.");
  return s;
}

function oauthClient() {
  const id = process.env.GBP_OAUTH_CLIENT_ID;
  const sec = process.env.GBP_OAUTH_CLIENT_SECRET;
  if (!id || !sec) throw new Error("GBP_OAUTH_CLIENT_ID / GBP_OAUTH_CLIENT_SECRET tanımlı değil.");
  return { id, sec };
}

// --- Şifreleme (AES-256-GCM) ---
const aesKey = () => createHash("sha256").update(`gbp-token:${secret()}`).digest();

function encrypt(plain: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", aesKey(), iv);
  const data = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), data]).toString("base64url");
}

function decrypt(enc: string) {
  const raw = Buffer.from(enc, "base64url");
  const d = createDecipheriv("aes-256-gcm", aesKey(), raw.subarray(0, 12));
  d.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString("utf8");
}

// --- OAuth durum (state): oturum açmış adminin başlattığını kanıtlayan imzalı değer ---
const sign = (v: string) => createHmac("sha256", secret()).update(`gbp-state:${v}`).digest("base64url");

export function createState() {
  const nonce = randomBytes(16).toString("base64url");
  const value = `${nonce}.${Date.now()}`;
  return { state: `${value}.${sign(value)}`, nonce };
}

export function verifyState(state: string | null, nonceCookie: string | undefined) {
  if (!state || !nonceCookie) return false;
  const [nonce, at, sig] = state.split(".");
  if (!nonce || !at || !sig || nonce !== nonceCookie) return false;
  if (Date.now() - Number(at) > STATE_TTL) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(`${nonce}.${at}`));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function authUrl(state: string) {
  const q = new URLSearchParams({
    client_id: oauthClient().id,
    redirect_uri: GBP_REDIRECT_URI,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}

export async function exchangeCode(code: string) {
  const { id, sec } = oauthClient();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: id, client_secret: sec, redirect_uri: GBP_REDIRECT_URI, grant_type: "authorization_code" }),
    cache: "no-store",
  });
  const body = await res.json();
  if (!res.ok || !body.refresh_token) throw new Error(body.error_description ?? body.error ?? "Google yenileme anahtarı vermedi.");
  const { error } = await adminClient()
    .from("integration_tokens")
    .upsert({ provider: PROVIDER, token_enc: encrypt(body.refresh_token), updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

export async function isConnected() {
  const { data } = await adminClient().from("integration_tokens").select("updated_at").eq("provider", PROVIDER).maybeSingle();
  return data ? { connectedAt: data.updated_at as string } : null;
}

export async function disconnect() {
  await adminClient().from("integration_tokens").delete().eq("provider", PROVIDER);
}

let cached: { token: string; exp: number } | null = null;

async function accessToken() {
  if (cached && cached.exp > Date.now() + 60e3) return cached.token;
  const { data } = await adminClient().from("integration_tokens").select("token_enc").eq("provider", PROVIDER).maybeSingle();
  if (!data) throw new Error("Google İşletme hesabı bağlı değil.");
  const { id, sec } = oauthClient();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ refresh_token: decrypt(data.token_enc), client_id: id, client_secret: sec, grant_type: "refresh_token" }),
    cache: "no-store",
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Google oturumu yenilenemedi: ${body.error_description ?? body.error ?? res.status}`);
  cached = { token: body.access_token, exp: Date.now() + body.expires_in * 1000 };
  return cached.token;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (res.status === 204) return {} as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error?.message ?? `Google API hatası (${res.status})`);
  return body as T;
}

// --- İşletmeler ---
export type GbpLocation = { account: string; name: string; title: string; address?: string; phone?: string; website?: string; mapsUri?: string };

type RawLocation = {
  name: string;
  title: string;
  phoneNumbers?: { primaryPhone?: string };
  websiteUri?: string;
  storefrontAddress?: { addressLines?: string[]; locality?: string; administrativeArea?: string };
  metadata?: { mapsUri?: string };
};

export async function listLocations(): Promise<GbpLocation[]> {
  const { accounts = [] } = await api<{ accounts?: { name: string }[] }>("https://mybusinessaccountmanagement.googleapis.com/v1/accounts");
  const out: GbpLocation[] = [];
  for (const a of accounts) {
    const readMask = "name,title,phoneNumbers,websiteUri,storefrontAddress,metadata";
    const { locations = [] } = await api<{ locations?: RawLocation[] }>(`https://mybusinessbusinessinformation.googleapis.com/v1/${a.name}/locations?readMask=${readMask}&pageSize=100`);
    for (const l of locations) {
      const addr = l.storefrontAddress;
      out.push({
        account: a.name,
        name: l.name,
        title: l.title,
        phone: l.phoneNumbers?.primaryPhone,
        website: l.websiteUri,
        mapsUri: l.metadata?.mapsUri,
        address: addr ? [...(addr.addressLines ?? []), addr.locality, addr.administrativeArea].filter(Boolean).join(", ") : undefined,
      });
    }
  }
  return out;
}

// --- Yorumlar ---
export type GbpReview = {
  name: string;
  author: string;
  photo?: string;
  stars: number;
  comment?: string;
  createTime: string;
  reply?: { comment: string; updateTime: string };
};

const STARS: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

type RawReview = {
  name: string;
  reviewer?: { displayName?: string; profilePhotoUrl?: string };
  starRating?: string;
  comment?: string;
  createTime: string;
  reviewReply?: { comment: string; updateTime: string };
};

export async function listReviews(account: string, location: string) {
  // Google sayfa başına en fazla 50 yorum verir; tüm sayfalar alınır (en fazla 500 yorum).
  const all: RawReview[] = [];
  let pageToken: string | undefined;
  let d: { reviews?: RawReview[]; averageRating?: number; totalReviewCount?: number; nextPageToken?: string } = {};
  for (let i = 0; i < 10; i++) {
    const q = new URLSearchParams({ pageSize: "50", orderBy: "updateTime desc" });
    if (pageToken) q.set("pageToken", pageToken);
    d = await api(`https://mybusiness.googleapis.com/v4/${account}/${location}/reviews?${q}`);
    all.push(...(d.reviews ?? []));
    pageToken = d.nextPageToken;
    if (!pageToken) break;
  }
  return {
    average: d.averageRating ?? null,
    total: d.totalReviewCount ?? 0,
    reviews: all.map(
      (r): GbpReview => ({
        name: r.name,
        author: r.reviewer?.displayName ?? "Google kullanıcısı",
        photo: r.reviewer?.profilePhotoUrl,
        stars: STARS[r.starRating ?? ""] ?? 0,
        // Google çevirili yorumlarda aslını "(Original)" bölümüne koyar; yalnız ilk kısım gösterilir.
        comment: r.comment?.split("\n\n(Translated by Google)")[0],
        createTime: r.createTime,
        reply: r.reviewReply,
      })
    ),
  };
}

export const replyReview = (reviewName: string, comment: string) => api(`https://mybusiness.googleapis.com/v4/${reviewName}/reply`, { method: "PUT", body: JSON.stringify({ comment }) });
export const deleteReply = (reviewName: string) => api(`https://mybusiness.googleapis.com/v4/${reviewName}/reply`, { method: "DELETE" });

// --- Gönderiler ---
export type GbpPost = { name: string; summary?: string; createTime: string; state?: string; searchUrl?: string; photo?: string; ctaUrl?: string };

type RawPost = {
  name: string;
  summary?: string;
  createTime: string;
  state?: string;
  searchUrl?: string;
  media?: { googleUrl?: string; sourceUrl?: string }[];
  callToAction?: { url?: string };
};

export async function listPosts(account: string, location: string): Promise<GbpPost[]> {
  const { localPosts = [] } = await api<{ localPosts?: RawPost[] }>(`https://mybusiness.googleapis.com/v4/${account}/${location}/localPosts?pageSize=20`);
  return localPosts.map((p) => ({ name: p.name, summary: p.summary, createTime: p.createTime, state: p.state, searchUrl: p.searchUrl, photo: p.media?.[0]?.googleUrl ?? p.media?.[0]?.sourceUrl, ctaUrl: p.callToAction?.url }));
}

export function createPost(account: string, location: string, p: { summary: string; url?: string; photoUrl?: string }) {
  return api(`https://mybusiness.googleapis.com/v4/${account}/${location}/localPosts`, {
    method: "POST",
    body: JSON.stringify({
      languageCode: "tr",
      topicType: "STANDARD",
      summary: p.summary,
      ...(p.url ? { callToAction: { actionType: "LEARN_MORE", url: p.url } } : {}),
      ...(p.photoUrl ? { media: [{ mediaFormat: "PHOTO", sourceUrl: p.photoUrl }] } : {}),
    }),
  });
}

export const deletePost = (postName: string) => api(`https://mybusiness.googleapis.com/v4/${postName}`, { method: "DELETE" });

// --- Performans ---
const METRICS = [
  "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
  "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
  "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
  "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
  "CALL_CLICKS",
  "WEBSITE_CLICKS",
  "BUSINESS_DIRECTION_REQUESTS",
] as const;

type RawSeries = { dailyMetric: string; timeSeries?: { datedValues?: { date: { year: number; month: number; day: number }; value?: string }[] } };

const addRange = (q: URLSearchParams, prefix: string, d: Date) => {
  q.set(`${prefix}.year`, String(d.getUTCFullYear()));
  q.set(`${prefix}.month`, String(d.getUTCMonth() + 1));
  q.set(`${prefix}.day`, String(d.getUTCDate()));
};

/** Son `days` gün + önceki `days` gün: günlük seriler (Google verisi birkaç gün gecikmelidir). */
export async function performance(location: string, days = 28) {
  const end = new Date(Date.now() - 864e5);
  // Gecikmeli günler atılacağı için birkaç gün fazla istenir.
  const start = new Date(end.getTime() - (days * 2 + 6) * 864e5);
  const q = new URLSearchParams();
  METRICS.forEach((m) => q.append("dailyMetrics", m));
  addRange(q, "dailyRange.startDate", start);
  addRange(q, "dailyRange.endDate", end);
  const d = await api<{ multiDailyMetricTimeSeries?: { dailyMetricTimeSeries?: RawSeries[] }[] }>(`https://businessprofileperformance.googleapis.com/v1/${location}:fetchMultiDailyMetricsTimeSeries?${q}`);
  const series = d.multiDailyMetricTimeSeries?.flatMap((x) => x.dailyMetricTimeSeries ?? []) ?? [];

  const byDay = new Map<string, Record<string, number>>();
  for (const s of series)
    for (const v of s.timeSeries?.datedValues ?? []) {
      const key = `${v.date.year}-${String(v.date.month).padStart(2, "0")}-${String(v.date.day).padStart(2, "0")}`;
      const row = byDay.get(key) ?? {};
      row[s.dailyMetric] = Number(v.value ?? 0);
      byDay.set(key, row);
    }
  const rows = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, r]) => ({
    date,
    search: (r.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH ?? 0) + (r.BUSINESS_IMPRESSIONS_MOBILE_SEARCH ?? 0),
    maps: (r.BUSINESS_IMPRESSIONS_DESKTOP_MAPS ?? 0) + (r.BUSINESS_IMPRESSIONS_MOBILE_MAPS ?? 0),
    calls: r.CALL_CLICKS ?? 0,
    website: r.WEBSITE_CLICKS ?? 0,
    directions: r.BUSINESS_DIRECTION_REQUESTS ?? 0,
  }));
  // Google'ın henüz işlemediği son günler sıfır gelir; grafiği ve karşılaştırmayı bozmasın.
  while (rows.length && !rows[rows.length - 1].search && !rows[rows.length - 1].maps) rows.pop();
  return { rows: rows.slice(-days * 2), days };
}

/** Son tam ayların arama terimleri (Google düşük hacimlileri "<15" olarak verir). */
export async function searchKeywords(location: string) {
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1));
  const q = new URLSearchParams({
    "monthlyRange.startMonth.year": String(start.getUTCFullYear()),
    "monthlyRange.startMonth.month": String(start.getUTCMonth() + 1),
    "monthlyRange.endMonth.year": String(end.getUTCFullYear()),
    "monthlyRange.endMonth.month": String(end.getUTCMonth() + 1),
    pageSize: "50",
  });
  const d = await api<{ searchKeywordsCounts?: { searchKeyword: string; insightsValue?: { value?: string; threshold?: string } }[] }>(`https://businessprofileperformance.googleapis.com/v1/${location}/searchkeywords/impressions/monthly?${q}`);
  return (d.searchKeywordsCounts ?? []).map((k) => ({ keyword: k.searchKeyword, value: k.insightsValue?.value ? Number(k.insightsValue.value) : null, threshold: k.insightsValue?.threshold ? Number(k.insightsValue.threshold) : null }));
}
