import { adminClient } from "@/lib/data";

function countBy(rows: Record<string, string | null>[], key: string) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const v = r[key];
    if (!v) continue;
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
}

function countByValues(values: string[]) {
  const map = new Map<string, number>();
  for (const v of values) map.set(v, (map.get(v) ?? 0) + 1);
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function minutesAgoIso(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

type LeadSourceRow = {
  utm_source: string | null;
  utm_medium: string | null;
  ad_click_id: string | null;
  source: string;
};

function sourceLabel(row: LeadSourceRow): string {
  if (row.utm_source || row.utm_medium) {
    return [row.utm_source, row.utm_medium].filter(Boolean).join(" / ");
  }
  if (row.ad_click_id?.startsWith("fbclid:")) return "Meta Ads";
  if (row.ad_click_id?.startsWith("gclid:")) return "Google Ads";
  return row.source === "quick_quote" ? "Hızlı teklif formu" : "Doğrudan / Organik";
}

export default async function AdminDashboardPage() {
  const client = adminClient();
  const since7 = daysAgoIso(7);
  const since30 = daysAgoIso(30);
  const since15min = minutesAgoIso(15);

  const [
    totalViewsRes,
    views7Res,
    views30Res,
    byPathRes,
    byCityRes,
    byLabelRes,
    totalLeadsRes,
    leads7Res,
    leadsByPageRes,
    leadsByProvinceRes,
    leadsSourceRes,
    activeNowRes,
    activeCitiesRes,
  ] = await Promise.all([
    client.from("analytics_events").select("*", { count: "exact", head: true }).eq("type", "pageview"),
    client
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("type", "pageview")
      .gte("created_at", since7),
    client
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("type", "pageview")
      .gte("created_at", since30),
    client.from("analytics_events").select("path").eq("type", "pageview").gte("created_at", since30),
    client
      .from("analytics_events")
      .select("city")
      .eq("type", "pageview")
      .not("city", "is", null)
      .gte("created_at", since30),
    client.from("analytics_events").select("label").eq("type", "click").not("label", "is", null),
    client.from("leads").select("*", { count: "exact", head: true }),
    client.from("leads").select("*", { count: "exact", head: true }).gte("created_at", since7),
    client.from("leads").select("form_page").not("form_page", "is", null),
    client.from("leads").select("province").not("province", "is", null),
    client.from("leads").select("utm_source, utm_medium, ad_click_id, source"),
    client
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("type", "pageview")
      .gte("created_at", since15min),
    client
      .from("analytics_events")
      .select("city")
      .eq("type", "pageview")
      .not("city", "is", null)
      .gte("created_at", since15min),
  ]);

  const topPaths = countBy((byPathRes.data ?? []) as Record<string, string | null>[], "path");
  const topCities = countBy((byCityRes.data ?? []) as Record<string, string | null>[], "city");
  const topLabels = countBy((byLabelRes.data ?? []) as Record<string, string | null>[], "label");
  const topLeadPages = countBy((leadsByPageRes.data ?? []) as Record<string, string | null>[], "form_page");
  const topProvinces = countBy((leadsByProvinceRes.data ?? []) as Record<string, string | null>[], "province");
  const topSources = countByValues(((leadsSourceRes.data ?? []) as LeadSourceRow[]).map(sourceLabel));
  const activeCities = countBy((activeCitiesRes.data ?? []) as Record<string, string | null>[], "city");

  const labelNames: Record<string, string> = {
    call_button: "Hemen Ara butonu",
    whatsapp_button: "WhatsApp butonu",
    lead_form_submit: "Teklif formu gönderimi",
  };

  return (
    <div>
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
        Genel Bakış
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Site Analitiği</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Toplam sayfa görüntüleme" value={totalViewsRes.count ?? 0} />
        <StatCard label="Son 7 gün görüntüleme" value={views7Res.count ?? 0} />
        <StatCard label="Son 30 gün görüntüleme" value={views30Res.count ?? 0} />
        <StatCard label="Toplam teklif talebi" value={totalLeadsRes.count ?? 0} sub={`son 7 günde ${leads7Res.count ?? 0}`} />
      </div>

      <div className="mt-8 flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-volt opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-volt" />
        </span>
        <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-volt">
          Şu An Aktif · Son 15 Dakika
        </p>
      </div>
      <div className="mt-3 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-volt/30 bg-volt/5 p-5 lg:col-span-1">
          <p className="text-[12.5px] text-slate-soft">Aktif ziyaretçi (yaklaşık)</p>
          <p className="mt-1.5 font-mono-data text-3xl font-semibold text-volt">
            {(activeNowRes.count ?? 0).toLocaleString("tr-TR")}
          </p>
          <p className="mt-1 text-[11.5px] text-slate-soft">son 15 dakikadaki sayfa görüntülemesi</p>
        </div>
        <div className="lg:col-span-2">
          <RankTable title="Şu an hangi şehirlerden geliyorlar" rows={activeCities} />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <RankTable title="En çok teklif alan sayfalar (dönüşüm)" rows={topLeadPages} />
        <RankTable title="İllere göre talepler" rows={topProvinces} />
        <RankTable title="Hangi reklam/kaynaktan geliyorlar" rows={topSources} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <RankTable title="En çok görüntülenen sayfalar (30 gün)" rows={topPaths} />
        <RankTable
          title="Tıklanan butonlar (tüm zamanlar)"
          rows={topLabels.map(([label, count]) => [labelNames[label] ?? label, count])}
        />
        <RankTable title="Ziyaretçi şehirleri (30 gün)" rows={topCities} />
      </div>

      {totalViewsRes.count === 0 && (
        <p className="mt-8 text-[13.5px] text-slate-soft">
          Henüz veri yok — site canlıya alındıktan ve ilk ziyaretçiler geldikten sonra burada
          görünecek. Şehir bilgisi yalnızca Vercel üzerinde (yayında) çalışır, yerel geliştirmede
          boş gelir.
        </p>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper-raised p-5">
      <p className="text-[12.5px] text-slate-soft">{label}</p>
      <p className="mt-1.5 font-mono-data text-2xl font-semibold text-ink">
        {value.toLocaleString("tr-TR")}
      </p>
      {sub && <p className="mt-0.5 text-[11.5px] text-slate-soft">{sub}</p>}
    </div>
  );
}

function RankTable({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div className="rounded-2xl border border-line bg-paper-raised p-5">
      <p className="text-[13px] font-semibold text-ink">{title}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-[13px] text-slate-soft">Henüz veri yok.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {rows.map(([label, count]) => (
            <li key={label} className="flex items-center justify-between text-[13.5px]">
              <span className="truncate text-slate">{label}</span>
              <span className="font-mono-data font-semibold text-ink">{count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
