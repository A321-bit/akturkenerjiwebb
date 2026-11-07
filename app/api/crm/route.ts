import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { googleAdsReport, setCampaignStatus, setDailyBudget } from "@/lib/google-ads";
import { listCampaignAdSets, setMetaAdSetBudget, setMetaCampaignStatus } from "@/lib/meta-ads-manage";
import { createPost, deletePost, isConnected, listLocations, listPosts, listReviews, performance, replyReview, type GbpOffer } from "@/lib/gbp";
import { adsReport, type AdsPeriod } from "@/lib/meta-ads";
import { buildDailyReport } from "@/lib/daily-report";

// Aktürk CRM köprüsü (crm.akturkenerji.com → site). Yalnız sunucudan sunucuya, paylaşılan gizli anahtarla.
// Herkese açık sayfa değildir; önbellek/ISR harcamaz. Veri çıkışını sınırlamak için yalnız gereken kolonlar
// ve `since` sonrası kayıtlar döner. Anahtar tanımlı değilse uç nokta tamamen kapalıdır.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request) {
  const secret = process.env.CRM_BRIDGE_SECRET ?? "";
  const got = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (secret.length < 32 || got.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(secret));
}

const settle = async <T,>(p: Promise<T>) => {
  try {
    return { data: await p, error: null as string | null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) };
  }
};

const LEAD_COLS = "id, created_at, fullname, phone, email, need_type, bill_range, province, form_page, source, status, notes, utm_source, utm_medium, utm_campaign, ad_click_id";
const META_COLS = "id, created_time, full_name, phone, email, city, campaign_name, adset_name, platform, status";
const CALC_COLS =
  "id, created_at, type, fullname, phone, email, province, recommended_product, estimated_value, score, status, utm_source, ad_click_id, results->systemKw, results->panelCount, results->monthlyBillTl, results->annualSavingTl, results->paybackYears";
const PERIOD: Record<number, AdsPeriod> = { 7: "last_7d", 14: "last_14d", 30: "last_30d", 90: "last_90d" };

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  const url = new URL(req.url);
  const r = url.searchParams.get("r");
  const db = adminClient();

  if (r === "talepler") {
    const sinceRaw = url.searchParams.get("since");
    const since = sinceRaw && !Number.isNaN(Date.parse(sinceRaw)) ? new Date(sinceRaw).toISOString() : new Date(Date.now() - 30 * 864e5).toISOString();
    const [leads, meta, calcs] = await Promise.all([
      db.from("leads").select(LEAD_COLS).gt("created_at", since).order("created_at", { ascending: false }).limit(500),
      db.from("meta_leads").select(META_COLS).gt("created_time", since).order("created_time", { ascending: false }).limit(500),
      db.from("calculations").select(CALC_COLS).gt("created_at", since).order("created_at", { ascending: false }).limit(500),
    ]);
    return NextResponse.json({
      leads: leads.data ?? [], meta: meta.data ?? [], calculations: calcs.data ?? [],
      errors: [leads.error, meta.error, calcs.error].filter(Boolean).map((e) => e!.message),
    });
  }

  if (r === "reklam") {
    const days = [7, 14, 30, 90].includes(Number(url.searchParams.get("gun"))) ? Number(url.searchParams.get("gun")) : 30;
    const [google, meta] = await Promise.all([settle(googleAdsReport(days)), settle(adsReport(PERIOD[days]))]);
    const g = google.data;
    return NextResponse.json({ days, google: g ? { total: g.total, campaigns: g.campaigns, daily: g.daily } : null, googleError: google.error, meta: meta.data ? { total: meta.data.total, campaigns: meta.data.campaigns } : null, metaError: meta.error });
  }

  if (r === "magaza") {
    const { data, error } = await db.from("store_products").select("id, slug, category, name, power, price, price_usd, list_price, install_included, image, featured, active").order("sort_order").order("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ products: data });
  }

  if (r === "paketler") {
    // Mağaza paketleri + Paket Oluştur reçeteleri (malzeme, adet, maliyet). Yalnız CRM yönetimi için.
    const [prods, pkgs, items] = await Promise.all([
      db.from("store_products").select("id, slug, category, name, power, price, price_usd, list_price, install_included, image, contents, options, featured, active").order("sort_order").order("id"),
      db.from("product_packages").select("id, name, product_id, lines, sale_usd, note, updated_at"),
      db.from("cost_items").select("id, name, unit, grp, cost_usd").eq("active", true),
    ]);
    if (prods.error) return NextResponse.json({ error: prods.error.message }, { status: 500 });
    const byId = new Map((items.data ?? []).map((i) => [i.id as string, i]));
    const packages = (pkgs.data ?? []).map((p) => {
      const lines = ((p.lines ?? []) as { itemId: string | null; name: string; qty: number; unitUsd: number | null }[]).map((l) => {
        const it = l.itemId ? byId.get(l.itemId) : undefined;
        const unitUsd = l.unitUsd ?? (it?.cost_usd != null ? Number(it.cost_usd) : null);
        return { name: l.name || it?.name || "", qty: Number(l.qty) || 0, unit: it?.unit ?? null, group: it?.grp ?? null, unitUsd };
      });
      return { id: p.id, name: p.name, product_id: p.product_id, sale_usd: p.sale_usd, note: p.note, updated_at: p.updated_at, lines, cost_usd: lines.reduce((t, l) => t + l.qty * (l.unitUsd ?? 0), 0) };
    });
    return NextResponse.json({ products: prods.data, packages });
  }

  if (r === "gbp") {
    const conn = await settle(isConnected());
    if (!conn.data) return NextResponse.json({ connected: false });
    const locs = await listLocations();
    const loc = locs[0];
    if (!loc) return NextResponse.json({ connected: true, location: null });
    const [posts, reviews, perf] = await Promise.all([settle(listPosts(loc.account, loc.name)), settle(listReviews(loc.account, loc.name)), settle(performance(loc.name))]);
    return NextResponse.json({ connected: true, location: loc, posts: posts.data ?? [], reviews: reviews.data, performance: perf.data, errors: [posts.error, reviews.error, perf.error].filter(Boolean) });
  }

  if (r === "meta-adsets") {
    const id = url.searchParams.get("kampanya") ?? "";
    const res = await settle(listCampaignAdSets(id));
    return res.data ? NextResponse.json({ adsets: res.data }) : NextResponse.json({ error: res.error }, { status: 500 });
  }

  if (r === "rapor") {
    const rep = await settle(buildDailyReport());
    if (!rep.data) return NextResponse.json({ error: rep.error }, { status: 500 });
    return NextResponse.json({ subject: rep.data.subject, html: rep.data.html, summary: rep.data.summary });
  }

  return NextResponse.json({ error: "Bilinmeyen kaynak." }, { status: 400 });
}

// CRM'den yönetim işlemleri: yalnız CRM'de oturum açmış yetkili kullanıcının tıklamasıyla gelir.
const ACCOUNT = /^accounts\/\d+$/;
const LOCATION = /^locations\/\d+$/;
const REVIEW = /^accounts\/\d+\/locations\/\d+\/reviews\/[\w-]+$/;
const POST_NAME = /^accounts\/\d+\/locations\/\d+\/localPosts\/[\w-]+$/;

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  const b = await req.json().catch(() => null);
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  try {
    switch (b?.action) {
      case "google-durum":
        if (!["ENABLED", "PAUSED"].includes(b.status)) break;
        await setCampaignStatus(String(b.campaignId), b.status);
        return NextResponse.json({ ok: true });
      case "google-butce":
        await setDailyBudget(String(b.budgetResource), Number(b.amount));
        return NextResponse.json({ ok: true });
      case "meta-durum":
        if (!["ACTIVE", "PAUSED"].includes(b.status)) break;
        await setMetaCampaignStatus(String(b.campaignId), b.status);
        return NextResponse.json({ ok: true });
      case "meta-butce":
        await setMetaAdSetBudget(String(b.adSetId), Number(b.amount));
        return NextResponse.json({ ok: true });
      case "gbp-gonderi": {
        const summary = text(b.summary, 1500);
        const link = text(b.url, 500);
        const photoUrl = text(b.photoUrl, 500);
        if (!ACCOUNT.test(b.account) || !LOCATION.test(b.location) || !summary) return NextResponse.json({ error: "Gönderi metni gerekli." }, { status: 400 });
        if ([link, photoUrl].some((u) => u && !u.startsWith("https://"))) return NextResponse.json({ error: "Bağlantılar https:// ile başlamalı." }, { status: 400 });
        let offer: GbpOffer | undefined;
        if (b.offer) {
          const DAY = /^\d{4}-\d{2}-\d{2}$/;
          offer = { title: text(b.offer.title, 58), start: text(b.offer.start, 10), end: text(b.offer.end, 10), couponCode: text(b.offer.couponCode, 58) || undefined, terms: text(b.offer.terms, 5000) || undefined };
          if (!offer.title || !DAY.test(offer.start) || !DAY.test(offer.end) || offer.end < offer.start) return NextResponse.json({ error: "Teklif için başlık ve geçerli tarih aralığı gerekli." }, { status: 400 });
        }
        await createPost(b.account, b.location, { summary, url: link || undefined, photoUrl: photoUrl || undefined, offer });
        return NextResponse.json({ ok: true });
      }
      case "gbp-gonderi-sil":
        if (!POST_NAME.test(b.post)) break;
        await deletePost(b.post);
        return NextResponse.json({ ok: true });
      case "gbp-yanit": {
        const comment = text(b.comment, 4000);
        if (!REVIEW.test(b.review) || !comment) return NextResponse.json({ error: "Yanıt metni gerekli." }, { status: 400 });
        await replyReview(b.review, comment);
        return NextResponse.json({ ok: true });
      }
    }
    return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
