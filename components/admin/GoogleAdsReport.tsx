"use client";

import { useEffect, useState } from "react";
import type { GoogleAdsReport as Report } from "@/lib/ga";

// Admin "Reklamlar" → Google Ads sekmesi. Veri Google Analytics'e bağlı Google Ads
// hesaplarından gelir (maliyet, tıklama, gösterim; dönüşüm = reklamdan gelen ziyaretteki
// önemli etkinlik: form, WhatsApp, telefon).

const DAYS = [7, 14, 30, 90, 365];
const EVENT: Record<string, string> = {
  whatsapp_click: "WhatsApp tıklaması",
  phone_call_click: "Telefon tıklaması",
  generate_lead: "Form başvurusu",
};
const tl = (n: number) =>
  `${n.toLocaleString("tr-TR", { maximumFractionDigits: n < 100 ? 2 : 0 })} TL`;
const fmt = (n: number) => Math.round(n).toLocaleString("tr-TR");

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

export default function GoogleAdsReport() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/ga?tip=googleads&gun=${days}`, { cache: "no-store" })
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
  }, [days]);

  const t = data?.total;
  const maxDay = Math.max(1, ...(data?.daily.map((d) => d.cost) ?? [1]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13.5px] text-slate">
          Google Ads (Analytics bağlantısı üzerinden), dünkü güne kadar.
        </p>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="admin-input w-44"
        >
          {DAYS.map((d) => (
            <option key={d} value={d}>
              Son {d} gün
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13.5px] text-red-700">
          {error}
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
              value={tl(t.cost)}
              sub={`${fmt(t.impressions)} gösterim`}
            />
            <Card
              label="Dönüşüm"
              value={fmt(t.keyEvents)}
              sub="form + WhatsApp + telefon"
            />
            <Card
              label="Dönüşüm başı"
              value={t.keyEvents ? tl(t.cost / t.keyEvents) : "–"}
            />
            <Card
              label="Tıklama"
              value={fmt(t.clicks)}
              sub={`tıklama başı ${t.clicks ? tl(t.cost / t.clicks) : "–"}`}
            />
          </div>

          {data.daily.length > 1 && (
            <div className="rounded-2xl border border-line bg-paper-raised p-5">
              <p className="text-[14px] font-semibold">
                Günlük harcama ve dönüşüm
              </p>
              <div className="mt-4 flex h-36 items-end gap-[3px]">
                {data.daily.map((d) => (
                  <div
                    key={d.date}
                    className="group relative flex h-full flex-1 items-end"
                  >
                    <div
                      className="w-full rounded-t bg-brand/70 group-hover:bg-brand"
                      style={{ height: `${(d.cost / maxDay) * 100}%` }}
                    />
                    {d.keyEvents > 0 && (
                      <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-volt">
                        {d.keyEvents}
                      </span>
                    )}
                    <span className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[11px] text-paper group-hover:block">
                      {d.date.slice(6, 8)}.{d.date.slice(4, 6)} · {tl(d.cost)} ·{" "}
                      {d.keyEvents} dönüşüm
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <section className="rounded-2xl border border-line bg-paper-raised p-5">
            <p className="text-[14px] font-semibold">Kampanyalar</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13px]">
                <thead className="text-[12px] text-slate">
                  <tr>
                    <th className="py-2 pr-3">Kampanya</th>
                    <th className="pr-3 text-right">Harcama</th>
                    <th className="pr-3 text-right">Tıklama</th>
                    <th className="pr-3 text-right">Ziyaret</th>
                    <th className="pr-3 text-right">Dönüşüm</th>
                    <th className="text-right">Dönüşüm başı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.campaigns.map((c) => (
                    <tr key={c.name}>
                      <td
                        className="max-w-[320px] truncate py-2 pr-3 font-medium"
                        title={c.name}
                      >
                        {c.name}
                      </td>
                      <td className="pr-3 text-right tabular-nums">
                        {tl(c.cost)}
                      </td>
                      <td className="pr-3 text-right tabular-nums">
                        {fmt(c.clicks)}
                      </td>
                      <td className="pr-3 text-right tabular-nums">
                        {fmt(c.sessions)}
                      </td>
                      <td className="pr-3 text-right font-semibold tabular-nums">
                        {fmt(c.keyEvents)}
                      </td>
                      <td className="text-right tabular-nums">
                        {c.keyEvents ? tl(c.cost / c.keyEvents) : "–"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.campaigns.length === 0 && (
                <p className="mt-2 text-[13px] text-slate-soft">
                  Bu dönemde Google Ads harcaması yok.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-paper-raised p-5">
            <p className="text-[14px] font-semibold">Dönüşümlerin türü</p>
            <ul className="mt-3 flex flex-col gap-1.5 text-[13.5px]">
              {data.events.map((e) => (
                <li key={e.label} className="flex justify-between">
                  <span>{EVENT[e.label] ?? e.label}</span>
                  <strong className="tabular-nums">{fmt(e.value)}</strong>
                </li>
              ))}
              {data.events.length === 0 && (
                <li className="text-slate-soft">Veri yok.</li>
              )}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
