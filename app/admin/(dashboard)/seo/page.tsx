import Link from "next/link";
import { adminClient } from "@/lib/data";
import SeoKeywords, { type KeywordRow } from "@/components/admin/SeoKeywords";

// SEO: Google'ın siteyi hangi aramalarda kaçıncı sırada gösterdiği (Search
// Console verisi, lib/gsc.ts ile her sabah ve "Şimdi güncelle" ile çekilir).
export const dynamic = "force-dynamic";

const RANGES = [7, 28, 90, 180, 365];
const SECTIONS = [
  { key: "", label: "Tüm site" },
  { key: "/magaza", label: "Mağaza" },
  { key: "/hizmetlerimiz", label: "Hizmetler" },
  { key: "/blog", label: "Blog" },
  { key: "/referanslarimiz", label: "Referanslar" },
];
const DEVICES = [
  { key: "", label: "Tüm cihazlar" },
  { key: "mobile", label: "Mobil" },
  { key: "desktop", label: "Masaüstü" },
];

const shift = (ymd: string, days: number) => new Date(new Date(ymd + "T00:00:00Z").getTime() + days * 86400000).toISOString().slice(0, 10);

export default async function SeoPage({ searchParams }: { searchParams: Promise<{ gun?: string; bolum?: string; cihaz?: string }> }) {
  const sp = await searchParams;
  const days = RANGES.includes(Number(sp.gun)) ? Number(sp.gun) : 28;
  const section = SECTIONS.find((s) => s.key === sp.bolum)?.key ?? "";
  const device = DEVICES.find((d) => d.key === sp.cihaz)?.key ?? "";
  const db = adminClient();

  const [{ data: latest }, { data: lastSync }] = await Promise.all([
    db.from("gsc_rows").select("date").order("date", { ascending: false }).limit(1),
    db.from("gsc_sync_log").select("ran_at, error, row_count").order("ran_at", { ascending: false }).limit(1),
  ]);
  const end = latest?.[0]?.date as string | undefined;

  let rows: KeywordRow[] = [];
  let start = "";
  if (end) {
    start = shift(end, -(days - 1));
    const { data } = await db.rpc("gsc_keywords", {
      p_start: start,
      p_end: end,
      p_prev_start: shift(start, -days),
      p_prev_end: shift(start, -1),
      p_device: device || null,
      p_page: section ? `https://akturkenerji.com${section}` : null,
    });
    rows = (data ?? []) as KeywordRow[];
  }

  const link = (patch: Record<string, string | number>) => {
    const p = new URLSearchParams({ gun: String(days), bolum: section, cihaz: device, ...Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, String(v)])) });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    return `/admin/seo?${p.toString()}`;
  };
  const pill = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-[13px] font-semibold ${active ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">SEO · Anahtar Kelimelerimiz</h1>
        <p className="mt-1 text-[13.5px] text-slate">
          Google&apos;ın sitemizi gösterdiği bütün aramalar, ortalama sıramız ve önceki döneme göre değişim. Veri Google Search
          Console&apos;dan her sabah otomatik çekilir; son 1–2 günün verisi ön veridir ve kesinleştikçe güncellenir.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {RANGES.map((d) => (
          <Link key={d} href={link({ gun: d })} className={pill(d === days)}>
            Son {d} gün
          </Link>
        ))}
        <span className="mx-1 h-5 w-px bg-line" />
        {SECTIONS.map((s) => (
          <Link key={s.key || "all"} href={link({ bolum: s.key })} className={pill(s.key === section)}>
            {s.label}
          </Link>
        ))}
        <span className="mx-1 h-5 w-px bg-line" />
        {DEVICES.map((d) => (
          <Link key={d.key || "all"} href={link({ cihaz: d.key })} className={pill(d.key === device)}>
            {d.label}
          </Link>
        ))}
      </div>

      <SeoKeywords
        rows={rows}
        period={end ? { start, end } : null}
        days={days}
        device={device}
        lastSync={lastSync?.[0] ?? null}
      />
    </div>
  );
}
