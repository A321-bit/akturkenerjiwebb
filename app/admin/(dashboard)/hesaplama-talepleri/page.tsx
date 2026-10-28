"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, MessageCircle, PhoneCall } from "lucide-react";
import { whatsappLink } from "@/lib/data";
import { CHANNELS, channelDetail, leadChannel } from "@/lib/lead-source";
import { CALC_STAGES, CALC_TYPES, heat, type CalcStage } from "@/lib/calc-pipeline";

// Hesaplayıcıdan gelen talepler: sıcaklık skoru, satış aşaması, sorumlu, takip tarihi ve not.
// Hesap sonucu kartta özetlenir; satış ekibi aramadan önce müşterinin ihtiyacını görür.

type CalcRow = {
  id: number;
  created_at: string;
  type: string;
  fullname: string;
  phone: string;
  email: string | null;
  province: string | null;
  recommended_product: string | null;
  estimated_value: number | null;
  score: number | null;
  status: string | null;
  assigned_to: string | null;
  follow_up_at: string | null;
  notes: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  ad_click_id: string | null;
  referrer: string | null;
  landing_page: string | null;
  inputs: { tariff?: string; roofType?: string; monthlyBillTl?: number; monthlyKwh?: number } | null;
  systemKw: number | null;
  panelCount: number | null;
  monthlyBillTl: number | null;
  annualSavingTl: number | null;
  paybackYears: number | null;
  coveragePct: number | null;
  annualKwh: number | null;
};

const tl = (n: number | null) => (n == null ? "—" : `${Math.round(n).toLocaleString("tr-TR")} TL`);
const fmtDate = (iso: string) => new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const stageOf = (r: CalcRow): CalcStage => ((CALC_STAGES as readonly string[]).includes(r.status ?? "") ? (r.status as CalcStage) : "Yeni");
// <input type="datetime-local"> yerel saat bekler.
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60e3).toISOString().slice(0, 16);
};

function waNumber(phone: string) {
  const d = phone.replace(/\D/g, "");
  return d.startsWith("90") ? d : d.startsWith("0") ? `90${d.slice(1)}` : `90${d}`;
}

function waMessage(r: CalcRow) {
  const kw = r.systemKw != null ? `${r.systemKw.toLocaleString("tr-TR")} kW` : "";
  return `Merhaba ${r.fullname}, Aktürk Enerji'den yazıyoruz. Sitemizdeki hesaplamanıza göre çatınız için ${kw} güneş enerjisi sistemi öneriliyor${
    r.annualSavingTl ? `; yıllık tasarrufunuz yaklaşık ${tl(r.annualSavingTl)}` : ""
  }. Ücretsiz keşif için size uygun bir gün ve saati paylaşabilir misiniz?`;
}

async function save(id: number, body: Record<string, unknown>) {
  await fetch(`/api/admin/calculations/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

export default function CalculationLeadsPage() {
  const [items, setItems] = useState<CalcRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<CalcStage | "Tümü" | "Takip">("Tümü");
  const [now] = useState(() => Date.now());

  useEffect(() => {
    fetch("/api/admin/calculations")
      .then((r) => (r.ok ? r.json() : r.json().then((e) => Promise.reject(e.error))))
      .then(setItems)
      .catch((e) => setError(String(e ?? "Yüklenemedi")));
  }, []);

  const patch = (id: number, local: Partial<CalcRow>, body: Record<string, unknown>) => {
    setItems((prev) => prev?.map((r) => (r.id === id ? { ...r, ...local } : r)) ?? prev);
    save(id, body);
  };

  const counts = useMemo(() => {
    const c = new Map<string, { n: number; value: number }>();
    for (const r of items ?? []) {
      const k = stageOf(r);
      const v = c.get(k) ?? { n: 0, value: 0 };
      v.n++;
      v.value += r.estimated_value ?? 0;
      c.set(k, v);
    }
    return c;
  }, [items]);

  // Takip tarihi gelmiş (bugün sonuna kadar) ve kapanmamış talepler.
  const dueTill = new Date(now).setHours(23, 59, 59, 999);
  const isDue = (r: CalcRow) => r.follow_up_at != null && new Date(r.follow_up_at).getTime() <= dueTill && !["Satış", "Olumsuz"].includes(stageOf(r));
  const due = (items ?? []).filter(isDue);

  const shown = (items ?? []).filter((r) => (stage === "Tümü" ? true : stage === "Takip" ? isDue(r) : stageOf(r) === stage));
  const open = (items ?? []).filter((r) => !["Satış", "Olumsuz"].includes(stageOf(r)));
  const won = counts.get("Satış");

  return (
    <div>
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Talepler</p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Hesaplama Talepleri {items ? `(${items.length})` : ""}</h1>
      <p className="mt-1 max-w-2xl text-[13.5px] text-slate">
        Sitedeki hesaplayıcıda raporunu açan müşteriler. Skor; sistem büyüklüğü, tüketim ve geri ödeme süresine göre hesaplanır, en sıcak talep önce aranmalıdır.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Açık talep" value={String(open.length)} sub={tl(open.reduce((a, r) => a + (r.estimated_value ?? 0), 0)) + " potansiyel"} />
        <Tile label="Bugün aranacak" value={String(due.length)} sub="takip tarihi gelmiş" accent={due.length > 0} />
        <Tile label="Sıcak talep" value={String(open.filter((r) => (r.score ?? 0) >= 70).length)} sub="skor 70 ve üzeri" />
        <Tile label="Satış" value={String(won?.n ?? 0)} sub={tl(won?.value ?? 0)} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {(["Tümü", "Takip", ...CALC_STAGES] as const).map((s) => {
          const n = s === "Tümü" ? items?.length ?? 0 : s === "Takip" ? due.length : counts.get(s)?.n ?? 0;
          return (
            <button
              key={s}
              onClick={() => setStage(s)}
              className={`rounded-full border px-3 py-1 text-[12.5px] font-semibold ${stage === s ? "border-ink bg-ink text-paper" : "border-line text-slate hover:border-ink"}`}
            >
              {s === "Takip" ? "Bugün aranacak" : s} <span className="opacity-60">{n}</span>
            </button>
          );
        })}
      </div>

      {error && <p className="mt-8 text-red-600">{error}</p>}
      {!items && !error && <p className="mt-8 text-slate">Yükleniyor…</p>}
      {items && shown.length === 0 && <p className="mt-8 text-slate">Bu aşamada talep yok.</p>}

      <div className="mt-5 space-y-3">
        {shown.map((r) => {
          const h = heat(r.score);
          const ch = CHANNELS.find((c) => c.key === leadChannel({ ...r, source: "ongrid_calculator" }))!;
          const detail = channelDetail({ ...r, source: "ongrid_calculator" });
          return (
            <div key={r.id} className={`rounded-2xl border bg-paper-raised p-4 ${isDue(r) ? "border-brand" : "border-line"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-[16px] font-semibold text-ink">{r.fullname}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[11.5px] font-semibold ${h.color}`}>
                      {h.label} · {r.score ?? 0}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-slate">
                    {fmtDate(r.created_at)} · {CALC_TYPES[r.type] ?? r.type}
                    {r.province ? ` · ${r.province}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`tel:${r.phone.replace(/\s+/g, "")}`} className="flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-[13px] font-semibold text-ink hover:border-brand">
                    <PhoneCall size={14} /> {r.phone}
                  </a>
                  <a href={whatsappLink(waNumber(r.phone), waMessage(r))} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line p-2 text-volt hover:border-volt" aria-label="WhatsApp">
                    <MessageCircle size={15} />
                  </a>
                  <select
                    value={stageOf(r)}
                    onChange={(e) => patch(r.id, { status: e.target.value }, { status: e.target.value })}
                    className="rounded-lg border border-line bg-paper px-2 py-1.5 text-[13px] font-semibold"
                  >
                    {CALC_STAGES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl bg-paper p-3 text-[13px] sm:grid-cols-4">
                <Fact k="Önerilen sistem" v={r.systemKw != null ? `${r.systemKw.toLocaleString("tr-TR")} kW · ${r.panelCount ?? "?"} panel` : "—"} />
                <Fact k="Aylık fatura" v={tl(r.monthlyBillTl)} />
                <Fact k="Yıllık tasarruf" v={tl(r.annualSavingTl)} />
                <Fact k="Geri ödeme" v={r.paybackYears != null ? `${r.paybackYears.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} yıl` : "—"} />
                <Fact k="Paket" v={r.recommended_product ?? "Özel teklif"} wide />
                <Fact k="Tahmini satış" v={tl(r.estimated_value)} />
                <Fact k="Karşılama" v={r.coveragePct != null ? `%${r.coveragePct}` : "—"} />
              </dl>

              <div className="mt-3 grid gap-3 text-[13px] sm:grid-cols-[1fr_1fr_1.4fr]">
                <label className="block">
                  <span className="text-[11px] uppercase tracking-wide text-slate">Sorumlu</span>
                  <input
                    defaultValue={r.assigned_to ?? ""}
                    onBlur={(e) => e.target.value !== (r.assigned_to ?? "") && patch(r.id, { assigned_to: e.target.value || null }, { assignedTo: e.target.value })}
                    placeholder="Atanmadı"
                    className="mt-1 w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 outline-none focus:border-brand"
                  />
                </label>
                <label className="block">
                  <span className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate">
                    <CalendarClock size={12} /> Takip tarihi
                  </span>
                  <input
                    type="datetime-local"
                    value={toLocalInput(r.follow_up_at)}
                    onChange={(e) => {
                      const iso = e.target.value ? new Date(e.target.value).toISOString() : null;
                      patch(r.id, { follow_up_at: iso }, { followUpAt: iso });
                    }}
                    className="mt-1 w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 outline-none focus:border-brand"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] uppercase tracking-wide text-slate">Not</span>
                  <textarea
                    defaultValue={r.notes ?? ""}
                    rows={1}
                    onBlur={(e) => e.target.value !== (r.notes ?? "") && patch(r.id, { notes: e.target.value }, { notes: e.target.value })}
                    placeholder="Görüşme notu"
                    className="mt-1 w-full resize-y rounded-lg border border-line bg-paper px-2.5 py-1.5 outline-none focus:border-brand"
                  />
                </label>
              </div>

              <p className="mt-2 text-[12px] text-slate">
                <span className={`mr-1.5 inline-block rounded-full border px-2 py-0.5 font-semibold ${ch.color}`}>{ch.label}</span>
                {[detail, r.landing_page ? `ilk sayfa: ${r.landing_page}` : null].filter(Boolean).join(" · ")}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Tile({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border bg-paper-raised p-3 ${accent ? "border-brand" : "border-line"}`}>
      <p className="text-[12px] text-slate">{label}</p>
      <p className={`mt-1 font-display text-2xl font-semibold ${accent ? "text-brand" : "text-ink"}`}>{value}</p>
      <p className="text-[12px] text-slate">{sub}</p>
    </div>
  );
}

function Fact({ k, v, wide }: { k: string; v: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="text-[11px] uppercase tracking-wide text-slate">{k}</dt>
      <dd className="font-semibold text-ink">{v}</dd>
    </div>
  );
}
