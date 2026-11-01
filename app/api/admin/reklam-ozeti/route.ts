import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { googleAdsReport } from "@/lib/google-ads";
import { adsReport, type AdsPeriod } from "@/lib/meta-ads";
import { requireAdmin } from "@/lib/admin-guard";
import { dedupeClicks, firstByPhone, isClickConversion, isContactClick, isWhatsappClick } from "@/lib/lead-metrics";

// Admin "Reklam Özeti": Google + Meta harcaması, site talepleri, Meta form başvuruları
// ve WhatsApp/telefon tıklamaları tek ekranda (GET ?gun=7|14|30|90). Kaynaklardan biri
// hata verirse diğerleri yine döner. /api/admin altı proxy ile korunur.
export const dynamic = "force-dynamic";

const PERIOD: Record<number, AdsPeriod> = { 7: "last_7d", 14: "last_14d", 30: "last_30d", 90: "last_90d" };

const settle = async <T,>(p: Promise<T>) => {
  try {
    return { data: await p, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) };
  }
};

type SiteLead = { created_at: string; phone: string | null; utm_source: string | null; utm_medium: string | null; ad_click_id: string | null; source: string };
type ClickRow = { label: string | null; city: string | null; created_at: string };
const siteSource = (r: SiteLead) =>
  r.ad_click_id?.startsWith("gclid:") || /google/i.test(r.utm_source ?? "") ? "Google Ads"
  : r.ad_click_id?.startsWith("fbclid:") || /facebook|instagram|meta/i.test(r.utm_source ?? "") ? "Meta Ads"
  : "Organik / Doğrudan";

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const asked = Number(new URL(req.url).searchParams.get("gun")) || 30;
  const days = PERIOD[asked] ? asked : 30;
  // Reklam raporları dünü son gün sayar; tablolar da aynı aralıkla (TR saati) okunur.
  const now = new Date(Date.now() + 3 * 3600000);
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - 3 * 3600000);
  const start = new Date(end.getTime() - days * 86400000);
  const db = adminClient();

  // Supabase tek sorguda en fazla 1000 satır döndürür; tıklamalar sayfa sayfa okunur.
  const fetchClicks = async () => {
    const rows: ClickRow[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await db
        .from("analytics_events")
        .select("label, city, created_at")
        .eq("type", "click")
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString())
        .order("created_at")
        .range(from, from + 999);
      if (error) throw new Error(error.message);
      rows.push(...((data ?? []) as ClickRow[]));
      if (!data || data.length < 1000) return rows;
    }
  };

  const [google, meta, clicks, site, form] = await Promise.all([
    settle(googleAdsReport(days)),
    settle(adsReport(PERIOD[days], "akturk")),
    settle(fetchClicks()),
    settle(
      Promise.resolve(
        db.from("leads").select("created_at, phone, utm_source, utm_medium, ad_click_id, source").gte("created_at", start.toISOString()).lt("created_at", end.toISOString()).order("created_at"),
      ).then((r) => {
        if (r.error) throw new Error(r.error.message);
        return (r.data ?? []) as SiteLead[];
      }),
    ),
    settle(
      Promise.resolve(db.from("meta_leads").select("created_time, phone, status, campaign_name").gte("created_time", start.toISOString()).lt("created_time", end.toISOString()).order("created_time")).then(
        (r) => {
          if (r.error) throw new Error(r.error.message);
          return (r.data ?? []) as { created_time: string; phone: string | null; status: string | null; campaign_name: string | null }[];
        },
      ),
    ),
  ]);

  const trDay = (iso: string) => new Date(new Date(iso).getTime() + 3 * 3600000).toISOString().slice(0, 10);
  const daysList = Array.from({ length: days }, (_, i) => new Date(start.getTime() + 3 * 3600000 + i * 86400000).toISOString().slice(0, 10));
  const daily = new Map(
    daysList.map((d) => [d, { date: d, googleCost: 0, metaSpend: 0, googleClicks: 0, metaClicks: 0, siteLeads: 0, formLeads: 0, whatsapp: 0, phone: 0 }]),
  );
  for (const r of google.data?.daily ?? []) {
    const x = daily.get(r.date);
    if (x) Object.assign(x, { googleCost: r.cost, googleClicks: r.clicks });
  }
  for (const r of meta.data?.daily ?? []) {
    const x = daily.get(r.date);
    if (x) Object.assign(x, { metaSpend: r.spend, metaClicks: r.linkClicks });
  }
  for (const c of dedupeClicks((clicks.data ?? []).filter((c) => isContactClick(c.label)))) {
    const x = daily.get(trDay(c.created_at));
    if (x) x[isWhatsappClick(c.label) ? "whatsapp" : "phone"]++;
  }
  // Aynı numara dönem içinde tek talep sayılır: site formu ve Meta formu arasında da.
  const seenPhones = new Set<string>();
  const bySource: Record<string, number> = {};
  for (const r of firstByPhone(site.data ?? [], (l) => l.phone, seenPhones)) {
    const x = daily.get(trDay(r.created_at));
    if (x) x.siteLeads++;
    const s = siteSource(r);
    bySource[s] = (bySource[s] ?? 0) + 1;
  }
  for (const r of firstByPhone(form.data ?? [], (l) => l.phone, seenPhones)) {
    const x = daily.get(trDay(r.created_time));
    if (x) x.formLeads++;
  }
  const funnel: Record<string, number> = {};
  for (const r of form.data ?? []) {
    const s = r.status || "Yeni";
    funnel[s] = (funnel[s] ?? 0) + 1;
  }

  const rows = [...daily.values()];
  const sum = (k: keyof (typeof rows)[number]) => rows.reduce((s, r) => s + (r[k] as number), 0);
  return NextResponse.json({
    days,
    from: daysList[0],
    to: daysList.at(-1),
    totals: {
      googleCost: google.data?.total.cost ?? 0,
      googleClicks: google.data?.total.clicks ?? 0,
      googleConversions: google.data?.total.conversions ?? 0,
      googleClickConversions: (google.data?.conversionActions ?? []).filter((a) => isClickConversion(a.label)).reduce((s, a) => s + a.value, 0),
      metaSpend: meta.data?.total.spend ?? 0,
      metaClicks: meta.data?.total.linkClicks ?? 0,
      metaLeads: meta.data?.total.leads ?? 0,
      siteLeads: sum("siteLeads"),
      formLeads: sum("formLeads"),
      whatsapp: sum("whatsapp"),
      phone: sum("phone"),
    },
    daily: rows,
    siteBySource: bySource,
    formFunnel: funnel,
    googleCampaigns: (google.data?.campaigns ?? []).filter((c) => c.cost > 0 || c.status === "ENABLED"),
    metaCampaigns: (meta.data?.campaigns ?? []).filter((c) => c.spend > 0),
    errors: { google: google.error, meta: meta.error, clicks: clicks.error, site: site.error, form: form.error },
  });
}
