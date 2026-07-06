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

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export default async function AdminDashboardPage() {
  const client = adminClient();
  const since7 = daysAgoIso(7);
  const since30 = daysAgoIso(30);

  const [
    totalViewsRes,
    views7Res,
    views30Res,
    byPathRes,
    byCityRes,
    byLabelRes,
    totalLeadsRes,
    leads7Res,
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
  ]);

  const topPaths = countBy((byPathRes.data ?? []) as Record<string, string | null>[], "path");
  const topCities = countBy((byCityRes.data ?? []) as Record<string, string | null>[], "city");
  const topLabels = countBy((byLabelRes.data ?? []) as Record<string, string | null>[], "label");

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
