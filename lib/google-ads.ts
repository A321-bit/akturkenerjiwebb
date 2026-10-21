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

// ───────────────────────── Rapor ─────────────────────────

const micros = (v?: string | number) => Number(v ?? 0) / 1e6;
const ymd = (d: Date) => d.toISOString().slice(0, 10);

type Row = {
  campaign?: { id: string; name: string; status: string; primaryStatus?: string; advertisingChannelType?: string; campaignBudget?: string };
  campaignBudget?: { amountMicros?: string };
  metrics?: { costMicros?: string; clicks?: string; impressions?: string; conversions?: number };
  segments?: { date?: string; conversionActionName?: string };
  searchTermView?: { searchTerm?: string };
};

const m = (r: Row) => ({
  cost: micros(r.metrics?.costMicros),
  clicks: Number(r.metrics?.clicks ?? 0),
  impressions: Number(r.metrics?.impressions ?? 0),
  conversions: Number(r.metrics?.conversions ?? 0),
});

/** Son N gün (dün dahil): kampanyalar (durum, bütçe, performans), günlük, dönüşüm türleri, arama terimleri. */
export async function googleAdsReport(days: number) {
  const now = new Date(Date.now() + 3 * 3600000);
  const end = new Date(now.getTime() - 86400000);
  const start = new Date(end.getTime() - (days - 1) * 86400000);
  const range = `segments.date BETWEEN '${ymd(start)}' AND '${ymd(end)}'`;
  const [list, perf, daily, actions, terms] = await Promise.all([
    adsQuery<Row>(
      "SELECT campaign.id, campaign.name, campaign.status, campaign.primary_status, campaign.advertising_channel_type, campaign.campaign_budget, campaign_budget.amount_micros FROM campaign WHERE campaign.status != 'REMOVED'",
    ),
    adsQuery<Row>(`SELECT campaign.id, metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions FROM campaign WHERE ${range}`),
    adsQuery<Row>(`SELECT segments.date, metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions FROM customer WHERE ${range}`),
    adsQuery<Row>(`SELECT segments.conversion_action_name, metrics.conversions FROM customer WHERE ${range}`),
    adsQuery<Row>(
      `SELECT search_term_view.search_term, metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions FROM search_term_view WHERE ${range} ORDER BY metrics.cost_micros DESC LIMIT 30`,
    ),
  ]);
  const perfById = new Map<string, ReturnType<typeof m>>();
  for (const r of perf) {
    const id = r.campaign!.id;
    const cur = perfById.get(id) ?? { cost: 0, clicks: 0, impressions: 0, conversions: 0 };
    const x = m(r);
    perfById.set(id, { cost: cur.cost + x.cost, clicks: cur.clicks + x.clicks, impressions: cur.impressions + x.impressions, conversions: cur.conversions + x.conversions });
  }
  const campaigns = list
    .map((r) => ({
      id: r.campaign!.id,
      name: r.campaign!.name,
      status: r.campaign!.status,
      primaryStatus: r.campaign!.primaryStatus ?? "",
      type: r.campaign!.advertisingChannelType ?? "",
      budgetResource: r.campaign!.campaignBudget ?? "",
      dailyBudget: micros(r.campaignBudget?.amountMicros),
      ...(perfById.get(r.campaign!.id) ?? { cost: 0, clicks: 0, impressions: 0, conversions: 0 }),
    }))
    .sort((a, b) => (a.status === b.status ? b.cost - a.cost : a.status === "ENABLED" ? -1 : 1));
  const total = campaigns.reduce(
    (s, c) => ({ cost: s.cost + c.cost, clicks: s.clicks + c.clicks, impressions: s.impressions + c.impressions, conversions: s.conversions + c.conversions }),
    { cost: 0, clicks: 0, impressions: 0, conversions: 0 },
  );
  const byAction = new Map<string, number>();
  for (const r of actions) {
    const k = r.segments?.conversionActionName ?? "";
    byAction.set(k, (byAction.get(k) ?? 0) + Number(r.metrics?.conversions ?? 0));
  }
  return {
    days,
    from: ymd(start),
    to: ymd(end),
    total,
    campaigns,
    daily: daily.map((r) => ({ date: r.segments?.date ?? "", ...m(r) })).sort((a, b) => a.date.localeCompare(b.date)),
    conversionActions: [...byAction].map(([label, value]) => ({ label, value })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value),
    searchTerms: terms.map((r) => ({ term: r.searchTermView?.searchTerm ?? "", ...m(r) })),
  };
}

export type GoogleAdsApiReport = Awaited<ReturnType<typeof googleAdsReport>>;

// ───────────────────────── Yönetim ─────────────────────────

/** Toplu değişiklik (campaigns, adGroupCriteria, campaignCriteria, adGroupAds…). */
export async function adsMutate(path: string, operations: unknown[]) {
  const res = await fetch(`${API()}/customers/${ADS_CUSTOMER}/${path}:mutate`, {
    method: "POST",
    headers: await headers(),
    body: JSON.stringify({ operations }),
    cache: "no-store",
  });
  return parse<{ results?: { resourceName: string }[] }>(res);
}

/** Kampanyayı durdurur / yeniden açar. */
export function setCampaignStatus(campaignId: string, status: "ENABLED" | "PAUSED") {
  if (!/^\d+$/.test(campaignId)) throw new Error("Geçersiz kampanya.");
  return adsMutate("campaigns", [{ update: { resourceName: `customers/${ADS_CUSTOMER}/campaigns/${campaignId}`, status }, updateMask: "status" }]);
}

/** Kampanya bütçesini (günlük, TL) değiştirir. */
export function setDailyBudget(budgetResource: string, amountTl: number) {
  if (!budgetResource.startsWith(`customers/${ADS_CUSTOMER}/campaignBudgets/`)) throw new Error("Geçersiz bütçe.");
  if (!(amountTl >= 10 && amountTl <= 5000)) throw new Error("Günlük bütçe 10–5.000 TL arasında olmalı.");
  return adsMutate("campaignBudgets", [
    { update: { resourceName: budgetResource, amountMicros: String(Math.round(amountTl * 100) * 10000) }, updateMask: "amount_micros" },
  ]);
}

/** Birden çok kaynak türünü tek atomik istekte değiştirir (geçici negatif kimliklerle birbirine bağlanır). */
export async function adsBatch(mutateOperations: unknown[], validateOnly = false) {
  const res = await fetch(`${API()}/customers/${ADS_CUSTOMER}/googleAds:mutate`, {
    method: "POST",
    headers: await headers(),
    body: JSON.stringify({ mutateOperations, validateOnly }),
    cache: "no-store",
  });
  return parse<{ mutateOperationResponses?: Record<string, { resourceName?: string }>[] }>(res);
}
