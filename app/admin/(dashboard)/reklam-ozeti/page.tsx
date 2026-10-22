"use client";

import { useEffect, useState } from "react";

// Reklam Özeti: Google + Meta harcaması ile gelen talepler (site formu, Meta anlık form,
// WhatsApp ve telefon tıklamaları) yan yana; talep başı maliyet ve form sonuç hunisi.

type ReklamOzeti = {
  days: number;
  from: string;
  to: string;
  totals: Record<"googleCost" | "googleClicks" | "googleConversions" | "metaSpend" | "metaClicks" | "metaLeads" | "siteLeads" | "formLeads" | "whatsapp" | "phone", number>;
  daily: { date: string; googleCost: number; metaSpend: number; googleClicks: number; metaClicks: number; siteLeads: number; formLeads: number; whatsapp: number; phone: number }[];
  siteBySource: Record<string, number>;
  formFunnel: Record<string, number>;
  googleCampaigns: { id: string; name: string; status: string; type: string; dailyBudget: number; cost: number; clicks: number; impressions: number; conversions: number }[];
  metaCampaigns: { id: string; name: string; status: string; spend: number; linkClicks: number; leads: number }[];
  errors: Record<string, string | null>;
};

const DAYS = [7, 14, 30, 90];
const tl = (n: number) => `${n.toLocaleString("tr-TR", { maximumFractionDigits: n < 100 ? 2 : 0 })} TL`;
const fmt = (n: number) => Math.round(n).toLocaleString("tr-TR");
const FUNNEL = ["Yeni", "Ulaşılamadı", "İlgisiz", "Nitelikli", "Keşif Planlandı", "Teklif Verildi", "Satış"];
const SOURCES: Record<string, string> = { googleCost: "Google Ads", metaSpend: "Meta" };

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper-raised p-5">
      <p className="text-[13px] text-slate">{label}</p>
      <p className="mt-1 font-mono-data text-[1.6rem] font-bold">{value}</p>
      {sub && <p className="text-[12.5px] text-slate-soft">{sub}</p>}
    </div>
  );
}

export default function ReklamOzetiPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<ReklamOzeti | null>(null);
  const [error, setError] = useState("");
  const [reportMsg, setReportMsg] = useState("");

  async function sendReport() {
    if (!confirm("Günlük rapor şimdi e-postayla gönderilsin mi?")) return;
    setReportMsg("Gönderiliyor…");
    const res = await fetch("/api/admin/daily-report", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setReportMsg(res.ok ? "Rapor e-postayla gönderildi." : `Gönderilemedi: ${body.error ?? res.status}`);
  }

  useEffect(() => {
    fetch(`/api/admin/reklam-ozeti?gun=${days}`, { cache: "no-store" })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? `Hata ${res.status}`);
        setData(body);
        setError("");
      })
      .catch((e) => setError(e.message));
  }, [days]);

  const t = data?.totals;
  const spend = t ? t.googleCost + t.metaSpend : 0;
  const contacts = t ? t.siteLeads + t.formLeads + t.whatsapp + t.phone : 0;
  const maxDay = Math.max(1, ...(data?.daily ?? []).map((d) => d.googleCost + d.metaSpend));
  const maxContacts = Math.max(1, ...(data?.daily ?? []).map((d) => d.siteLeads + d.formLeads + d.whatsapp + d.phone));
  const failed = Object.entries(data?.errors ?? {}).filter(([, e]) => e);
  const funnelTotal = Object.values(data?.formFunnel ?? {}).reduce((s, n) => s + n, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono-data text-[11px] uppercase tracking-[0.16em] text-brand">Reklamlar</p>
          <h1 className="mt-1 font-display text-2xl font-semibold">Reklam Özeti</h1>
          <p className="mt-1 text-[13.5px] text-slate">
            Google + Meta harcaması ve gelen talepler tek ekranda{data ? ` · ${data.from} – ${data.to}` : ""}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href="/api/admin/daily-report" target="_blank" className="rounded-xl border border-line px-3 py-2 text-[13px] hover:bg-paper">
            Günlük raporu önizle
          </a>
          <button onClick={sendReport} className="rounded-xl border border-line px-3 py-2 text-[13px] hover:bg-paper">
            Raporu şimdi gönder
          </button>
          <select value={days} onChange={(e) => {
            setData(null);
            setDays(Number(e.target.value));
          }} className="admin-input w-44">
          {DAYS.map((d) => (
            <option key={d} value={d}>
              Son {d} gün
            </option>
          ))}
          </select>
        </div>
      </div>
      {reportMsg && <p className="text-[13px] text-slate">{reportMsg} Her akşam 22:30&apos;da otomatik gönderilir.</p>}

      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13.5px] text-red-700">{error}</p>}
      {!data && !error && <p className="text-[13.5px] text-slate">Veriler yükleniyor (Google, Meta, Analytics)…</p>}
      {failed.length > 0 && (
        <div className="rounded-xl border border-sun/40 bg-sun/10 p-4 text-[13px]">
          {failed.map(([k, e]) => (
            <p key={k}>
              <b>{{ google: "Google Ads", meta: "Meta", ga: "Analytics", site: "Site talepleri", form: "Meta formları" }[k] ?? k}:</b> {e}
            </p>
          ))}
        </div>
      )}

      {data && t && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card label="Toplam reklam harcaması" value={tl(spend)} sub={`Google ${tl(t.googleCost)} · Meta ${tl(t.metaSpend)}`} />
            <Card label="Gelen iletişim" value={fmt(contacts)} sub={`form ${t.siteLeads + t.formLeads} · WhatsApp ${t.whatsapp} · telefon ${t.phone}`} />
            <Card label="İletişim başı maliyet" value={contacts ? tl(spend / contacts) : "—"} sub="harcama ÷ tüm iletişimler (organik dahil)" />
            <Card label="Reklam tıklaması" value={fmt(t.googleClicks + t.metaClicks)} sub={`Google ${fmt(t.googleClicks)} · Meta ${fmt(t.metaClicks)}`} />
            <Card label="Site teklif formu" value={fmt(t.siteLeads)} sub={Object.entries(data.siteBySource).map(([k, v]) => `${k} ${v}`).join(" · ") || "talep yok"} />
            <Card label="Meta anlık form" value={fmt(t.formLeads)} sub={t.formLeads && t.metaSpend ? `form başı ${tl(t.metaSpend / t.formLeads)}` : undefined} />
            <Card label="Google dönüşüm" value={fmt(t.googleConversions)} sub={t.googleConversions ? `dönüşüm başı ${tl(t.googleCost / t.googleConversions)}` : undefined} />
            <Card label="WhatsApp + telefon tıklaması" value={fmt(t.whatsapp + t.phone)} sub="sitedeki butonlar (Analytics)" />
          </div>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-line bg-paper-raised p-5">
              <p className="text-[14px] font-semibold">Günlük harcama</p>
              <p className="text-[12px] text-slate-soft">
                <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-brand/70" />
                {SOURCES.googleCost} <span className="ml-3 mr-1 inline-block h-2 w-2 rounded-sm bg-volt/70" />
                {SOURCES.metaSpend}
              </p>
              <div className="mt-4 flex h-36 items-end gap-[3px]">
                {data.daily.map((d) => (
                  <div key={d.date} className="group relative flex h-full flex-1 flex-col justify-end">
                    <div className="w-full rounded-t bg-volt/70" style={{ height: `${(d.metaSpend / maxDay) * 100}%` }} />
                    <div className="w-full bg-brand/70" style={{ height: `${(d.googleCost / maxDay) * 100}%` }} />
                    <span className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[11px] text-paper group-hover:block">
                      {d.date.slice(5)} · G {tl(d.googleCost)} · M {tl(d.metaSpend)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-paper-raised p-5">
              <p className="text-[14px] font-semibold">Günlük gelen iletişim</p>
              <p className="text-[12px] text-slate-soft">form (site + Meta) · WhatsApp · telefon</p>
              <div className="mt-4 flex h-36 items-end gap-[3px]">
                {data.daily.map((d) => {
                  const forms = d.siteLeads + d.formLeads;
                  return (
                    <div key={d.date} className="group relative flex h-full flex-1 flex-col justify-end">
                      <div className="w-full rounded-t bg-sun/70" style={{ height: `${(d.phone / maxContacts) * 100}%` }} />
                      <div className="w-full bg-volt/70" style={{ height: `${(d.whatsapp / maxContacts) * 100}%` }} />
                      <div className="w-full bg-brand/70" style={{ height: `${(forms / maxContacts) * 100}%` }} />
                      <span className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[11px] text-paper group-hover:block">
                        {d.date.slice(5)} · form {forms} · WA {d.whatsapp} · tel {d.phone}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-line bg-paper-raised p-5">
              <p className="text-[14px] font-semibold">Meta form sonuçları</p>
              <p className="text-[12px] text-slate-soft">Personelin &quot;Meta Formları&quot; ekranında seçtiği durumlar</p>
              {funnelTotal === 0 ? (
                <p className="mt-3 text-[13px] text-slate">Bu dönemde form başvurusu yok.</p>
              ) : (
                <div className="mt-3 flex flex-col gap-2">
                  {FUNNEL.filter((s) => data.formFunnel[s]).map((s) => (
                    <div key={s} className="flex items-center gap-3 text-[13px]">
                      <span className="w-32 shrink-0">{s}</span>
                      <div className="h-2.5 flex-1 rounded-full bg-paper">
                        <div className="h-full rounded-full bg-brand/70" style={{ width: `${(data.formFunnel[s] / funnelTotal) * 100}%` }} />
                      </div>
                      <span className="w-10 text-right font-mono-data">{data.formFunnel[s]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-line bg-paper-raised p-5">
              <p className="text-[14px] font-semibold">Kampanyalar</p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[460px] text-left text-[13px]">
                  <thead className="text-[12px] text-slate">
                    <tr>
                      <th className="py-2 pr-3">Kampanya</th>
                      <th className="pr-3 text-right">Harcama</th>
                      <th className="pr-3 text-right">Tıklama</th>
                      <th className="text-right">Sonuç</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.googleCampaigns.map((c) => (
                      <tr key={`g${c.id}`} className="border-t border-line">
                        <td className="py-2 pr-3">
                          <span className="mr-1.5 rounded bg-brand/10 px-1 text-[11px] text-brand">G</span>
                          {c.name}
                          {c.status !== "ENABLED" && <span className="ml-1 text-[11px] text-slate-soft">(durduruldu)</span>}
                        </td>
                        <td className="pr-3 text-right font-mono-data">{tl(c.cost)}</td>
                        <td className="pr-3 text-right font-mono-data">{fmt(c.clicks)}</td>
                        <td className="text-right font-mono-data">{fmt(c.conversions)}</td>
                      </tr>
                    ))}
                    {data.metaCampaigns.map((c) => (
                      <tr key={`m${c.id}`} className="border-t border-line">
                        <td className="py-2 pr-3">
                          <span className="mr-1.5 rounded bg-volt/15 px-1 text-[11px]">M</span>
                          {c.name}
                          {c.status !== "ACTIVE" && <span className="ml-1 text-[11px] text-slate-soft">(durduruldu)</span>}
                        </td>
                        <td className="pr-3 text-right font-mono-data">{tl(c.spend)}</td>
                        <td className="pr-3 text-right font-mono-data">{fmt(c.linkClicks)}</td>
                        <td className="text-right font-mono-data">{fmt(c.leads)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
          <p className="text-[12px] text-slate-soft">
            Reklam verileri dünü son gün sayar. WhatsApp/telefon tıklamaları Google Analytics&apos;ten gelir ve organik ziyaretçileri de kapsar; Meta tarafında yalnızca Aktürk
            Enerji sayfasının reklamları sayılır.
          </p>
        </>
      )}
    </div>
  );
}
