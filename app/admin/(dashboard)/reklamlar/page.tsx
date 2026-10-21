"use client";

import { useEffect, useState } from "react";
import type { AdsPeriod, AdsReport, Brand, Metrics } from "@/lib/meta-ads";

const PERIODS: { key: AdsPeriod; label: string }[] = [
  { key: "last_7d", label: "Son 7 gün" },
  { key: "last_14d", label: "Son 14 gün" },
  { key: "last_28d", label: "Son 28 gün" },
  { key: "last_90d", label: "Son 90 gün" },
  { key: "this_month", label: "Bu ay" },
  { key: "last_month", label: "Geçen ay" },
  { key: "maximum", label: "Tüm zamanlar" },
];
const BRAND_TABS: { key: Brand; label: string }[] = [
  { key: "akturk", label: "Aktürk Enerji" },
  { key: "gunesdukkan", label: "GüneşDükkan" },
  { key: "tumu", label: "Tümü" },
];
const STATUS: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: "Aktif", cls: "bg-volt/15 text-ink" },
  PAUSED: { label: "Durduruldu", cls: "bg-paper text-slate" },
  CAMPAIGN_PAUSED: { label: "Kampanya durdu", cls: "bg-paper text-slate" },
  ADSET_PAUSED: { label: "Set durdu", cls: "bg-paper text-slate" },
  WITH_ISSUES: { label: "Sorunlu", cls: "bg-red-50 text-red-700" },
  DISAPPROVED: { label: "Reddedildi", cls: "bg-red-50 text-red-700" },
  IN_PROCESS: { label: "İnceleniyor", cls: "bg-sun/20 text-ink" },
  PENDING_REVIEW: { label: "İnceleniyor", cls: "bg-sun/20 text-ink" },
};

const tl = (n: number) =>
  `${n.toLocaleString("tr-TR", { maximumFractionDigits: n < 100 ? 2 : 0 })} TL`;
const fmt = (n: number) => Math.round(n).toLocaleString("tr-TR");
/** Sonuç: form başvurusu + mesaj başlatma (+ pikseldeki WhatsApp/telefon tıklaması). */
const results = (m: Metrics) => m.leads + m.messages + m.contacts;
const cpr = (m: Metrics) => (results(m) ? tl(m.spend / results(m)) : "–");
const ctr = (m: Metrics) =>
  m.impressions
    ? `%${((m.linkClicks / m.impressions) * 100).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`
    : "–";

function Card({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper-raised p-5">
      <p className="text-[13px] text-slate">{label}</p>
      <p className="mt-1 font-mono-data text-[1.6rem] font-bold">{value}</p>
      {sub && <p className="text-[12.5px] text-slate-soft">{sub}</p>}
    </div>
  );
}

function Badge({ s }: { s: string }) {
  const st = STATUS[s] ?? {
    label: s.toLowerCase().replaceAll("_", " "),
    cls: "bg-paper text-slate",
  };
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] ${st.cls}`}
    >
      {st.label}
    </span>
  );
}

/** Kırılım tablosu (yaş/cinsiyet, bölge, yerleşim): harcama, sonuç, sonuç başı maliyet. */
function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: (Metrics & { label: string })[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.spend));
  return (
    <div className="rounded-2xl border border-line bg-paper-raised p-5">
      <p className="text-[14px] font-semibold">{title}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-[13px] text-slate-soft">Veri yok.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {rows.slice(0, 10).map((r) => (
            <li key={r.label} className="text-[13px]">
              <div className="flex justify-between gap-3">
                <span className="min-w-0 truncate">
                  {r.label || "(belirsiz)"}
                </span>
                <span className="shrink-0 tabular-nums">
                  {tl(r.spend)} · <strong>{fmt(results(r))}</strong> sonuç ·{" "}
                  {cpr(r)}
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-ink/5">
                <div
                  className="h-1.5 rounded-full bg-brand/70"
                  style={{ width: `${(r.spend / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdsPage() {
  const [period, setPeriod] = useState<AdsPeriod>("last_7d");
  const [brand, setBrand] = useState<Brand>("akturk");
  const [data, setData] = useState<AdsReport | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/ads?donem=${period}&marka=${brand}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? `Hata ${res.status}`);
        if (alive) {
          setData(body);
          setError("");
        }
      })
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [period, brand]);

  const t = data?.total;
  const maxDay = Math.max(1, ...(data?.daily.map((d) => d.spend) ?? [1]));
  const table = "w-full min-w-[720px] text-left text-[13px]";

  return (
    <div className="flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono-data text-[11px] uppercase tracking-[0.16em] text-brand">
            Meta Reklamları
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold">
            Reklam Performansı
          </h1>
          <p className="mt-1 text-[13.5px] text-slate">
            Facebook + Instagram reklam hesabı (188346112), canlı veri.
            Reklamlar yayınlandıkları sayfaya göre markaya ayrılır.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-full border border-line p-0.5">
            {BRAND_TABS.map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={() => setBrand(b.key)}
                className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ${brand === b.key ? "bg-ink text-paper" : "text-slate hover:text-ink"}`}
              >
                {b.label}
              </button>
            ))}
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as AdsPeriod)}
            className="admin-input w-44"
          >
            {PERIODS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13.5px] text-red-700">
          {error}
          {/permission|ads_read|ads_management|#200|#10\b/i.test(error) &&
            " → Erişim anahtarında reklam izni yok: sistem kullanıcısı için ads_read ve ads_management izinli yeni anahtar üretilip Vercel'e yapıştırılmalı."}
        </p>
      )}
      {!data && !error && (
        <p className="text-[13.5px] text-slate">Veriler yükleniyor…</p>
      )}

      {t && data && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card
              label="Harcama"
              value={tl(t.spend)}
              sub={`${fmt(t.impressions)} gösterim · ${fmt(t.reach)} kişi`}
            />
            <Card
              label="Sonuç"
              value={fmt(results(t))}
              sub={`${fmt(t.leads)} form · ${fmt(t.messages)} mesaj · ${fmt(t.contacts)} WhatsApp/tel`}
            />
            <Card
              label="Sonuç başı maliyet"
              value={cpr(t)}
              sub={t.leads ? `form başı ${tl(t.spend / t.leads)}` : undefined}
            />
            <Card
              label="Link tıklaması"
              value={fmt(t.linkClicks)}
              sub={`TO ${ctr(t)} · sıklık ${t.frequency.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`}
            />
          </div>

          {data.daily.length > 1 && (
            <div className="rounded-2xl border border-line bg-paper-raised p-5">
              <p className="text-[14px] font-semibold">
                Günlük harcama ve sonuç
              </p>
              <div className="mt-4 flex h-36 items-end gap-[3px]">
                {data.daily.map((d) => (
                  <div
                    key={d.date}
                    className="group relative flex h-full flex-1 items-end"
                  >
                    <div
                      className="w-full rounded-t bg-brand/70 group-hover:bg-brand"
                      style={{ height: `${(d.spend / maxDay) * 100}%` }}
                    />
                    {results(d) > 0 && (
                      <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-volt">
                        {results(d)}
                      </span>
                    )}
                    <span className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[11px] text-paper group-hover:block">
                      {d.date.slice(8, 10)}.{d.date.slice(5, 7)} · {tl(d.spend)}{" "}
                      · {results(d)} sonuç
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <section className="rounded-2xl border border-line bg-paper-raised p-5">
            <p className="text-[14px] font-semibold">Kampanyalar</p>
            <div className="mt-3 overflow-x-auto">
              <table className={table}>
                <thead className="text-[12px] text-slate">
                  <tr>
                    <th className="py-2 pr-3">Kampanya</th>
                    <th className="pr-3">Durum</th>
                    <th className="pr-3 text-right">Günlük bütçe</th>
                    <th className="pr-3 text-right">Harcama</th>
                    <th className="pr-3 text-right">Sonuç</th>
                    <th className="pr-3 text-right">Sonuç başı</th>
                    <th className="pr-3 text-right">TO</th>
                    <th className="text-right">Sıklık</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.campaigns.map((c) => (
                    <tr key={c.id}>
                      <td
                        className="max-w-[260px] truncate py-2 pr-3 font-medium"
                        title={c.name}
                      >
                        {c.name}
                      </td>
                      <td className="pr-3">
                        <Badge s={c.status} />
                      </td>
                      <td className="pr-3 text-right tabular-nums">
                        {c.dailyBudget ? tl(c.dailyBudget) : "–"}
                      </td>
                      <td className="pr-3 text-right tabular-nums">
                        {tl(c.spend)}
                      </td>
                      <td className="pr-3 text-right font-semibold tabular-nums">
                        {fmt(results(c))}
                      </td>
                      <td className="pr-3 text-right tabular-nums">{cpr(c)}</td>
                      <td className="pr-3 text-right tabular-nums">{ctr(c)}</td>
                      <td className="text-right tabular-nums">
                        {c.frequency.toLocaleString("tr-TR", {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.campaigns.length === 0 && (
                <p className="mt-2 text-[13px] text-slate-soft">
                  Bu dönemde harcama yok.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-paper-raised p-5">
            <p className="text-[14px] font-semibold">Reklamlar (kreatifler)</p>
            <ul className="mt-3 divide-y divide-line">
              {data.ads.map((a) => (
                <li key={a.id} className="flex gap-3 py-3">
                  {a.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element -- Meta'nın geçici küçük resim adresi
                    <img
                      src={a.thumbnail}
                      alt=""
                      width={64}
                      height={64}
                      className="h-16 w-16 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 shrink-0 rounded-md bg-paper" />
                  )}
                  <div className="min-w-0 flex-1 text-[13px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{a.name}</span>
                      <Badge s={a.status} />
                    </div>
                    <p className="truncate text-[12px] text-slate-soft">
                      {a.campaign} › {a.adset}
                    </p>
                    {a.body && (
                      <p className="mt-0.5 line-clamp-2 text-[12.5px] text-slate">
                        {a.body}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right text-[12.5px] tabular-nums">
                    <p>{tl(a.spend)}</p>
                    <p className="font-semibold">{fmt(results(a))} sonuç</p>
                    <p className="text-slate">{cpr(a)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <Breakdown title="Yaş ve cinsiyet" rows={data.demographics} />
            <Breakdown title="Bölge" rows={data.regions} />
            <Breakdown
              title="Yerleşim (nerede gösterildi)"
              rows={data.placements}
            />
          </div>
        </>
      )}
    </div>
  );
}
