import { googleAccessToken } from "./google-auth";

// Google Analytics 4 (Data API) → admin "Google Analytics" sayfası. Servis hesabı
// GA4 mülkünde Görüntüleyici; veriler her istekte canlı çekilir (veritabanına yazılmaz).

export const GA_PROPERTY = "545955604";
const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const API = `https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY}`;

type Row = { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] };
type Report = { rows?: Row[]; totals?: Row[] };
type Req = Record<string, unknown>;

async function call(token: string, method: "runReport" | "runRealtimeReport", body: Req): Promise<Report> {
  const res = await fetch(`${API}:${method}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Google Analytics: ${data.error?.message ?? res.status}`);
  return data as Report;
}

export type GaPair = { label: string; value: number };
const pairs = (r: Report, metric = 0): GaPair[] =>
  (r.rows ?? []).map((row) => ({ label: row.dimensionValues?.[0]?.value ?? "", value: Number(row.metricValues?.[metric]?.value ?? 0) }));
const num = (r: Report, i: number) => Number(r.rows?.[0]?.metricValues?.[i]?.value ?? 0);

/** Son 30 dakika: aktif kullanıcı, sayfalar, şehirler, cihazlar. */
export async function gaRealtime() {
  const token = await googleAccessToken(SCOPE);
  const rt = (dimension: string | null, limit = 10) =>
    call(token, "runRealtimeReport", {
      ...(dimension ? { dimensions: [{ name: dimension }] } : {}),
      metrics: [{ name: "activeUsers" }],
      limit,
      ...(dimension ? { orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }] } : {}),
    });
  const [total, pages, cities, devices] = await Promise.all([rt(null), rt("unifiedScreenName"), rt("city"), rt("deviceCategory", 5)]);
  return { activeUsers: num(total, 0), pages: pairs(pages), cities: pairs(cities), devices: pairs(devices) };
}

const METRICS = ["activeUsers", "sessions", "screenPageViews", "averageSessionDuration", "keyEvents"];

/** Özet: bugün, dün, son 7 ve 28 gün; günlük grafik; en çok ziyaret edilen sayfalar, kaynaklar, şehirler, önemli etkinlikler. */
export async function gaOverview() {
  const token = await googleAccessToken(SCOPE);
  const totals = (start: string, end: string) =>
    call(token, "runReport", { dateRanges: [{ startDate: start, endDate: end }], metrics: METRICS.map((name) => ({ name })) });
  const top = (dimension: string, metric: string, limit = 10, filter?: Req) =>
    call(token, "runReport", {
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: dimension }],
      metrics: [{ name: metric }],
      orderBys: [{ metric: { metricName: metric }, desc: true }],
      limit,
      ...(filter ? { dimensionFilter: filter } : {}),
    });
  const [today, yesterday, week, month, daily, pages, sources, cities, events] = await Promise.all([
    totals("today", "today"),
    totals("yesterday", "yesterday"),
    totals("7daysAgo", "today"),
    totals("28daysAgo", "today"),
    call(token, "runReport", {
      dateRanges: [{ startDate: "27daysAgo", endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "activeUsers" }, { name: "sessions" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }),
    top("pagePath", "screenPageViews", 12),
    top("sessionSourceMedium", "sessions", 10),
    top("city", "activeUsers", 10),
    top("eventName", "eventCount", 15),
  ]);
  const pack = (r: Report) => Object.fromEntries(METRICS.map((m, i) => [m, num(r, i)])) as Record<string, number>;
  return {
    today: pack(today),
    yesterday: pack(yesterday),
    week: pack(week),
    month: pack(month),
    daily: (daily.rows ?? []).map((r) => ({
      date: r.dimensionValues?.[0]?.value ?? "",
      users: Number(r.metricValues?.[0]?.value ?? 0),
      sessions: Number(r.metricValues?.[1]?.value ?? 0),
    })),
    pages: pairs(pages),
    sources: pairs(sources),
    cities: pairs(cities),
    events: pairs(events),
  };
}

/**
 * Google Ads (Analytics'e bağlı hesaplar): kampanya bazında maliyet, tıklama, gösterim,
 * reklamdan gelen oturum ve önemli etkinlik (dönüşüm); günlük maliyet.
 */
export const GOOGLE_ADS_CUSTOMER = "3342768968";

export async function gaGoogleAds(days: number) {
  const token = await googleAccessToken(SCOPE);
  const dateRanges = [{ startDate: `${days}daysAgo`, endDate: "yesterday" }];
  const metrics = ["advertiserAdCost", "advertiserAdClicks", "advertiserAdImpressions", "sessions", "keyEvents"].map((name) => ({ name }));
  // Yalnızca kullandığımız Google Ads hesabı (334-276-8968); Analytics'e bağlı diğer hesap hariç.
  const filter = { filter: { fieldName: "sessionGoogleAdsCustomerId", stringFilter: { value: GOOGLE_ADS_CUSTOMER } } };
  const [byCampaign, daily, events] = await Promise.all([
    call(token, "runReport", {
      dateRanges,
      dimensions: [{ name: "sessionGoogleAdsCampaignName" }],
      metrics,
      dimensionFilter: filter,
      orderBys: [{ metric: { metricName: "advertiserAdCost" }, desc: true }],
      limit: 50,
    }),
    call(token, "runReport", {
      dateRanges,
      dimensions: [{ name: "date" }],
      metrics: [{ name: "advertiserAdCost" }, { name: "keyEvents" }],
      dimensionFilter: filter,
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }),
    // Reklamdan gelen ziyaretlerde hangi önemli etkinlikler oldu (form, WhatsApp, arama…)
    call(token, "runReport", {
      dateRanges,
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "keyEvents" }],
      dimensionFilter: {
        andGroup: { expressions: [filter, { filter: { fieldName: "isKeyEvent", stringFilter: { value: "true" } } }] },
      },
      orderBys: [{ metric: { metricName: "keyEvents" }, desc: true }],
    }),
  ]);
  const m = (row: Row, i: number) => Number(row.metricValues?.[i]?.value ?? 0);
  const campaigns = (byCampaign.rows ?? []).map((row) => ({
    name: row.dimensionValues?.[0]?.value ?? "",
    cost: m(row, 0),
    clicks: m(row, 1),
    impressions: m(row, 2),
    sessions: m(row, 3),
    keyEvents: m(row, 4),
  }));
  const sum = (k: keyof (typeof campaigns)[number]) => campaigns.reduce((s, c) => s + (c[k] as number), 0);
  return {
    days,
    total: { cost: sum("cost"), clicks: sum("clicks"), impressions: sum("impressions"), sessions: sum("sessions"), keyEvents: sum("keyEvents") },
    campaigns,
    daily: (daily.rows ?? []).map((row) => ({ date: row.dimensionValues?.[0]?.value ?? "", cost: m(row, 0), keyEvents: m(row, 1) })),
    events: pairs(events),
  };
}

export type GoogleAdsReport = Awaited<ReturnType<typeof gaGoogleAds>>;
