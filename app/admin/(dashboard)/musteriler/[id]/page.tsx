"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink, FilePlus2, MessageCircle, Phone } from "lucide-react";
import { ACTIVITY_KINDS, ACTIVITY_LABEL, SEGMENTS, channelOf } from "@/lib/crm";
import { STAGES, type Tracking } from "@/lib/teklif/tracking";
import CustomerPlace from "@/components/admin/teklif/CustomerPlace";

// Müşteri kartı: kimlik, sorumlu, teklifler, tahsilat, faaliyet geçmişi ve talepler tek sayfada.

type Customer = { id: number; created_at: string; full_name: string; company: string | null; phone: string; email: string | null; province: string | null; district: string | null; address: string | null; source: string | null; segment: string | null; assigned_to: number | null; notes: string | null };
type Proposal = { id: number; created_at: string; proposal_no: string; dc_kwp: number | null; total: number | null; currency: string | null; tracking: Tracking | null; views: number | null; last_view_at: string | null; token: string | null };
type Activity = { id: number; created_at: string; kind: string; text: string | null; due_at: string | null; done_at: string | null; staff_id: number | null };
type Payment = { id: number; proposal_id: number; step: string; amount: number; currency: string; due_at: string | null; paid_at: string | null };
type Request = { kind: string; at: string; text: string; note: string | null };
type Staff = { id: number; full_name: string; active: boolean };
type Card = { customer: Customer; proposals: Proposal[]; activities: Activity[]; payments: Payment[]; requests: Request[] };

const dt = (s: string | null) => (s ? new Date(s).toLocaleDateString("tr-TR") : "—");
const money = (v: number, c: string | null) => `${Math.round(v).toLocaleString("tr-TR")} ${c === "USD" ? "$" : "TL"}`;
const waOf = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  return d.startsWith("90") ? d : d.startsWith("0") ? `9${d}` : `90${d}`;
};

export default function MusteriKartiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [card, setCard] = useState<Card | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState<Customer | null>(null);
  const [act, setAct] = useState({ kind: "arama", text: "", due: "", staff: "" });

  const load = useCallback(() => {
    fetch(`/api/admin/customers/${id}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setCard(d);
      })
      .catch((e) => setError(e.message));
  }, [id]);
  useEffect(() => {
    load();
    fetch("/api/admin/crm?gun=30").then((r) => r.json()).then((d) => d.staff && setStaff(d.staff)).catch(() => {});
  }, [load]);

  const crm = (body: object) => fetch("/api/admin/crm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(async (r) => {
    const d = await r.json().catch(() => ({}));
    if (!r.ok) setError(d.error ?? "İşlem yapılamadı.");
    load();
  });

  async function saveCustomer(patch: object) {
    const r = await fetch(`/api/admin/customers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setError(d.error ?? "Kaydedilemedi.");
    setEdit(null);
    load();
  }

  async function addActivity() {
    if (!act.text.trim() && !act.due) return;
    await fetch(`/api/admin/customers/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: act.kind, text: act.text, due_at: act.due || null, staff_id: act.staff ? Number(act.staff) : null }) });
    setAct({ ...act, text: "", due: "" });
    load();
  }

  if (error && !card) return <p className="rounded-xl bg-red-500/10 p-4 text-red-700">{error}</p>;
  if (!card) return <p className="text-slate">Yükleniyor…</p>;
  const c = card.customer;
  const field = "mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-[14px] outline-none focus:border-brand";
  const paid = card.payments.filter((x) => x.paid_at).reduce((a, x) => a + Number(x.amount), 0);
  const totalPay = card.payments.reduce((a, x) => a + Number(x.amount), 0);

  return (
    <div>
      <Link href="/admin/musteriler" className="text-[13px] font-semibold text-slate hover:text-ink">← Müşteriler</Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{c.full_name}</h1>
          <p className="text-[13.5px] text-slate">{[c.company, c.segment, [c.district, c.province].filter(Boolean).join(", "), channelOf(c.source)].filter(Boolean).join(" · ")} · Kayıt {dt(c.created_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[13px] font-semibold">
          <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 hover:border-ink"><Phone size={14} /> {c.phone}</a>
          <a href={`https://wa.me/${waOf(c.phone)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 hover:border-ink"><MessageCircle size={14} /> WhatsApp</a>
          <Link href={`/admin/teklif-studyosu?customer=${c.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-paper hover:bg-brand-deep"><FilePlus2 size={14} /> Yeni teklif</Link>
        </div>
      </div>
      {error && <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-[13.5px] text-red-700">{error}</p>}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-5">
          <section className="rounded-2xl border border-line bg-paper-raised p-5">
            <h2 className="font-semibold">Teklifler</h2>
            {card.proposals.length === 0 && <p className="mt-2 text-[13.5px] text-slate">Henüz teklif yok.</p>}
            <div className="mt-2 divide-y divide-line">
              {card.proposals.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[13.5px]">
                  <div>
                    <p className="font-semibold">{p.proposal_no} <span className="font-normal text-slate">· {dt(p.created_at)}</span></p>
                    <p className="text-[12.5px] text-slate">{p.dc_kwp ? `${Number(p.dc_kwp).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} kWp · ` : ""}{p.total ? `${money(Number(p.total), p.currency)} · ` : ""}{STAGES.find((s) => s.key === (p.tracking?.stage ?? "teklif"))?.ad}{p.views ? ` · ${p.views} kez açıldı` : ""}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[12.5px] font-semibold">
                    {p.token && <a href={`/teklif/${p.token}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-slate hover:text-ink"><ExternalLink size={13} /> Link</a>}
                    <Link href={`/admin/teklif-studyosu?id=${p.id}`} className="text-brand hover:underline">Aç</Link>
                    {!card.payments.some((x) => x.proposal_id === p.id) && <button onClick={() => crm({ action: "planToPayments", proposalId: p.id })} className="text-brand hover:underline">Tahsilat planı oluştur</button>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {card.payments.length > 0 && (
            <section className="rounded-2xl border border-line bg-paper-raised p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">Tahsilat</h2>
                <p className="text-[13px] text-slate">Alınan {money(paid, card.payments[0].currency)} / {money(totalPay, card.payments[0].currency)}</p>
              </div>
              <div className="mt-2 divide-y divide-line">
                {card.payments.map((x) => {
                  const late = !x.paid_at && x.due_at && x.due_at < new Date().toISOString().slice(0, 10);
                  return (
                    <div key={x.id} className="grid items-center gap-2 py-2 text-[13.5px] sm:grid-cols-[1fr_110px_150px_150px]">
                      <span className={x.paid_at ? "text-slate line-through" : late ? "font-semibold text-red-600" : ""}>{x.step}</span>
                      <span className="font-mono-data">{money(Number(x.amount), x.currency)}</span>
                      <label className="text-[11.5px] text-slate">Vade<input type="date" value={x.due_at ?? ""} onChange={(e) => crm({ action: "paymentUpdate", id: x.id, due_at: e.target.value })} className="ml-1 rounded border border-line bg-paper px-1 py-0.5" /></label>
                      <label className="text-[11.5px] text-slate">Ödendi<input type="date" value={x.paid_at ?? ""} onChange={(e) => crm({ action: "paymentUpdate", id: x.id, paid_at: e.target.value })} className="ml-1 rounded border border-line bg-paper px-1 py-0.5" /></label>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-line bg-paper-raised p-5">
            <h2 className="font-semibold">Faaliyet</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-[150px_1fr_150px_150px_auto]">
              <select value={act.kind} onChange={(e) => setAct({ ...act, kind: e.target.value })} aria-label="Tür" className="rounded-lg border border-line bg-paper px-2 py-2 text-[13px]">{ACTIVITY_KINDS.map((k) => <option key={k.key} value={k.key}>{k.ad}</option>)}</select>
              <input value={act.text} onChange={(e) => setAct({ ...act, text: e.target.value })} placeholder="Ne konuşuldu, ne yapılacak?" className="rounded-lg border border-line bg-paper px-3 py-2 text-[13.5px]" />
              <input type="date" value={act.due} onChange={(e) => setAct({ ...act, due: e.target.value })} aria-label="Sonraki adım tarihi" title="Sonraki adım tarihi" className="rounded-lg border border-line bg-paper px-2 py-2 text-[13px]" />
              <select value={act.staff} onChange={(e) => setAct({ ...act, staff: e.target.value })} aria-label="Personel" className="rounded-lg border border-line bg-paper px-2 py-2 text-[13px]"><option value="">Personel</option>{staff.filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}</select>
              <button onClick={addActivity} className="rounded-lg bg-ink px-3 py-2 text-[13px] font-semibold text-paper">Ekle</button>
            </div>
            <p className="mt-1 text-[12px] text-slate">Tarih girerseniz iş, o gün “Bugün” ekranına düşer.</p>
            <div className="mt-3 space-y-2">
              {card.activities.length === 0 && <p className="text-[13.5px] text-slate">Henüz kayıt yok.</p>}
              {card.activities.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-3 border-l-2 border-line pl-3 text-[13.5px]">
                  <div>
                    <p><b>{ACTIVITY_LABEL[a.kind] ?? a.kind}</b> <span className="text-[12px] text-slate">· {new Date(a.created_at).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}{a.staff_id ? ` · ${staff.find((s) => s.id === a.staff_id)?.full_name ?? ""}` : ""}</span></p>
                    {a.text && <p className="text-slate">{a.text}</p>}
                  </div>
                  {a.due_at && (a.done_at ? <span className="whitespace-nowrap text-[12px] text-volt">Tamamlandı</span> : <button onClick={() => crm({ action: "taskDone", id: a.id })} className="inline-flex items-center gap-1 whitespace-nowrap text-[12.5px] font-semibold text-brand"><CheckCircle2 size={14} /> {dt(a.due_at)}</button>)}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-line bg-paper-raised p-4">
            <label className="block"><span className="text-[12.5px] font-semibold text-slate">Sorumlu personel</span>
              <select value={c.assigned_to ?? ""} onChange={(e) => saveCustomer({ assigned_to: e.target.value ? Number(e.target.value) : null })} className={field}><option value="">Atanmadı</option>{staff.filter((s) => s.active || s.id === c.assigned_to).map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}</select>
            </label>
            {staff.length === 0 && <p className="mt-1 text-[12px] text-slate">Personeli Yönetim ekranından ekleyin.</p>}
          </section>
          <section className="rounded-2xl border border-line bg-paper-raised p-4">
            <div className="flex items-center justify-between"><h2 className="font-semibold">Bilgiler</h2><button onClick={() => setEdit(edit ? null : c)} className="text-[13px] font-semibold text-brand">{edit ? "Vazgeç" : "Düzenle"}</button></div>
            {edit ? (
              <div className="mt-2 space-y-2">
                <label className="block"><span className="text-[12px] text-slate">Ad soyad</span><input value={edit.full_name} onChange={(e) => setEdit({ ...edit, full_name: e.target.value })} className={field} /></label>
                <label className="block"><span className="text-[12px] text-slate">Telefon</span><input value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} className={field} /></label>
                <label className="block"><span className="text-[12px] text-slate">E-posta</span><input value={edit.email ?? ""} onChange={(e) => setEdit({ ...edit, email: e.target.value })} className={field} /></label>
                <label className="block"><span className="text-[12px] text-slate">Firma</span><input value={edit.company ?? ""} onChange={(e) => setEdit({ ...edit, company: e.target.value })} className={field} /></label>
                <CustomerPlace province={edit.province ?? ""} district={edit.district ?? ""} onChange={(x) => setEdit({ ...edit, ...x })} />
                <label className="block"><span className="text-[12px] text-slate">Adres</span><input value={edit.address ?? ""} onChange={(e) => setEdit({ ...edit, address: e.target.value })} className={field} /></label>
                <label className="block"><span className="text-[12px] text-slate">Müşteri tipi</span><select value={edit.segment ?? ""} onChange={(e) => setEdit({ ...edit, segment: e.target.value })} className={field}><option value="">Seçin</option>{SEGMENTS.map((s) => <option key={s}>{s}</option>)}</select></label>
                <label className="block"><span className="text-[12px] text-slate">Not</span><textarea value={edit.notes ?? ""} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} rows={3} className={field} /></label>
                <button onClick={() => saveCustomer({ full_name: edit.full_name, phone: edit.phone, email: edit.email ?? "", company: edit.company ?? "", province: edit.province ?? "", district: edit.district ?? "", address: edit.address ?? "", segment: edit.segment ?? "", notes: edit.notes ?? "" })} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-paper">Kaydet</button>
              </div>
            ) : (
              <dl className="mt-2 space-y-1 text-[13.5px]">
                <div>{c.email || <span className="text-slate">E-posta yok</span>}</div>
                <div>{c.address || <span className="text-slate">Adres yok</span>}</div>
                {c.notes && <div className="whitespace-pre-line text-slate">{c.notes}</div>}
              </dl>
            )}
          </section>
          <section className="rounded-2xl border border-line bg-paper-raised p-4">
            <h2 className="font-semibold">Talepler</h2>
            {card.requests.length === 0 && <p className="mt-1 text-[13px] text-slate">Bu numarayla gelen talep yok.</p>}
            <div className="mt-2 space-y-2 text-[13px]">
              {card.requests.map((r, i) => (
                <div key={i}><p className="font-semibold">{r.kind} <span className="font-normal text-slate">· {dt(r.at)}</span></p><p className="text-slate">{r.text}</p></div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
