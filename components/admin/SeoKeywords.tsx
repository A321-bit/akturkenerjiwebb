"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, RefreshCw, Search } from "lucide-react";

export type KeywordRow = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number | null;
  position: number | null;
  top_page: string | null;
  prev_position: number | null;
  prev_clicks: number | null;
  prev_impressions: number | null;
};

type Daily = { date: string; clicks: number; impressions: number; position: number | null };

const BUCKETS = [
  { key: "all", label: "Tümü", test: () => true },
  { key: "top3", label: "İlk 3", test: (p: number) => p <= 3 },
  { key: "top10", label: "4–10 (ilk sayfa)", test: (p: number) => p > 3 && p <= 10 },
  { key: "firsat", label: "11–20 (fırsat)", test: (p: number) => p > 10 && p <= 20 },
  { key: "uzak", label: "21+", test: (p: number) => p > 20 },
  { key: "yeni", label: "Yeni girenler", test: () => true },
  { key: "yukselen", label: "Yükselenler", test: () => true },
  { key: "dusen", label: "Düşenler", test: () => true },
] as const;
type BucketKey = (typeof BUCKETS)[number]["key"];

type SortKey = "impressions" | "clicks" | "position" | "change";

const n = (v: number | null | undefined) => (v == null ? null : Number(v));
const fmt = (v: number) => v.toLocaleString("tr-TR");
const fmtPos = (v: number | null) => (v == null ? "–" : v.toLocaleString("tr-TR", { maximumFractionDigits: 1 }));
const pathOf = (url: string | null) => (url ? decodeURIComponent(url.replace(/^https?:\/\/[^/]+/, "")) || "/" : "–");
/** Sıra değişimi: pozitif = yükseldi (sıra numarası küçüldü). */
const change = (r: KeywordRow) => (n(r.prev_position) != null && n(r.position) != null ? n(r.prev_position)! - n(r.position)! : null);

export default function SeoKeywords({
  rows,
  period,
  days,
  device,
  lastSync,
}: {
  rows: KeywordRow[];
  period: { start: string; end: string } | null;
  days: number;
  device: string;
  lastSync: { ran_at: string; error: string | null; row_count: number | null } | null;
}) {
  const router = useRouter();
  const [bucket, setBucket] = useState<BucketKey>("all");
  const [term, setTerm] = useState("");
  const [sort, setSort] = useState<SortKey>("impressions");
  const [open, setOpen] = useState<string | null>(null);
  const [daily, setDaily] = useState<Daily[] | null>(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const totals = useMemo(() => {
    const clicks = rows.reduce((s, r) => s + Number(r.clicks), 0);
    const impressions = rows.reduce((s, r) => s + Number(r.impressions), 0);
    const weighted = rows.reduce((s, r) => s + (n(r.position) ?? 0) * Number(r.impressions), 0);
    return {
      clicks,
      impressions,
      position: impressions ? weighted / impressions : null,
      top10: rows.filter((r) => (n(r.position) ?? 99) <= 10).length,
      firsat: rows.filter((r) => (n(r.position) ?? 99) > 10 && (n(r.position) ?? 99) <= 20).length,
    };
  }, [rows]);

  const visible = useMemo(() => {
    const t = term.trim().toLocaleLowerCase("tr");
    const b = BUCKETS.find((x) => x.key === bucket)!;
    let list = rows.filter((r) => {
      if (t && !r.query.toLocaleLowerCase("tr").includes(t)) return false;
      const p = n(r.position) ?? 999;
      if (bucket === "yeni") return r.prev_position == null;
      if (bucket === "yukselen") return (change(r) ?? 0) >= 1;
      if (bucket === "dusen") return (change(r) ?? 0) <= -1;
      return b.test(p);
    });
    list = [...list].sort((a, z) => {
      if (sort === "clicks") return Number(z.clicks) - Number(a.clicks);
      if (sort === "position") return (n(a.position) ?? 999) - (n(z.position) ?? 999);
      if (sort === "change") return Math.abs(change(z) ?? 0) - Math.abs(change(a) ?? 0);
      return Number(z.impressions) - Number(a.impressions);
    });
    return list;
  }, [rows, bucket, term, sort]);

  async function openQuery(q: string) {
    if (open === q) {
      setOpen(null);
      return;
    }
    setOpen(q);
    setDaily(null);
    const res = await fetch(`/api/admin/seo/query?${new URLSearchParams({ q, days: String(Math.max(days, 90)), device })}`);
    setDaily(res.ok ? await res.json() : []);
  }

  async function sync(body: object) {
    const res = await fetch("/api/admin/seo/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Güncellenemedi.");
    return data as { rows: number };
  }

  async function refreshNow() {
    setBusy("Son günler Search Console'dan çekiliyor…");
    setMsg("");
    try {
      const r = await sync({ days: 5 });
      setMsg(`Güncellendi: son 5 günde ${fmt(r.rows)} satır.`);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
    setBusy("");
  }

  async function loadHistory() {
    setMsg("");
    // Search Console en fazla 16 ay geriye veri tutar; 30 günlük parçalar halinde çekilir.
    const day = 86400000;
    try {
      let total = 0;
      for (let i = 15; i >= 0; i--) {
        const end = new Date(Date.now() - (i * 30 + 1) * day).toISOString().slice(0, 10);
        const start = new Date(Date.now() - (i * 30 + 30) * day).toISOString().slice(0, 10);
        setBusy(`Geçmiş yükleniyor: ${start} – ${end} (${16 - i}/16)`);
        total += (await sync({ start, end })).rows;
      }
      total += (await sync({ days: 5 })).rows;
      setMsg(`Geçmiş yüklendi: toplam ${fmt(total)} satır.`);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
    setBusy("");
  }

  const card = "rounded-2xl border border-line bg-paper-raised p-4";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-paper-raised p-4 text-[13px]">
        <span className="text-slate">
          {period ? (
            <>
              Dönem: <strong className="text-ink">{period.start}</strong> – <strong className="text-ink">{period.end}</strong>
            </>
          ) : (
            "Henüz veri yok."
          )}
          {lastSync && (
            <>
              {" "}
              · Son çekim: {new Date(lastSync.ran_at).toLocaleString("tr-TR")}
              {lastSync.error && <span className="text-red-600"> (hata: {lastSync.error})</span>}
            </>
          )}
        </span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={refreshNow}
          disabled={Boolean(busy)}
          className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 font-semibold text-paper hover:bg-sun hover:text-ink disabled:opacity-50"
        >
          <RefreshCw size={14} /> Şimdi güncelle
        </button>
        <button
          type="button"
          onClick={loadHistory}
          disabled={Boolean(busy)}
          className="rounded-full border border-line px-4 py-2 font-semibold hover:border-ink disabled:opacity-50"
        >
          Geçmişi yükle (16 ay)
        </button>
        {(busy || msg) && <p className="w-full text-[13px] text-volt">{busy || msg}</p>}
      </div>

      <div className="grid gap-3 sm:grid-cols-5">
        {[
          ["Anahtar kelime", fmt(rows.length)],
          ["Tıklama", fmt(totals.clicks)],
          ["Gösterim", fmt(totals.impressions)],
          ["Ortalama sıra", fmtPos(totals.position)],
          ["İlk 10 / Fırsat (11–20)", `${fmt(totals.top10)} / ${fmt(totals.firsat)}`],
        ].map(([label, value]) => (
          <div key={label} className={card}>
            <p className="text-[12px] text-slate">{label}</p>
            <p className="mt-1 font-display text-[22px] font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {BUCKETS.map((b) => (
          <button
            key={b.key}
            type="button"
            onClick={() => setBucket(b.key)}
            className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold ${bucket === b.key ? "border-brand bg-brand text-white" : "border-line hover:border-ink"}`}
          >
            {b.label}
          </button>
        ))}
        <span className="flex-1" />
        <label className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Kelime ara" className="admin-input w-56 pl-8" />
        </label>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="admin-input w-auto">
          <option value="impressions">Gösterime göre</option>
          <option value="clicks">Tıklamaya göre</option>
          <option value="position">Sıraya göre</option>
          <option value="change">Değişime göre</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-paper-raised">
        {visible.length === 0 ? (
          <p className="p-5 text-[13.5px] text-slate">
            {rows.length ? "Bu filtrede kelime yok." : "Veri yok. \"Geçmişi yükle\" ile Search Console verisini çekin."}
          </p>
        ) : (
          <table className="w-full min-w-[860px] text-[13.5px]">
            <thead>
              <tr className="border-b border-line text-left text-[12px] text-slate">
                <th className="px-4 py-2.5 font-medium">Anahtar kelime</th>
                <th className="px-2 py-2.5 text-right font-medium">Sıra</th>
                <th className="px-2 py-2.5 text-right font-medium">Değişim</th>
                <th className="px-2 py-2.5 text-right font-medium">Gösterim</th>
                <th className="px-2 py-2.5 text-right font-medium">Tıklama</th>
                <th className="px-2 py-2.5 text-right font-medium">TO</th>
                <th className="px-4 py-2.5 font-medium">Çıkan sayfa</th>
              </tr>
            </thead>
            <tbody>
              {visible.slice(0, 500).map((r) => {
                const ch = change(r);
                const pos = n(r.position);
                return (
                  <FragmentRow key={r.query} open={open === r.query}>
                    <tr onClick={() => openQuery(r.query)} className="cursor-pointer border-b border-line last:border-0 hover:bg-paper">
                      <td className="px-4 py-2.5 font-medium text-ink">
                        {r.query}
                        {r.prev_position == null && (
                          <span className="ml-2 rounded-full bg-sun/20 px-2 py-0.5 text-[11px] font-semibold text-ink">yeni</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <span
                          className={`inline-block min-w-12 rounded-full px-2 py-0.5 text-center font-semibold tabular-nums ${
                            pos != null && pos <= 3
                              ? "bg-volt/15 text-ink"
                              : pos != null && pos <= 10
                                ? "bg-brand/10 text-ink"
                                : pos != null && pos <= 20
                                  ? "bg-sun/20 text-ink"
                                  : "text-slate"
                          }`}
                        >
                          {fmtPos(pos)}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums">
                        {ch == null ? (
                          <span className="text-slate-soft">–</span>
                        ) : Math.abs(ch) < 0.5 ? (
                          <span className="text-slate">0</span>
                        ) : ch > 0 ? (
                          <span className="inline-flex items-center gap-0.5 font-semibold text-volt">
                            <ArrowUp size={13} /> {fmtPos(ch)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 font-semibold text-red-600">
                            <ArrowDown size={13} /> {fmtPos(-ch)}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{fmt(Number(r.impressions))}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{fmt(Number(r.clicks))}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-slate">%{fmtPos(n(r.ctr))}</td>
                      <td className="max-w-[280px] truncate px-4 py-2.5 text-[12.5px] text-slate" title={r.top_page ?? ""}>
                        {pathOf(r.top_page)}
                      </td>
                    </tr>
                    {open === r.query && (
                      <tr className="border-b border-line bg-paper">
                        <td colSpan={7} className="px-4 py-4">
                          <QueryChart data={daily} />
                        </td>
                      </tr>
                    )}
                  </FragmentRow>
                );
              })}
            </tbody>
          </table>
        )}
        {visible.length > 500 && <p className="p-3 text-[12px] text-slate">İlk 500 kelime gösteriliyor; aramayla daraltın.</p>}
      </div>
    </div>
  );
}

function FragmentRow({ children }: { children: React.ReactNode; open: boolean }) {
  return <>{children}</>;
}

/** Günlük sıra (çizgi, ters eksen: yukarı = daha iyi) ve gösterim (çubuk). */
function QueryChart({ data }: { data: Daily[] | null }) {
  if (!data) return <p className="text-[13px] text-slate">Yükleniyor…</p>;
  const pts = data.filter((d) => d.position != null);
  if (!pts.length) return <p className="text-[13px] text-slate">Bu kelime için günlük veri yok.</p>;
  const W = 820;
  const H = 180;
  const pad = { l: 34, r: 10, t: 10, b: 22 };
  const maxPos = Math.max(10, ...pts.map((d) => Number(d.position)));
  const maxImp = Math.max(1, ...data.map((d) => Number(d.impressions)));
  const x = (i: number) => pad.l + (i / Math.max(1, data.length - 1)) * (W - pad.l - pad.r);
  const y = (p: number) => pad.t + ((p - 1) / (maxPos - 1)) * (H - pad.t - pad.b);
  const line = data
    .map((d, i) => (d.position == null ? null : `${x(i)},${y(Number(d.position))}`))
    .filter(Boolean)
    .join(" ");
  const ticks = [1, Math.round(maxPos / 2), Math.round(maxPos)];
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[820px]" role="img" aria-label="Günlük sıra grafiği">
        {data.map((d, i) => {
          const h = (Number(d.impressions) / maxImp) * (H - pad.t - pad.b) * 0.6;
          return <rect key={d.date} x={x(i) - 2} y={H - pad.b - h} width={4} height={h} className="fill-brand/15" />;
        })}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="stroke-line" strokeDasharray="3 3" />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="fill-slate text-[10px]">
              {t}
            </text>
          </g>
        ))}
        <polyline points={line} fill="none" className="stroke-ink" strokeWidth={2} />
        <text x={pad.l} y={H - 4} className="fill-slate text-[10px]">
          {data[0].date}
        </text>
        <text x={W - pad.r} y={H - 4} textAnchor="end" className="fill-slate text-[10px]">
          {data[data.length - 1].date}
        </text>
      </svg>
      <p className="mt-1 text-[12px] text-slate">Çizgi: günlük ortalama sıra (yukarısı daha iyi). Çubuklar: günlük gösterim.</p>
    </div>
  );
}
