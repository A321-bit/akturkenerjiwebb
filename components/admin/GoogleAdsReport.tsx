"use client";

import { useCallback, useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { GoogleAdsApiReport as Report } from "@/lib/google-ads";

// Admin "Reklamlar" → Google Ads sekmesi. Veri doğrudan Google Ads API'den (hesap
// 334-276-8968): kampanya durumu, bütçe, performans, dönüşüm türleri, arama terimleri.
// Durdur/aç ve günlük bütçe değişikliği buradan yapılır (her biri onay sorar).

const DAYS = [7, 14, 30, 90, 365];
const TYPE: Record<string, string> = {
  SEARCH: "Arama",
  PERFORMANCE_MAX: "Maks. Performans",
  DISPLAY: "Görüntülü",
  VIDEO: "Video",
  SHOPPING: "Alışveriş",
};
const STATUS: Record<string, { label: string; cls: string }> = {
  ENABLED: { label: "Aktif", cls: "bg-volt/15 text-ink" },
  PAUSED: { label: "Durduruldu", cls: "bg-paper text-slate" },
};
const tl = (n: number) => `${n.toLocaleString("tr-TR", { maximumFractionDigits: n < 100 ? 2 : 0 })} TL`;
const fmt = (n: number) => Math.round(n).toLocaleString("tr-TR");
/** Dönüşüm adındaki "Aktürk Enerji Web (web) whatsapp_click" gibi önekleri sadeleştirir. */
const actionLabel = (s: string) =>
  s.includes("whatsapp_click") ? "WhatsApp tıklaması" : s.includes("phone_call_click") ? "Telefon tıklaması (site)" : s === "Calls from ads" ? "Reklamdan arama" : s;

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
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
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    return fetch(`/api/admin/google-ads?gun=${days}`, { cache: "no-store" })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? `Hata ${res.status}`);
        setData(body);
        setError("");
      })
      .catch((e) => setError(e.message));
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(body: object, done: string) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/google-ads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "İşlem yapılamadı.");
      setMsg(done);
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const t = data?.total;
  const maxDay = Math.max(1, ...(data?.daily.map((d) => d.cost) ?? [1]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13.5px] text-slate">
          Google Ads hesabı 334-276-8968, canlı veri{data ? ` (${data.from} – ${data.to})` : ""}.
        </p>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="admin-input w-44">
          {DAYS.map((d) => (
            <option key={d} value={d}>
              Son {d} gün
            </option>
          ))}
        </select>
      </div>
      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13.5px] text-red-700">{error}</p>}
      {msg && <p className="rounded-xl bg-paper-raised px-4 py-3 text-[13.5px] text-volt">{msg}</p>}
      {!data && !error && <p className="text-[13.5px] text-slate">Veriler yükleniyor…</p>}
      {t && data && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card label="Harcama" value={tl(t.cost)} sub={`${fmt(t.impressions)} gösterim`} />
            <Card label="Dönüşüm" value={fmt(t.conversions)} sub="WhatsApp + telefon + form" />
            <Card label="Dönüşüm başı" value={t.conversions ? tl(t.cost / t.conversions) : "–"} />
            <Card label="Tıklama" value={fmt(t.clicks)} sub={`tıklama başı ${t.clicks ? tl(t.cost / t.clicks) : "–"}`} />
          </div>

          {data.daily.length > 1 && (
            <div className="rounded-2xl border border-line bg-paper-raised p-5">
              <p className="text-[14px] font-semibold">Günlük harcama ve dönüşüm</p>
              <div className="mt-4 flex h-36 items-end gap-[3px]">
                {data.daily.map((d) => (
                  <div key={d.date} className="group relative flex h-full flex-1 items-end">
                    <div className="w-full rounded-t bg-brand/70 group-hover:bg-brand" style={{ height: `${(d.cost / maxDay) * 100}%` }} />
                    {d.conversions > 0 && (
                      <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-volt">{fmt(d.conversions)}</span>
                    )}
                    <span className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[11px] text-paper group-hover:block">
                      {d.date.slice(8, 10)}.{d.date.slice(5, 7)} · {tl(d.cost)} · {fmt(d.conversions)} dönüşüm
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <section className="rounded-2xl border border-line bg-paper-raised p-5">
            <p className="text-[14px] font-semibold">Kampanyalar</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-[13px]">
                <thead className="text-[12px] text-slate">
                  <tr>
                    <th className="py-2 pr-3">Kampanya</th>
                    <th className="pr-3">Durum</th>
                    <th className="pr-3 text-right">Günlük bütçe</th>
                    <th className="pr-3 text-right">Harcama</th>
                    <th className="pr-3 text-right">Tıklama</th>
                    <th className="pr-3 text-right">Dönüşüm</th>
                    <th className="pr-3 text-right">Dönüşüm başı</th>
                    <th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.campaigns.map((c) => {
                    const st = STATUS[c.status] ?? { label: c.status, cls: "bg-paper text-slate" };
                    return (
                      <tr key={c.id}>
                        <td className="max-w-[300px] py-2 pr-3">
                          <p className="truncate font-medium" title={c.name}>
                            {c.name}
                          </p>
                          <p className="text-[11.5px] text-slate-soft">{TYPE[c.type] ?? c.type}</p>
                        </td>
                        <td className="pr-3">
                          <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="pr-3 text-right tabular-nums">
                          <button
                            type="button"
                            disabled={busy || !c.budgetResource}
                            title="Bütçeyi değiştir"
                            onClick={() => {
                              const v = prompt(`"${c.name}" için yeni günlük bütçe (TL):`, String(c.dailyBudget));
                              const amount = v ? Number(v.replace(",", ".")) : NaN;
                              if (!amount || amount === c.dailyBudget) return;
                              if (!confirm(`Günlük bütçe ${tl(c.dailyBudget)} → ${tl(amount)} olacak. Onaylıyor musunuz?`)) return;
                              act({ action: "butce", budgetResource: c.budgetResource, amount }, `Bütçe güncellendi: ${tl(amount)}/gün.`);
                            }}
                            className="underline decoration-dotted underline-offset-2 hover:text-brand disabled:no-underline"
                          >
                            {tl(c.dailyBudget)}
                          </button>
                        </td>
                        <td className="pr-3 text-right tabular-nums">{tl(c.cost)}</td>
                        <td className="pr-3 text-right tabular-nums">{fmt(c.clicks)}</td>
                        <td className="pr-3 text-right font-semibold tabular-nums">{fmt(c.conversions)}</td>
                        <td className="pr-3 text-right tabular-nums">{c.conversions ? tl(c.cost / c.conversions) : "–"}</td>
                        <td className="text-right">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              const next = c.status === "ENABLED" ? "PAUSED" : "ENABLED";
                              if (!confirm(`"${c.name}" ${next === "PAUSED" ? "durdurulsun" : "yeniden yayına alınsın"} mı?`)) return;
                              act({ action: "durum", campaignId: c.id, status: next }, next === "PAUSED" ? "Kampanya durduruldu." : "Kampanya yayına alındı.");
                            }}
                            className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[12px] font-semibold hover:border-ink disabled:opacity-40"
                          >
                            {c.status === "ENABLED" ? (
                              <>
                                <Pause size={12} /> Durdur
                              </>
                            ) : (
                              <>
                                <Play size={12} /> Aç
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-2xl border border-line bg-paper-raised p-5">
              <p className="text-[14px] font-semibold">Dönüşümlerin türü</p>
              <ul className="mt-3 flex flex-col gap-1.5 text-[13.5px]">
                {data.conversionActions.map((e) => (
                  <li key={e.label} className="flex justify-between gap-3">
                    <span className="truncate">{actionLabel(e.label)}</span>
                    <strong className="tabular-nums">{fmt(e.value)}</strong>
                  </li>
                ))}
                {data.conversionActions.length === 0 && <li className="text-slate-soft">Veri yok.</li>}
              </ul>
            </section>

            <section className="rounded-2xl border border-line bg-paper-raised p-5">
              <p className="text-[14px] font-semibold">Arama terimleri (en çok harcanan)</p>
              <ul className="mt-3 flex flex-col gap-1.5 text-[13px]">
                {data.searchTerms.slice(0, 15).map((s) => (
                  <li key={s.term} className="flex justify-between gap-3">
                    <span className="min-w-0 truncate" title={s.term}>
                      {s.term}
                    </span>
                    <span className="shrink-0 tabular-nums text-slate">
                      {tl(s.cost)} · {fmt(s.clicks)} tık · <strong className="text-ink">{fmt(s.conversions)}</strong>
                    </span>
                  </li>
                ))}
                {data.searchTerms.length === 0 && <li className="text-slate-soft">Veri yok.</li>}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
