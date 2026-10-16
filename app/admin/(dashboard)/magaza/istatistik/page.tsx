import Link from "next/link";
import { adminClient } from "@/lib/data";

// Mağaza istatistikleri: WhatsApp'a ve aramaya kaç kez tıklandı, hangi
// üründen ve sayfanın neresinden. Veri analytics_events tablosundan gelir.
export const dynamic = "force-dynamic";

type Ev = { type: string; path: string; label: string | null; created_at: string };

const SOURCES: Record<string, string> = {
  store_whatsapp_card: "Ürün kartı butonu",
  store_whatsapp_order: "Ürün kartı butonu",
  store_whatsapp_product: "Ürün sayfası butonu",
  store_whatsapp_datasheet: "Datasheet isteği",
  store_header_whatsapp: "Üst menü butonu",
  store_whatsapp_contact: "Sipariş hattı sayfası",
  store_whatsapp_calculator: "Off grid hesaplama",
  whatsapp_button: "Sağ alttaki sabit buton",
};

const isWhatsapp = (l: string | null) => Boolean(l && (l in SOURCES || l.includes("whatsapp")));
const isCall = (l: string | null) => l === "call_button" || l === "store_call_product" || l === "store_call_contact";

/** Seçilen dönemin başlangıcı ve grafikteki günler (en fazla 30, eskiden yeniye). */
function dateWindow(days: number) {
  const now = Date.now();
  const day = 24 * 3600 * 1000;
  return {
    since: new Date(now - days * day).toISOString(),
    dayKeys: Array.from({ length: Math.min(days, 30) }, (_, i) => new Date(now - i * day).toISOString().slice(0, 10)).reverse(),
  };
}

async function fetchStoreEvents(since: string): Promise<Ev[]> {
  const db = adminClient();
  const all: Ev[] = [];
  for (let from = 0; from < 50000; from += 1000) {
    const { data, error } = await db
      .from("analytics_events")
      .select("type, path, label, created_at")
      .like("path", "/magaza%")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .range(from, from + 999);
    if (error || !data) break;
    all.push(...(data as Ev[]));
    if (data.length < 1000) break;
  }
  return all;
}

export default async function StoreStatsPage({ searchParams }: { searchParams: Promise<{ gun?: string }> }) {
  const { gun } = await searchParams;
  const days = [7, 30, 90, 365].includes(Number(gun)) ? Number(gun) : 30;
  const { since, dayKeys } = dateWindow(days);

  const [events, { data: products }] = await Promise.all([
    fetchStoreEvents(since),
    adminClient().from("store_products").select("id, slug, category, name"),
  ]);

  const clicks = events.filter((e) => e.type === "click");
  const wa = clicks.filter((e) => isWhatsapp(e.label));
  const calls = clicks.filter((e) => isCall(e.label));
  const views = events.filter((e) => e.type === "pageview");

  const bySource = new Map<string, number>();
  for (const e of wa) {
    const k = SOURCES[e.label ?? ""] ?? "Diğer";
    bySource.set(k, (bySource.get(k) ?? 0) + 1);
  }

  const rows = (products ?? [])
    .map((p) => {
      const path = `/magaza/${p.category}/${p.slug}`;
      return {
        ...p,
        path,
        views: views.filter((e) => e.path === path).length,
        wa: wa.filter((e) => e.path === path).length,
        calls: calls.filter((e) => e.path === path).length,
      };
    })
    .sort((a, b) => b.wa - a.wa || b.views - a.views);

  const productPaths = new Set(rows.map((r) => r.path));
  const otherWa = wa.filter((e) => !productPaths.has(e.path)).length;

  const byDay = new Map<string, number>();
  for (const e of wa) {
    const d = e.created_at.slice(0, 10);
    byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }
  const lastDays = dayKeys.map((d) => ({ d, n: byDay.get(d) ?? 0 }));
  const maxDay = Math.max(1, ...lastDays.map((x) => x.n));

  const card = "rounded-2xl border border-line bg-paper-raised p-5";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {[7, 30, 90, 365].map((d) => (
          <Link
            key={d}
            href={`/admin/magaza/istatistik?gun=${d}`}
            className={`rounded-full px-4 py-1.5 text-[13px] font-semibold ${d === days ? "bg-brand text-white" : "border border-line text-slate hover:border-ink"}`}
          >
            Son {d} gün
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={card}>
          <p className="text-[13px] text-slate">WhatsApp tıklaması</p>
          <p className="mt-1 font-display text-3xl font-bold text-[#1da851]">{wa.length}</p>
          <p className="text-[12px] text-slate-soft">Mağazadaki tüm WhatsApp butonları</p>
        </div>
        <div className={card}>
          <p className="text-[13px] text-slate">Arama tıklaması</p>
          <p className="mt-1 font-display text-3xl font-bold text-ink">{calls.length}</p>
          <p className="text-[12px] text-slate-soft">&quot;Bizi Arayın&quot; ve telefon butonları</p>
        </div>
        <div className={card}>
          <p className="text-[13px] text-slate">Mağaza sayfa görüntüleme</p>
          <p className="mt-1 font-display text-3xl font-bold text-ink">{views.length}</p>
          <p className="text-[12px] text-slate-soft">
            Tıklama oranı: {views.length ? ((wa.length / views.length) * 100).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) : 0}%
          </p>
        </div>
      </div>

      <div className={card}>
        <p className="font-display text-[16px] font-semibold">Günlük WhatsApp tıklamaları</p>
        <div className="mt-4 flex h-32 items-end gap-1">
          {lastDays.map(({ d, n }) => (
            <div key={d} className="group relative flex flex-1 flex-col items-center justify-end" title={`${d.split("-").reverse().join(".")}: ${n}`}>
              <div className="w-full rounded-t bg-[#25D366]" style={{ height: `${(n / maxDay) * 100}%`, minHeight: n ? 4 : 1 }} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-slate-soft">
          <span>{lastDays[0]?.d.split("-").reverse().join(".")}</span>
          <span>Bugün</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="overflow-x-auto rounded-2xl border border-line bg-paper-raised">
          <table className="w-full min-w-[520px] text-[14px]">
            <thead>
              <tr className="border-b border-line text-left text-[12px] text-slate">
                <th className="px-4 py-2.5">Ürün</th>
                <th className="px-3 py-2.5 text-right">Görüntüleme</th>
                <th className="px-3 py-2.5 text-right">WhatsApp</th>
                <th className="px-4 py-2.5 text-right">Arama</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/magaza/urunler/${r.id}`} className="font-medium text-ink hover:text-brand">
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate">{r.views}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-[#1da851]">{r.wa}</td>
                  <td className="px-4 py-2.5 text-right text-slate">{r.calls}</td>
                </tr>
              ))}
              {otherWa > 0 && (
                <tr className="border-t border-line text-slate">
                  <td className="px-4 py-2.5 italic">Ürün dışı sayfalar (ana sayfa, kategori, üst menü)</td>
                  <td />
                  <td className="px-3 py-2.5 text-right font-bold text-[#1da851]">{otherWa}</td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={card}>
          <p className="font-display text-[16px] font-semibold">Hangi butondan?</p>
          {bySource.size === 0 ? (
            <p className="mt-3 text-[13px] text-slate-soft">Bu dönemde WhatsApp tıklaması yok.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2 text-[13.5px]">
              {[...bySource.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([k, n]) => (
                  <li key={k} className="flex justify-between gap-2">
                    <span className="text-slate">{k}</span>
                    <strong>{n}</strong>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>

      <p className="text-[12.5px] text-slate-soft">
        Not: Tıklama, müşterinin WhatsApp&apos;ı açtığını gösterir; mesajı gönderip göndermediğini WhatsApp bize bildirmez.
        Gerçek sipariş sayısını WhatsApp&apos;taki konuşmalarla karşılaştırabilirsiniz.
      </p>
    </div>
  );
}
