"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { Download, PhoneCall, Trash2, MessageSquareText, ChevronDown, ChevronUp } from "lucide-react";

type LeadRow = {
  id: number;
  created_at: string;
  fullname: string;
  phone: string;
  email: string | null;
  province: string | null;
  need_type: string;
  bill_range: string | null;
  source: string;
  status: string;
  notes: string | null;
  form_page: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  ad_click_id: string | null;
};

function describeSource(item: LeadRow): { label: string; sub?: string } {
  if (item.utm_source || item.utm_medium) {
    const label = [item.utm_source, item.utm_medium].filter(Boolean).join(" / ");
    return { label, sub: item.utm_campaign ?? undefined };
  }
  if (item.ad_click_id?.startsWith("fbclid:")) return { label: "Meta Ads", sub: item.utm_campaign ?? undefined };
  if (item.ad_click_id?.startsWith("gclid:")) return { label: "Google Ads", sub: item.utm_campaign ?? undefined };
  return { label: item.source };
}

const STATUSES = ["Yeni", "Arandı", "Ulaşılamadı", "Olumsuz", "Olumlu"] as const;

const STATUS_STYLES: Record<string, string> = {
  Yeni: "bg-ink/5 text-slate border-line",
  Arandı: "bg-brand/10 text-brand border-brand/30",
  Ulaşılamadı: "bg-sun/15 text-sun-soft border-sun/40",
  Olumsuz: "bg-red-50 text-red-600 border-red-200",
  Olumlu: "bg-volt/10 text-volt border-volt/30",
};

function telHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

export default function AdminLeadsPage() {
  const [items, setItems] = useState<LeadRow[] | null>(null);
  const [activeStatus, setActiveStatus] = useState<string>("Tümü");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/leads")
      .then((r) => r.json())
      .then(setItems);
  }, []);

  async function refresh() {
    const res = await fetch("/api/admin/leads");
    setItems(await res.json());
  }

  async function handleDelete(id: number) {
    if (!confirm("Bu talebi silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/admin/leads/${id}`, { method: "DELETE" });
    refresh();
  }

  async function handleStatusChange(id: number, status: string) {
    setItems((prev) => prev?.map((it) => (it.id === id ? { ...it, status } : it)) ?? prev);
    setSavingId(id);
    await fetch(`/api/admin/leads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSavingId(null);
  }

  function openNotes(item: LeadRow) {
    if (expandedId === item.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(item.id);
    setNoteDraft(item.notes ?? "");
  }

  async function saveNotes(id: number) {
    setSavingId(id);
    await fetch(`/api/admin/leads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: noteDraft }),
    });
    setItems((prev) => prev?.map((it) => (it.id === id ? { ...it, notes: noteDraft } : it)) ?? prev);
    setSavingId(null);
    setExpandedId(null);
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { Tümü: items?.length ?? 0 };
    for (const s of STATUSES) c[s] = items?.filter((it) => it.status === s).length ?? 0;
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return null;
    return activeStatus === "Tümü" ? items : items.filter((it) => it.status === activeStatus);
  }, [items, activeStatus]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Talepler</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
            Gelen Teklif Talepleri {items ? `(${items.length})` : ""}
          </h1>
        </div>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download, not a page navigation */}
        <a
          href="/api/admin/leads/export"
          className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper hover:bg-sun hover:text-ink"
        >
          <Download size={16} /> Excel&apos;e Aktar
        </a>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {["Tümü", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setActiveStatus(s)}
            className={`rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors ${
              activeStatus === s
                ? "border-ink bg-ink text-paper"
                : "border-line text-slate hover:border-brand"
            }`}
          >
            {s} {items && <span className="opacity-70">({counts[s] ?? 0})</span>}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-paper-raised">
        {filtered === null ? (
          <p className="p-5 text-[13.5px] text-slate-soft">Yükleniyor...</p>
        ) : filtered.length === 0 ? (
          <p className="p-5 text-[13.5px] text-slate-soft">Bu durumda talep yok.</p>
        ) : (
          <table className="w-full min-w-[1080px] text-[13.5px]">
            <thead>
              <tr className="border-b border-line text-left text-[11.5px] uppercase tracking-[0.08em] text-slate-soft">
                <th className="px-5 py-3 font-medium">Tarih</th>
                <th className="px-5 py-3 font-medium">Ad Soyad</th>
                <th className="px-5 py-3 font-medium">Telefon</th>
                <th className="px-5 py-3 font-medium">İl</th>
                <th className="px-5 py-3 font-medium">İhtiyaç</th>
                <th className="px-5 py-3 font-medium">Sayfa</th>
                <th className="px-5 py-3 font-medium">Kaynak / Reklam</th>
                <th className="px-5 py-3 font-medium">Durum</th>
                <th className="w-24 px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <Fragment key={item.id}>
                  <tr className="border-b border-line last:border-0">
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate">
                      {new Date(item.created_at).toLocaleString("tr-TR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-ink">{item.fullname}</p>
                      {item.email && <p className="text-[12px] text-slate-soft">{item.email}</p>}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <a
                        href={telHref(item.phone)}
                        className="flex items-center gap-1.5 font-semibold text-brand hover:underline"
                      >
                        <PhoneCall size={14} /> {item.phone}
                      </a>
                    </td>
                    <td className="px-5 py-3.5 text-slate">{item.province ?? "—"}</td>
                    <td className="px-5 py-3.5 text-ink">{item.need_type}</td>
                    <td className="max-w-[160px] px-5 py-3.5">
                      <span className="font-mono-data text-[11.5px] text-slate" title={item.form_page ?? ""}>
                        {item.form_page ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {(() => {
                        const src = describeSource(item);
                        return (
                          <div>
                            <span className="rounded-full bg-ink/5 px-2.5 py-1 text-[11.5px] font-medium text-slate">
                              {src.label}
                            </span>
                            {src.sub && (
                              <p className="mt-1 max-w-[140px] truncate text-[11px] text-slate-soft" title={src.sub}>
                                {src.sub}
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        disabled={savingId === item.id}
                        className={`rounded-full border px-3 py-1.5 text-[12.5px] font-semibold outline-none disabled:opacity-60 ${
                          STATUS_STYLES[item.status] ?? STATUS_STYLES.Yeni
                        }`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openNotes(item)}
                          className={`rounded-lg p-2 hover:bg-ink/5 ${
                            item.notes ? "text-brand" : "text-slate"
                          }`}
                          aria-label="Not ekle/düzenle"
                        >
                          <MessageSquareText size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg p-2 text-slate hover:bg-red-50 hover:text-red-600"
                          aria-label="Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                        {expandedId === item.id ? (
                          <ChevronUp size={16} className="text-slate-soft" />
                        ) : (
                          <ChevronDown size={16} className="text-slate-soft" />
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === item.id && (
                    <tr className="border-b border-line bg-ink/[0.02] last:border-0">
                      <td colSpan={9} className="px-5 py-4">
                        <label className="text-[12.5px] font-medium text-slate">
                          {item.fullname} için not
                        </label>
                        <textarea
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          rows={3}
                          placeholder="Görüşme notu, randevu bilgisi, itiraz sebebi vb."
                          className="mt-2 w-full max-w-2xl rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[13.5px] outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => saveNotes(item.id)}
                            disabled={savingId === item.id}
                            className="rounded-full bg-ink px-4 py-2 text-[12.5px] font-semibold text-paper hover:bg-sun hover:text-ink disabled:opacity-60"
                          >
                            {savingId === item.id ? "Kaydediliyor..." : "Notu Kaydet"}
                          </button>
                          <button
                            onClick={() => setExpandedId(null)}
                            className="rounded-full border border-line px-4 py-2 text-[12.5px] font-semibold text-ink hover:border-brand"
                          >
                            Vazgeç
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
