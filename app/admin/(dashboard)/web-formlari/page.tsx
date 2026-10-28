"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle, PhoneCall } from "lucide-react";
import { whatsappLink } from "@/lib/data";
import { CHANNELS, FORM_TYPES, channelDetail, leadChannel, type LeadChannel } from "@/lib/lead-source";

// Web sitesindeki formları dolduranlar: müşterinin hangi kanaldan geldiği (reklam,
// Google arama, sosyal medya, yapay zekâ, direkt), siteye ilk girdiği sayfa ve
// formu doldurduğu sayfa tek bakışta görünür. Canlı destek sohbetleri hariçtir.

type LeadRow = {
  id: number;
  created_at: string;
  fullname: string;
  phone: string;
  province: string | null;
  need_type: string;
  source: string;
  status: string;
  form_page: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  ad_click_id: string | null;
  referrer?: string | null;
  landing_page?: string | null;
};

const STATUSES = ["Yeni", "Arandı", "Ulaşılamadı", "Olumsuz", "Olumlu"] as const;
const PERIODS = [
  ["all", "Tümü", Infinity],
  ["30", "Son 30 gün", 30],
  ["7", "Son 7 gün", 7],
] as const;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

function waNumber(phone: string) {
  const d = phone.replace(/\D/g, "");
  return d.startsWith("90") ? d : d.startsWith("0") ? `90${d.slice(1)}` : `90${d}`;
}

function refHost(ref?: string | null) {
  if (!ref) return null;
  try {
    return new URL(ref).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export default function WebFormLeadsPage() {
  const [items, setItems] = useState<LeadRow[] | null>(null);
  const [channel, setChannel] = useState<LeadChannel | "all">("all");
  const [status, setStatus] = useState<string>("Tümü");
  const [period, setPeriod] = useState<(typeof PERIODS)[number][0]>("30");
  const [now] = useState(() => Date.now());

  useEffect(() => {
    fetch("/api/admin/leads")
      .then((r) => r.json())
      .then((rows: LeadRow[]) => setItems(rows.filter((r) => r.source !== "live_chat")));
  }, []);

  const inPeriod = useMemo(() => {
    if (!items) return null;
    const days = PERIODS.find((p) => p[0] === period)![2];
    const since = now - days * 864e5;
    return items.filter((r) => new Date(r.created_at).getTime() >= since);
  }, [items, period, now]);

  const byChannel = useMemo(() => {
    const c = new Map<LeadChannel, { total: number; won: number }>();
    for (const r of inPeriod ?? []) {
      const k = leadChannel(r);
      const v = c.get(k) ?? { total: 0, won: 0 };
      v.total++;
      if (r.status === "Olumlu") v.won++;
      c.set(k, v);
    }
    return c;
  }, [inPeriod]);

  const shown = useMemo(
    () =>
      (inPeriod ?? []).filter(
        (r) => (channel === "all" || leadChannel(r) === channel) && (status === "Tümü" || r.status === status)
      ),
    [inPeriod, channel, status]
  );

  async function changeStatus(id: number, next: string) {
    setItems((prev) => prev?.map((r) => (r.id === id ? { ...r, status: next } : r)) ?? prev);
    await fetch(`/api/admin/leads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
  }

  return (
    <div>
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Talepler</p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
        Web Sitesi Formları {inPeriod ? `(${inPeriod.length})` : ""}
      </h1>
      <p className="mt-1 max-w-2xl text-[13.5px] text-slate">
        Sitedeki formları dolduran müşteriler ve siteye nereden geldikleri. Kaynak, ziyaretçinin siteye ilk geldiği kanaldır
        (reklama tıklayan ziyaretçide reklam önceliklidir).
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {PERIODS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`rounded-lg border px-3 py-1.5 text-[13px] font-semibold ${period === key ? "border-brand bg-brand text-paper" : "border-line text-slate hover:border-brand"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Kanal özeti: karta tıklayınca liste o kanala süzülür */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CHANNELS.filter((c) => byChannel.has(c.key)).map((c) => {
          const v = byChannel.get(c.key)!;
          const active = channel === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setChannel(active ? "all" : c.key)}
              className={`rounded-xl border p-3 text-left transition ${active ? "border-brand ring-2 ring-brand/30" : "border-line hover:border-brand"} bg-paper-raised`}
            >
              <span className={`inline-block rounded-full border px-2 py-0.5 text-[11.5px] font-semibold ${c.color}`}>{c.label}</span>
              <p className="mt-2 font-display text-2xl font-semibold">{v.total}</p>
              <p className="text-[12px] text-slate">{v.won > 0 ? `${v.won} olumlu sonuç` : "talep"}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {["Tümü", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full border px-3 py-1 text-[12.5px] font-semibold ${status === s ? "border-ink bg-ink text-paper" : "border-line text-slate hover:border-ink"}`}
          >
            {s}
          </button>
        ))}
        {channel !== "all" && (
          <button onClick={() => setChannel("all")} className="rounded-full border border-brand px-3 py-1 text-[12.5px] font-semibold text-brand">
            Kanal filtresini kaldır ✕
          </button>
        )}
      </div>

      {!items && <p className="mt-8 text-slate">Yükleniyor…</p>}
      {items && shown.length === 0 && <p className="mt-8 text-slate">Bu filtrede talep yok.</p>}

      <div className="mt-5 space-y-3">
        {shown.map((r) => {
          const ch = CHANNELS.find((c) => c.key === leadChannel(r))!;
          const detail = channelDetail(r);
          const host = refHost(r.referrer);
          return (
            <div key={r.id} className="rounded-2xl border border-line bg-paper-raised p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-[16px] font-semibold text-ink">{r.fullname}</p>
                  <p className="text-[12.5px] text-slate">
                    {fmtDate(r.created_at)} · {r.need_type}
                    {r.province ? ` · ${r.province}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`tel:${r.phone.replace(/\s+/g, "")}`} className="flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-[13px] font-semibold text-ink hover:border-brand">
                    <PhoneCall size={14} /> {r.phone}
                  </a>
                  <a href={whatsappLink(waNumber(r.phone), `Merhaba ${r.fullname}, Aktürk Enerji'den yazıyoruz.`)} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line p-2 text-volt hover:border-volt" aria-label="WhatsApp">
                    <MessageCircle size={15} />
                  </a>
                  <select
                    value={r.status}
                    onChange={(e) => changeStatus(r.id, e.target.value)}
                    className="rounded-lg border border-line bg-paper px-2 py-1.5 text-[13px] font-semibold"
                  >
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-[13px] sm:grid-cols-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate">Nereden geldi</p>
                  <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[12px] font-semibold ${ch.color}`}>{ch.label}</span>
                  {(detail || host) && <p className="mt-1 text-slate">{[detail, host && host !== detail ? host : null].filter(Boolean).join(" · ")}</p>}
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate">Siteye girdiği ilk sayfa</p>
                  <p className="mt-1 break-all text-ink">{r.landing_page ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate">Formu doldurduğu yer</p>
                  <p className="mt-1 break-all text-ink">{r.form_page ?? "—"}</p>
                  <p className="text-slate">{FORM_TYPES[r.source] ?? r.source}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
