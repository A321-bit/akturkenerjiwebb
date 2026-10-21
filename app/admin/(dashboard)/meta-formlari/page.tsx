"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, MessageCircle, PhoneCall, RefreshCw, XCircle } from "lucide-react";
import { whatsappLink } from "@/lib/data";
import { LEAD_STATUSES, type LeadStatus, type MetaLead } from "@/lib/meta-lead-status";

// Meta anlık form başvuruları: personel arar, sonucu seçer; seçilen durum Meta'ya
// gönderilir (reklamlar satışa dönen kişilere benzeyenleri bulmayı öğrenir).

const STYLE: Record<string, string> = {
  Yeni: "bg-ink/5 text-slate border-line",
  Ulaşılamadı: "bg-sun/15 text-ink border-sun/40",
  İlgisiz: "bg-red-50 text-red-600 border-red-200",
  Nitelikli: "bg-brand/10 text-brand border-brand/30",
  "Keşif Planlandı": "bg-brand/15 text-brand border-brand/40",
  "Teklif Verildi": "bg-volt/10 text-ink border-volt/30",
  Satış: "bg-volt/20 text-ink border-volt/50",
};

/** Form sorusu anahtarını okunur hâle getirir ("aylık_elektrik_faturanız?" → "Aylık elektrik faturanız?"). */
const question = (s: string) => {
  const t = s.replaceAll("_", " ").trim();
  return t.charAt(0).toLocaleUpperCase("tr-TR") + t.slice(1);
};
const fmtDate = (iso: string) => new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const intl = (p: string) => {
  const d = p.replace(/\D/g, "");
  return d.startsWith("90") ? d : d.startsWith("0") ? `90${d.slice(1)}` : d.length === 10 ? `90${d}` : d;
};

export default function MetaLeadsPage() {
  const [leads, setLeads] = useState<MetaLead[] | null>(null);
  const [filter, setFilter] = useState<string>("Tümü");
  const [syncing, setSyncing] = useState(true);
  const [msg, setMsg] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(
    (sync: boolean) =>
      fetch(`/api/admin/meta-leads${sync ? "?sync=1" : ""}`, { cache: "no-store" })
        .then(async (res) => {
          const body = await res.json();
          if (!res.ok) throw new Error(body.error ?? `Hata ${res.status}`);
          setLeads(body.leads);
          if (body.sync?.error) setMsg(`Meta'dan çekilemedi: ${body.sync.error}`);
          else if (sync) setMsg(`Meta güncellendi (${body.sync?.forms ?? 0} form).`);
        })
        .catch((e) => setMsg(e instanceof Error ? e.message : String(e)))
        .finally(() => setSyncing(false)),
    [],
  );

  useEffect(() => {
    load(true);
  }, [load]);

  async function save(lead: MetaLead, patch: { status?: LeadStatus; note?: string }) {
    setSaving(lead.id);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/meta-leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Kaydedilemedi.");
      setLeads((xs) => xs?.map((x) => (x.id === lead.id ? data : x)) ?? null);
      const last = data.capi_log?.at(-1);
      if (patch.status && last && last.at === data.status_changed_at) setMsg(last.ok ? `"${patch.status}" Meta'ya gönderildi.` : `Kaydedildi ama Meta'ya gönderilemedi: ${last.error}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(null);
    }
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { Tümü: leads?.length ?? 0 };
    for (const l of leads ?? []) c[l.status] = (c[l.status] ?? 0) + 1;
    return c;
  }, [leads]);
  const shown = (leads ?? []).filter((l) => filter === "Tümü" || l.status === filter);

  return (
    <div className="flex max-w-5xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono-data text-[11px] uppercase tracking-[0.16em] text-brand">Talepler</p>
          <h1 className="mt-1 font-display text-2xl font-semibold">Meta Form Başvuruları</h1>
          <p className="mt-1 text-[13.5px] text-slate">
            Facebook/Instagram reklam formlarından gelenler. Aradıktan sonra sonucu seçin; sonuç Meta&apos;ya gider ve reklamlar
            satışa dönen kişilere benzeyenleri bulmayı öğrenir.
          </p>
        </div>
        <button
          type="button"
          disabled={syncing}
          onClick={() => {
            setSyncing(true);
            load(true);
          }}
          className="flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-[13.5px] font-semibold hover:border-ink disabled:opacity-50"
        >
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} /> Meta&apos;dan yenile
        </button>
      </div>

      {msg && <p className="rounded-xl bg-paper-raised px-4 py-3 text-[13.5px] text-volt">{msg}</p>}

      <div className="flex flex-wrap gap-2">
        {["Tümü", ...LEAD_STATUSES.map((s) => s.key)].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1.5 text-[12.5px] font-semibold ${filter === s ? "border-ink bg-ink text-paper" : "border-line text-slate hover:text-ink"}`}
          >
            {s} <span className="opacity-60">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      {!leads && <p className="text-[13.5px] text-slate">Yükleniyor…</p>}
      {leads && shown.length === 0 && <p className="text-[13.5px] text-slate">Bu durumda başvuru yok.</p>}

      <ul className="flex flex-col gap-3">
        {shown.map((l) => {
          const lastCapi = l.capi_log?.at(-1);
          return (
            <li key={l.id} className="rounded-2xl border border-line bg-paper-raised p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-[16px] font-semibold">{l.full_name || "(isimsiz)"}</p>
                  <p className="text-[12.5px] text-slate">
                    {fmtDate(l.created_time)} · {l.platform === "ig" ? "Instagram" : "Facebook"}
                    {l.city ? ` · ${l.city}` : ""}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-slate-soft" title={`${l.campaign_name} › ${l.ad_name}`}>
                    {l.campaign_name} › {l.ad_name}
                  </p>
                </div>
                {l.phone && (
                  <div className="flex shrink-0 gap-2">
                    <a href={`tel:+${intl(l.phone)}`} className="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-[13px] font-semibold text-paper">
                      <PhoneCall size={14} /> {l.phone}
                    </a>
                    <a
                      href={whatsappLink(intl(l.phone), `Merhaba ${l.full_name ?? ""}, Aktürk Enerji'den yazıyoruz. Güneş enerjisi sistemi için bıraktığınız bilgi üzerine ulaşıyoruz.`)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[13px] font-semibold hover:border-ink"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  </div>
                )}
              </div>

              {l.answers?.length > 0 && (
                <dl className="mt-3 grid gap-x-4 gap-y-1 text-[13px] sm:grid-cols-2">
                  {l.answers.map((a) => (
                    <div key={a.name} className="flex gap-1.5">
                      <dt className="text-slate">{question(a.name)}:</dt>
                      <dd className="font-medium">{a.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <div className="mt-3 flex flex-wrap gap-1.5">
                {LEAD_STATUSES.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    disabled={saving === l.id}
                    onClick={() => s.key !== l.status && save(l, { status: s.key })}
                    className={`rounded-full border px-3 py-1 text-[12.5px] font-semibold transition-opacity disabled:opacity-50 ${
                      l.status === s.key ? STYLE[s.key] : "border-line text-slate-soft hover:text-ink"
                    }`}
                  >
                    {s.key}
                  </button>
                ))}
                {lastCapi && (
                  <span className={`ml-auto flex items-center gap-1 text-[12px] ${lastCapi.ok ? "text-volt" : "text-red-600"}`} title={lastCapi.error}>
                    {lastCapi.ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />} Meta: {lastCapi.ok ? "gönderildi" : "gönderilemedi"}
                  </span>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  value={notes[l.id] ?? l.note ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [l.id]: e.target.value }))}
                  placeholder="Not (ör. cuma 14:00 keşif, 12 kW hibrit istiyor)"
                  className="admin-input flex-1 text-[13px]"
                />
                <button
                  type="button"
                  disabled={saving === l.id || (notes[l.id] ?? l.note ?? "") === (l.note ?? "")}
                  onClick={() => save(l, { note: notes[l.id] ?? "" })}
                  className="rounded-full bg-ink px-4 text-[13px] font-semibold text-paper disabled:opacity-30"
                >
                  Kaydet
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
