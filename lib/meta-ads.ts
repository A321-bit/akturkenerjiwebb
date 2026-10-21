// Meta reklam hesabı raporu (Marketing API, salt okuma). Aynı sistem kullanıcısı
// anahtarı (META_ACCESS_TOKEN) kullanılır; anahtarda ads_read izni olmalı.

const GRAPH = "https://graph.facebook.com/v23.0";
export const AD_ACCOUNT = "act_188346112";

export type AdsPeriod = "last_7d" | "last_14d" | "last_28d" | "last_90d" | "this_month" | "last_month" | "maximum";

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

/** Hesapta iki markanın reklamları var; reklamın yayınlandığı Facebook sayfasına göre ayrılır. */
export const BRANDS = {
  akturk: { label: "Aktürk Enerji", pages: ["151082711971643", "1606675006013805"] },
  gunesdukkan: { label: "GüneşDükkan", pages: ["111167849589213"] },
} as const;
export type Brand = keyof typeof BRANDS | "tumu";

type Campaign = { id: string; name: string; effective_status: string; objective: string; daily_budget?: string; lifetime_budget?: string; start_time?: string };
type Ad = {
  id: string;
  name: string;
  effective_status: string;
  campaign_id: string;
  creative?: { thumbnail_url?: string; title?: string; body?: string; actor_id?: string; effective_object_story_id?: string };
};

const brandOf = (a: Ad): Brand => {
  const page = a.creative?.actor_id ?? a.creative?.effective_object_story_id?.split("_")[0] ?? "";
  for (const [key, b] of Object.entries(BRANDS)) if ((b.pages as readonly string[]).includes(page)) return key as Brand;
  return "tumu";
};

export async function adsReport(period: AdsPeriod, brand: Brand = "akturk") {
  const [campaigns, ads] = await Promise.all([
    graph<{ data: Campaign[] }>(`${AD_ACCOUNT}/campaigns`, { fields: "name,effective_status,objective,daily_budget,lifetime_budget,start_time", limit: "500" }),
    graph<{ data: Ad[] }>(`${AD_ACCOUNT}/ads`, {
      fields: "name,effective_status,campaign_id,creative{thumbnail_url,title,body,actor_id,effective_object_story_id}",
      limit: "500",
    }),
  ]);
  const brandAds = brand === "tumu" ? ads.data : ads.data.filter((a) => brandOf(a) === brand);
  const campaignIds = [...new Set(brandAds.map((a) => a.campaign_id))];
  const p: Record<string, string> = { date_preset: period };
  if (brand !== "tumu") p.filtering = JSON.stringify([{ field: "campaign.id", operator: "IN", value: campaignIds.length ? campaignIds : ["0"] }]);

  const [total, dailySpend, dailyActions, byCampaign, byAd, demo, regions, placements] = await Promise.all([
    insights({ ...p, fields: BASE }),
    // Günlük kırılımda "actions" da istenirse Meta harcamayı 0 döndürüyor: harcama ve sonuçlar ayrı çekilip birleştirilir.
    insights({ ...p, fields: "spend,impressions", time_increment: period === "maximum" ? "monthly" : "1" }),
    insights({ ...p, fields: "inline_link_clicks,actions", time_increment: period === "maximum" ? "monthly" : "1" }),
    insights({ ...p, fields: `campaign_id,campaign_name,${BASE}`, level: "campaign" }),
    insights({ ...p, fields: `ad_id,ad_name,adset_name,campaign_name,${BASE}`, level: "ad" }),
    insights({ ...p, fields: BASE, breakdowns: "age,gender" }),
    insights({ ...p, fields: BASE, breakdowns: "region" }),
    insights({ ...p, fields: BASE, breakdowns: "publisher_platform,platform_position" }),
  ]);
  const campaignInfo = new Map(campaigns.data.map((c) => [c.id, c]));
  const adInfo = new Map(ads.data.map((a) => [a.id, a]));
  const actionsByDay = new Map(dailyActions.map((r) => [r.date_start, r]));
  const GENDER: Record<string, string> = { male: "Erkek", female: "Kadın", unknown: "Belirsiz" };

  return {
    period,
    brand,
    total: total[0] ? metrics(total[0]) : metrics({}),
    daily: dailySpend
      .map((r) => {
        const a = actionsByDay.get(r.date_start);
        return { date: r.date_start ?? "", ...metrics({ ...r, inline_link_clicks: a?.inline_link_clicks, actions: a?.actions }) };
      })
      .sort((a, b) => a.date.localeCompare(b.date)),
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

/** Erişim anahtarının izinleri (reklam oluşturmak için ads_management gerekir). Anahtarın kendisi döndürülmez. */
export async function tokenScopes(): Promise<{ scopes: string[]; expires: number | null }> {
  const token = process.env.META_ACCESS_TOKEN ?? "";
  const d = await graph<{ data: { scopes?: string[]; expires_at?: number } }>("debug_token", { input_token: token });
  return { scopes: d.data.scopes ?? [], expires: d.data.expires_at || null };
}

/**
 * Kampanya oluşturma yetkisi testi: Meta isteği doğrular ama hiçbir şey oluşturmaz
 * (execution_options=validate_only), harcama olmaz.
 */
export async function validateCampaignCreate(): Promise<{ ok: boolean; detail: unknown }> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error("META_ACCESS_TOKEN ortam değişkeni tanımlı değil.");
  const body = new URLSearchParams({
    name: "Yetki testi (oluşturulmaz)",
    objective: "OUTCOME_LEADS",
    status: "PAUSED",
    special_ad_categories: "[]",
    execution_options: '["validate_only"]',
    access_token: token,
  });
  const res = await fetch(`${GRAPH}/${AD_ACCOUNT}/campaigns`, { method: "POST", body, cache: "no-store" });
  const data = await res.json();
  return { ok: res.ok && !data.error, detail: data.error ?? data };
}
