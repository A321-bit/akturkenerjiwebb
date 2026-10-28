import { adminClient, getServices, getReferences, getBlogPostSummaries } from "@/lib/data";
import { getStoreCategories, getStoreProducts } from "@/lib/store-data";
import { CHANNELS, leadChannel } from "@/lib/lead-source";
import { BarList, DailyArea, GOLD, PageRace, type DayPoint, type RankRow } from "@/components/admin/OverviewCharts";

// Genel Bakış: sitenin kendi ziyaret sayacı (analytics_events) ve talepler (leads, meta_leads).
// Veriler sunucuda bir kez okunup gruplanır; grafikler istemcide çizilir.

type EventRow = { type: string; path: string | null; label: string | null; city: string | null; created_at: string };
type LeadRow = {
  created_at: string;
  form_page: string | null;
  province: string | null;
  source: string;
  status: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  ad_click_id: string | null;
};

const DAY = 864e5;
// Admin sayfası her istekte yeniden çizilir (force-dynamic); "şimdi" istek anıdır.
const requestTime = () => Date.now();
const isoDay = (t: number) => new Date(t + 3 * 3600e3).toISOString().slice(0, 10); // Türkiye saatine göre gün

// Supabase tek sorguda en fazla 1000 satır döndürür; 30 günlük olaylar sayfa sayfa okunur.
async function fetchEvents(sinceIso: string): Promise<EventRow[]> {
  const client = adminClient();
  const rows: EventRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client
      .from("analytics_events")
      .select("type, path, label, city, created_at")
      .gte("created_at", sinceIso)
      .order("created_at")
      .range(from, from + 999);
    if (error || !data) break;
    rows.push(...(data as EventRow[]));
    if (data.length < 1000) break;
  }
  return rows.filter((r) => !r.path?.startsWith("/admin"));
}

function tally<T>(items: T[], key: (x: T) => string | null | undefined) {
  const m = new Map<string, number>();
  for (const it of items) {
    const k = key(it);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}
const top = (m: Map<string, number>, n = 10): RankRow[] =>
  [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([label, value]) => ({ label, value }));

function dailySeries(times: number[], days: number, now: number): DayPoint[] {
  const counts = tally(times, (t) => isoDay(t));
  return Array.from({ length: days }, (_, i) => {
    const day = isoDay(now - (days - 1 - i) * DAY);
    return { day, value: counts.get(day) ?? 0 };
  });
}

const BUTTON_NAMES: Record<string, string> = {
  call_button: "Hemen Ara",
  whatsapp_button: "WhatsApp butonu",
  whatsapp_cta_banner: "WhatsApp banner",
  lead_form_submit: "Teklif formu gönderimi",
  quote_button_open: "Keşif Al butonu",
  quote_form_submit: "Hızlı teklif gönderimi",
  live_chat_open: "Canlı destek açıldı",
  live_chat_message: "Canlı destek mesajı",
  store_whatsapp_card: "Mağaza kartı WhatsApp",
  store_whatsapp_calculator: "Hesaplama aracı WhatsApp",
};

export default async function AdminDashboardPage() {
  const client = adminClient();
  const now = requestTime();
  const since30 = new Date(now - 30 * DAY).toISOString();

  const [events, totalViewsRes, leadsRes, metaRes, services, references, posts, categories, products] = await Promise.all([
    fetchEvents(since30),
    client.from("analytics_events").select("*", { count: "exact", head: true }).eq("type", "pageview"),
    client.from("leads").select("created_at, form_page, province, source, status, utm_source, utm_medium, utm_campaign, ad_click_id"),
    client.from("meta_leads").select("created_time, city").gte("created_time", since30),
    getServices(),
    getReferences(),
    getBlogPostSummaries(),
    getStoreCategories(),
    getStoreProducts(),
  ]);

  // Sayfa adresini okunur ada çevirir (hizmet, blog, referans, mağaza).
  const names = new Map<string, string>([
    ["/", "Ana sayfa"],
    ["/hizmetlerimiz", "Hizmetlerimiz"],
    ["/referanslarimiz", "Referanslarımız"],
    ["/blog", "Blog"],
    ["/iletisim", "İletişim"],
    ["/hakkimizda", "Hakkımızda"],
    ["/magaza", "Mağaza ana sayfa"],
    ["/teklif-al", "Reklam teklif sayfası"],
    ["/magaza/off-grid-hesaplama", "Off grid hesaplama aracı"],
  ]);
  for (const s of services) names.set(`/hizmetlerimiz/${s.slug}`, `Hizmet · ${s.title}`);
  for (const r of references) names.set(`/referanslarimiz/${r.slug}`, `Referans · ${r.title}`);
  for (const p of posts) names.set(`/blog/${p.slug}`, `Blog · ${p.title}`);
  for (const c of categories) names.set(`/magaza/${c.slug}`, `Mağaza · ${c.name}`);
  for (const p of products) names.set(`/magaza/${p.category}/${p.slug}`, `Ürün · ${p.name}`);
  const pageName = (path: string | null) => (path ? names.get(path.replace(/\/$/, "") || "/") ?? path : null);

  const views = events.filter((e) => e.type === "pageview");
  const clicks = events.filter((e) => e.type === "click");
  const t = (e: { created_at: string }) => new Date(e.created_at).getTime();
  const last7 = views.filter((e) => t(e) >= now - 7 * DAY);
  const prev7 = views.filter((e) => t(e) < now - 7 * DAY && t(e) >= now - 14 * DAY);
  const today = views.filter((e) => isoDay(t(e)) === isoDay(now));
  const active = views.filter((e) => t(e) >= now - 15 * 60e3);

  // Sayfa yarışı: son 7 gün, önceki 7 güne göre sıra değişimi
  const prevByPage = tally(prev7, (e) => pageName(e.path));
  const race: RankRow[] = top(tally(last7, (e) => pageName(e.path)), 12).map((r) => ({ ...r, prev: prevByPage.get(r.label) ?? 0 }));

  const leads = (leadsRes.data ?? []) as LeadRow[];
  const siteLeads = leads.filter((l) => l.source !== "live_chat");
  const leads30 = siteLeads.filter((l) => t(l) >= now - 30 * DAY);
  const meta30 = (metaRes.data ?? []) as { created_time: string; city: string | null }[];
  const chLabel = new Map(CHANNELS.map((c) => [c.key, c.label]));
  const channelRows = top(tally(leads30, (l) => chLabel.get(leadChannel(l))));
  if (meta30.length) channelRows.push({ label: "Meta Form (reklam içi form)", value: meta30.length });
  channelRows.sort((a, b) => b.value - a.value);

  const contactClicks = clicks.filter((c) => /whatsapp|call_button/.test(c.label ?? "") && t(c) >= now - 30 * DAY);
  const won = siteLeads.filter((l) => l.status === "Olumlu").length;

  const stats = [
    { label: "Bugün ziyaret", value: today.length, sub: `şu an aktif ~${active.length}` },
    { label: "Son 7 gün ziyaret", value: last7.length, sub: prev7.length ? `önceki 7 gün ${prev7.length.toLocaleString("tr-TR")} (%${Math.round(((last7.length - prev7.length) / prev7.length) * 100)})` : undefined },
    { label: "Son 30 gün talep", value: leads30.length + meta30.length, sub: `site ${leads30.length} · Meta form ${meta30.length}` },
    { label: "WhatsApp + telefon tıklaması", value: contactClicks.length, sub: "son 30 gün" },
  ];

  return (
    <div>
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Genel Bakış</p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Site Performansı</h1>
      <p className="mt-1 text-[13px] text-slate">
        Toplam {(totalViewsRes.count ?? 0).toLocaleString("tr-TR")} sayfa görüntüleme · {siteLeads.length} site talebi · {won} olumlu sonuç
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-paper-raised p-5">
            <p className="text-[12.5px] text-slate">{s.label}</p>
            <p className="mt-1.5 font-mono-data text-3xl font-semibold text-ink">{s.value.toLocaleString("tr-TR")}</p>
            {s.sub && <p className="mt-0.5 text-[11.5px] text-slate">{s.sub}</p>}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Günlük ziyaret" note="Son 30 gün · sayfa görüntüleme">
          <DailyArea data={dailySeries(views.map(t), 30, now)} unit="görüntüleme" />
        </Card>
        <Card title="Günlük talep" note="Son 30 gün · site formları ve Meta formları">
          <DailyArea data={dailySeries([...leads30.map(t), ...meta30.map((m) => new Date(m.created_time).getTime())], 30, now)} color={GOLD} unit="talep" />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3" title="🏁 Sayfa yarışı" note="Son 7 günün en çok ziyaret edilen sayfaları · oklar önceki 7 güne göre sıra değişimi">
          <PageRace rows={race} />
        </Card>
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card title="Talepler nereden geliyor" note="Son 30 gün">
            <BarList rows={channelRows} color={GOLD} empty="Son 30 günde talep yok." />
          </Card>
          <Card title="En çok talep gelen sayfalar" note="Formun doldurulduğu sayfa · tüm zamanlar">
            <BarList rows={top(tally(siteLeads, (l) => pageName(l.form_page)), 6)} color={GOLD} />
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Tıklanan butonlar" note="Son 30 gün">
          <BarList rows={top(tally(clicks, (c) => (c.label ? BUTTON_NAMES[c.label] ?? c.label : null)), 8)} />
        </Card>
        <Card title="Ziyaretçi şehirleri" note="Son 30 gün">
          <BarList rows={top(tally(views, (e) => e.city), 8)} />
        </Card>
        <Card title="Taleplerin illeri" note="Site formları (tüm zamanlar) ve son 30 günün Meta formları">
          <BarList rows={top(tally([...siteLeads.map((l) => l.province), ...meta30.map((m) => m.city)], (p) => p?.trim()), 8)} color={GOLD} />
        </Card>
      </div>
    </div>
  );
}

function Card({ title, note, className = "", children }: { title: string; note?: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={`rounded-2xl border border-line bg-paper-raised p-5 ${className}`}>
      <h2 className="text-[14.5px] font-semibold text-ink">{title}</h2>
      {note && <p className="mt-0.5 text-[12px] text-slate">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
