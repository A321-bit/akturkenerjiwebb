// Meta reklam hesabı raporu (Marketing API, salt okuma). Aynı sistem kullanıcısı
// anahtarı (META_ACCESS_TOKEN) kullanılır; anahtarda ads_read izni olmalı.

const GRAPH = "https://graph.facebook.com/v23.0";
export const AD_ACCOUNT = "act_188346112";

export type AdsPeriod = "last_7d" | "last_14d" | "last_28d" | "last_90d" | "this_month" | "last_month";

type Action = { action_type: string; value: string };
type InsightRow = {
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  inline_link_clicks?: string;
  frequency?: string;
  actions?: Action[];
  date_start?: string;
  campaign_id?: string;
  campaign_name?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  age?: string;
  gender?: string;
  region?: string;
  publisher_platform?: string;
  platform_position?: string;
};

export type Metrics = {
  spend: number;
  impressions: number;
  reach: number;
  linkClicks: number;
  frequency: number;
  /** Form (anlık form + pikseldeki Lead) */
  leads: number;
  /** Messenger / WhatsApp / Instagram mesajı başlatma */
  messages: number;
  /** Pikseldeki Contact (WhatsApp / telefon tıklaması) */
  contacts: number;
};
export type Row<T = object> = Metrics & T;

async function graph<T>(path: string, params: Record<string, string>): Promise<T> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error("META_ACCESS_TOKEN ortam değişkeni tanımlı değil.");
  const res = await fetch(`${GRAPH}/${path}?${new URLSearchParams({ ...params, access_token: token })}`, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(`Meta: ${data.error?.message ?? res.status}`);
  return data as T;
}

const num = (s?: string) => (s ? Number(s) : 0);
const act = (a: Action[] | undefined, ...types: string[]) => {
  for (const t of types) {
    const hit = a?.find((x) => x.action_type === t);
    if (hit) return Number(hit.value);
  }
  return 0;
};

function metrics(r: InsightRow): Metrics {
  return {
    spend: num(r.spend),
    impressions: num(r.impressions),
    reach: num(r.reach),
    linkClicks: num(r.inline_link_clicks),
    frequency: num(r.frequency),
    leads: act(r.actions, "lead", "onsite_conversion.lead_grouped", "offsite_conversion.fb_pixel_lead"),
    messages: act(r.actions, "onsite_conversion.messaging_conversation_started_7d"),
    contacts: act(r.actions, "contact_total", "offsite_conversion.fb_pixel_contact", "contact"),
  };
}

const BASE = "spend,impressions,reach,inline_link_clicks,frequency,actions";

async function insights(params: Record<string, string>): Promise<InsightRow[]> {
  const out = await graph<{ data: InsightRow[] }>(`${AD_ACCOUNT}/insights`, { limit: "200", ...params });
  return out.data;
}

/** Dönemin günleri (TR saati) → [{since, until}] (Meta en fazla 90 gün aralık kabul ediyor). */
function dayRanges(period: AdsPeriod) {
  const today = new Date(Date.now() + 3 * 3600000);
  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  const day = (offset: number) => new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - offset));
  let start: Date;
  let end = day(1);
  if (period === "this_month") {
    start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    end = day(0);
  } else if (period === "last_month") {
    start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
    end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0));
  } else {
    start = day(Number(period.match(/\d+/)![0]));
  }
  const out = [];
  for (let d = start; d <= end; d = new Date(d.getTime() + 86400000)) out.push({ since: ymd(d), until: ymd(d) });
  return out;
}

type Campaign = { id: string; name: string; effective_status: string; objective: string; daily_budget?: string; lifetime_budget?: string; start_time?: string };
type Ad = { id: string; name: string; effective_status: string; creative?: { thumbnail_url?: string; title?: string; body?: string } };

export async function adsReport(period: AdsPeriod) {
  const p = { date_preset: period };
  const [total, daily, byCampaign, byAd, demo, regions, placements, campaigns, ads] = await Promise.all([
    insights({ ...p, fields: BASE }),
    // time_increment=1 günlük harcamayı 0 döndürüyor; her gün ayrı aralık (time_ranges) olarak istenir.
    insights({ fields: "spend,impressions,inline_link_clicks,actions", time_ranges: JSON.stringify(dayRanges(period)) }),
    insights({ ...p, fields: `campaign_id,campaign_name,${BASE}`, level: "campaign" }),
    insights({ ...p, fields: `ad_id,ad_name,adset_name,campaign_name,${BASE}`, level: "ad" }),
    insights({ ...p, fields: BASE, breakdowns: "age,gender" }),
    insights({ ...p, fields: BASE, breakdowns: "region" }),
    insights({ ...p, fields: BASE, breakdowns: "publisher_platform,platform_position" }),
    graph<{ data: Campaign[] }>(`${AD_ACCOUNT}/campaigns`, { fields: "name,effective_status,objective,daily_budget,lifetime_budget,start_time", limit: "100" }),
    graph<{ data: Ad[] }>(`${AD_ACCOUNT}/ads`, { fields: "name,effective_status,creative{thumbnail_url,title,body}", limit: "200" }),
  ]);
  const campaignInfo = new Map(campaigns.data.map((c) => [c.id, c]));
  const adInfo = new Map(ads.data.map((a) => [a.id, a]));
  const GENDER: Record<string, string> = { male: "Erkek", female: "Kadın", unknown: "Belirsiz" };

  return {
    period,
    total: total[0] ? metrics(total[0]) : metrics({}),
    daily: daily.map((r) => ({ date: r.date_start ?? "", ...metrics(r) })).sort((a, b) => a.date.localeCompare(b.date)),
    campaigns: byCampaign
      .map((r) => {
        const c = campaignInfo.get(r.campaign_id ?? "");
        return {
          id: r.campaign_id ?? "",
          name: r.campaign_name ?? "",
          status: c?.effective_status ?? "",
          objective: c?.objective ?? "",
          dailyBudget: c?.daily_budget ? Number(c.daily_budget) / 100 : null,
          ...metrics(r),
        };
      })
      .sort((a, b) => b.spend - a.spend),
    ads: byAd
      .map((r) => {
        const a = adInfo.get(r.ad_id ?? "");
        return {
          id: r.ad_id ?? "",
          name: r.ad_name ?? "",
          adset: r.adset_name ?? "",
          campaign: r.campaign_name ?? "",
          status: a?.effective_status ?? "",
          thumbnail: a?.creative?.thumbnail_url ?? null,
          body: a?.creative?.body ?? a?.creative?.title ?? "",
          ...metrics(r),
        };
      })
      .sort((a, b) => b.spend - a.spend),
    demographics: demo.map((r) => ({ label: `${GENDER[r.gender ?? ""] ?? r.gender} ${r.age}`, ...metrics(r) })).sort((a, b) => b.spend - a.spend),
    regions: regions.map((r) => ({ label: r.region ?? "", ...metrics(r) })).sort((a, b) => b.spend - a.spend),
    placements: placements
      .map((r) => ({ label: `${r.publisher_platform} · ${r.platform_position?.replaceAll("_", " ")}`, ...metrics(r) }))
      .sort((a, b) => b.spend - a.spend),
  };
}

export type AdsReport = Awaited<ReturnType<typeof adsReport>>;
