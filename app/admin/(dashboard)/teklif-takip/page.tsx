"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Phone } from "lucide-react";
import { LOST_REASONS, STAGES, type Tracking } from "@/lib/teklif/tracking";

// Teklif ve proje takibi: müşterinin açtığı teklifler, takip tarihi gelenler ve kurulum süreci tek ekranda.

type Row = {
  id: number;
  created_at: string;
  updated_at: string;
  proposal_no: string;
  customer_name: string | null;
  customer_phone: string | null;
  province: string | null;
  dc_kwp: number | null;
  total: number | null;
  views: number | null;
  last_view_at: string | null;
  token: string | null;
  currency: string | null;
  valid_days: number | null;
  tracking: Tracking | null;
};

const GRUPLAR = ["Tümü", "Dikkat", "Satış", "Proje", "Bitti"] as const;
const today = () => new Date().toISOString().slice(0, 10);
const stageOf = (r: Row) => r.tracking?.stage ?? "teklif";
const grupOf = (r: Row) => STAGES.find((s) => s.key === stageOf(r))?.grup ?? "Satış";

function flags(r: Row, now: number) {
  const out: string[] = [];
  if (grupOf(r) === "Bitti") return out;
  if (r.tracking?.followUp && r.tracking.followUp <= new Date(now).toISOString().slice(0, 10)) out.push("Takip günü geldi");
  if (grupOf(r) === "Satış") {
    if (r.last_view_at && now - new Date(r.last_view_at).getTime() < 48 * 36e5) out.push("Son 2 günde açtı, ara");
    const end = new Date(r.created_at).getTime() + (r.valid_days ?? 15) * 864e5;
    if (end < now) out.push("Süresi doldu");
    else if (end - now < 3 * 864e5) out.push("Süresi bitiyor");
    if (!r.views && now - new Date(r.created_at).getTime() > 2 * 864e5) out.push("2 gündür açmadı");
  }
  return out;
}

export default function TeklifTakipPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [grup, setGrup] = useState<(typeof GRUPLAR)[number]>("Dikkat");
  const [now, setNow] = useState(0);

  const load = useCallback(() => {
    fetch("/api/admin/proposals/tracking")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setRows(d);
        setNow(Date.now());
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  async function patch(id: number, body: object) {
    const r = await fetch("/api/admin/proposals/tracking", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setError(d.error ?? "Kaydedilemedi.");
    setRows((list) => (list ?? []).map((x) => (x.id === id ? { ...x, tracking: d } : x)));
  }

  const counts = useMemo(() => {
    const list = rows ?? [];
    return { Tümü: list.length, Dikkat: list.filter((r) => flags(r, now).length).length, Satış: list.filter((r) => grupOf(r) === "Satış").length, Proje: list.filter((r) => grupOf(r) === "Proje").length, Bitti: list.filter((r) => grupOf(r) === "Bitti").length };
  }, [rows, now]);
  const shown = (rows ?? []).filter((r) => (grup === "Tümü" ? true : grup === "Dikkat" ? flags(r, now).length > 0 : grupOf(r) === grup));

  return (
    <div>
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Satış</p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Teklif ve proje takibi</h1>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {GRUPLAR.map((g) => (
          <button key={g} onClick={() => setGrup(g)} className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold ${grup === g ? "border-ink bg-ink text-paper" : "border-line text-slate hover:border-ink"}`}>{g} ({counts[g]})</button>
        ))}
      </div>
      {error && <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-[13.5px] text-red-700">{error}</p>}
      {!rows && !error && <p className="mt-4 text-slate">Yükleniyor…</p>}
      {rows && shown.length === 0 && <p className="mt-6 text-slate">{grup === "Dikkat" ? "Şu an dikkat gerektiren teklif yok." : "Bu grupta kayıt yok."}</p>}
      <div className="mt-4 space-y-3">
        {shown.map((r) => {
          const f = flags(r, now);
          return (
            <div key={r.id} className={`rounded-2xl border bg-paper-raised p-4 ${f.length ? "border-sun/70" : "border-line"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{r.customer_name || "İsimsiz"} <span className="font-mono-data text-[12px] font-normal text-slate">{r.proposal_no}</span></p>
                  <p className="text-[12.5px] text-slate">
                    {r.province ?? ""}{r.dc_kwp ? ` · ${Number(r.dc_kwp).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} kWp` : ""}{r.total ? ` · ${Math.round(Number(r.total)).toLocaleString("tr-TR")} ${r.currency === "USD" ? "$" : "TL"}` : ""}
                    {r.views ? ` · ${r.views} kez açıldı, son ${new Date(r.last_view_at!).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}` : " · henüz açılmadı"}
                  </p>
                  {f.length > 0 && <p className="mt-1 flex flex-wrap gap-1.5">{f.map((x) => <span key={x} className="rounded-full bg-sun/20 px-2 py-0.5 text-[11.5px] font-semibold">{x}</span>)}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold">
                  {r.customer_phone && <a href={`tel:${r.customer_phone}`} className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 hover:border-ink"><Phone size={13} /> Ara</a>}
                  {r.token && <a href={`/teklif/${r.token}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 hover:border-ink"><ExternalLink size={13} /> Link</a>}
                  <a href={`/admin/teklif-studyosu?id=${r.id}`} className="rounded-lg bg-brand px-2.5 py-1.5 text-paper">Teklifi aç</a>
                </div>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-[220px_150px_1fr]">
                <label className="block">
                  <span className="text-[11.5px] font-semibold text-slate">Aşama</span>
                  <select value={stageOf(r)} onChange={(e) => patch(r.id, { stage: e.target.value })} className="mt-0.5 w-full rounded-lg border border-line bg-paper px-2 py-1.5 text-[13px]">
                    {["Satış", "Proje", "Bitti"].map((g) => (
                      <optgroup key={g} label={g}>{STAGES.filter((s) => s.grup === g).map((s) => <option key={s.key} value={s.key}>{s.ad}</option>)}</optgroup>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[11.5px] font-semibold text-slate">Takip tarihi</span>
                  <input type="date" min={today()} value={r.tracking?.followUp ?? ""} onChange={(e) => patch(r.id, { followUp: e.target.value })} className="mt-0.5 w-full rounded-lg border border-line bg-paper px-2 py-1.5 text-[13px]" />
                </label>
                <label className="block">
                  <span className="text-[11.5px] font-semibold text-slate">Not</span>
                  <input defaultValue={r.tracking?.note ?? ""} onBlur={(e) => e.target.value !== (r.tracking?.note ?? "") && patch(r.id, { note: e.target.value })} className="mt-0.5 w-full rounded-lg border border-line bg-paper px-2 py-1.5 text-[13px]" />
                </label>
              </div>
              {stageOf(r) === "kayip" && (
                <label className="mt-2 block max-w-xs">
                  <span className="text-[11.5px] font-semibold text-slate">Kaybedilme sebebi</span>
                  <select value={r.tracking?.lostReason ?? ""} onChange={(e) => patch(r.id, { lostReason: e.target.value })} className="mt-0.5 w-full rounded-lg border border-line bg-paper px-2 py-1.5 text-[13px]">
                    <option value="">Seçin</option>
                    {LOST_REASONS.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </label>
              )}
              {r.tracking?.dates && Object.keys(r.tracking.dates).length > 0 && (
                <p className="mt-2 text-[11.5px] text-slate">{STAGES.filter((s) => r.tracking!.dates[s.key]).map((s) => `${s.ad}: ${new Date(r.tracking!.dates[s.key]).toLocaleDateString("tr-TR")}`).join(" · ")}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
