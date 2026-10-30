"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { STAGES } from "@/lib/teklif/tracking";
import { SEGMENTS, channelOf } from "@/lib/crm";
import CustomerPlace from "@/components/admin/teklif/CustomerPlace";

// Müşteriler: tek liste, arama, yeni müşteri ve taleplerden aktarma.

type Row = { id: number; created_at: string; full_name: string; company: string | null; phone: string; province: string | null; district: string | null; source: string | null; proposals: number; stage: string | null; last_activity: string | null };

const empty = { full_name: "", phone: "", email: "", company: "", province: "", district: "", address: "", segment: "Mesken" };

export default function MusterilerPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState<typeof empty | null>(null);
  const [dup, setDup] = useState<{ id: number; full_name: string } | null>(null);

  const load = useCallback((term: string) => {
    fetch(`/api/admin/customers?q=${encodeURIComponent(term)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setRows(d);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    const t = setTimeout(() => load(q), 250);
    return () => clearTimeout(t);
  }, [q, load]);

  async function create() {
    if (!form) return;
    setError(null);
    setDup(null);
    const r = await fetch("/api/admin/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json().catch(() => ({}));
    if (r.status === 409) return setDup(d.existing);
    if (!r.ok) return setError(d.error ?? "Kaydedilemedi.");
    location.href = `/admin/musteriler/${d.id}`;
  }

  async function importAll() {
    setMsg("Aktarılıyor…");
    const r = await fetch("/api/admin/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "import" }) });
    const d = await r.json().catch(() => ({}));
    setMsg(r.ok ? `${d.scanned} talep tarandı, ${d.added} yeni müşteri eklendi. Aynı telefon tekrar eklenmez.` : (d.error ?? "Aktarılamadı."));
    load(q);
  }

  const field = "mt-1 w-full rounded-lg border border-line bg-paper-raised px-3 py-2 outline-none focus:border-brand";
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Satış</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Müşteriler</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={importAll} className="rounded-lg border border-line px-3 py-2 text-[13px] font-semibold hover:border-ink">Taleplerden aktar</button>
          <button onClick={() => setForm(form ? null : empty)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[13px] font-semibold text-paper hover:bg-brand-deep"><Plus size={15} /> Yeni müşteri</button>
        </div>
      </div>
      {msg && <p className="mt-2 text-[13px] text-slate">{msg}</p>}
      {error && <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-[13.5px] text-red-700">{error}</p>}

      {form && (
        <section className="mt-4 rounded-2xl border border-line bg-paper-raised p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="text-[12.5px] font-semibold text-slate">Ad soyad *</span><input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={field} /></label>
            <label className="block"><span className="text-[12.5px] font-semibold text-slate">Telefon *</span><input inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="05xx xxx xx xx" className={field} /></label>
            <label className="block"><span className="text-[12.5px] font-semibold text-slate">E-posta</span><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} /></label>
            <label className="block"><span className="text-[12.5px] font-semibold text-slate">Firma</span><input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={field} /></label>
            <CustomerPlace province={form.province} district={form.district} onChange={(x) => setForm({ ...form, ...x })} />
            <label className="block sm:col-span-2"><span className="text-[12.5px] font-semibold text-slate">Adres</span><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={field} /></label>
            <label className="block"><span className="text-[12.5px] font-semibold text-slate">Müşteri tipi</span><select value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })} className={field}>{SEGMENTS.map((s) => <option key={s}>{s}</option>)}</select></label>
          </div>
          {dup && <p className="mt-3 rounded-lg bg-sun/15 p-3 text-[13.5px]">Bu numara <Link href={`/admin/musteriler/${dup.id}`} className="font-semibold text-brand underline">{dup.full_name}</Link> adına kayıtlı. Yeni kayıt açılmadı, mevcut kartı kullanın.</p>}
          <button onClick={create} className="mt-3 rounded-lg bg-brand px-4 py-2 text-[13.5px] font-semibold text-paper">Kaydet</button>
        </section>
      )}

      <div className="mt-4 flex max-w-md items-center rounded-xl border border-line bg-paper-raised focus-within:border-brand">
        <Search size={16} className="ml-3 text-slate" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ad, firma, telefon, il ya da ilçe" className="w-full bg-transparent px-3 py-2.5 outline-none" />
      </div>

      {!rows && !error && <p className="mt-4 text-slate">Yükleniyor…</p>}
      {rows && rows.length === 0 && <p className="mt-6 text-slate">Kayıt yok. Mevcut talepleri müşteri listesine almak için “Taleplerden aktar”a basın.</p>}
      {rows && rows.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-paper-raised">
          <table className="w-full min-w-[720px] text-[13.5px]">
            <thead className="text-left text-[12px] text-slate"><tr className="border-b border-line"><th className="p-3 font-medium">Müşteri</th><th className="font-medium">Konum</th><th className="font-medium">Kaynak</th><th className="font-medium">Teklif</th><th className="font-medium">Aşama</th><th className="pr-3 font-medium">Son işlem</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0 hover:bg-ink/[0.03]">
                  <td className="p-3"><Link href={`/admin/musteriler/${c.id}`} className="font-semibold text-ink hover:text-brand">{c.full_name}</Link><br /><span className="text-[12.5px] text-slate">{c.phone}</span></td>
                  <td>{[c.district, c.province].filter(Boolean).join(", ") || "—"}</td>
                  <td>{channelOf(c.source)}</td>
                  <td>{c.proposals || "—"}</td>
                  <td>{c.stage ? STAGES.find((s) => s.key === c.stage)?.ad : c.proposals ? "Teklif verildi" : "—"}</td>
                  <td className="pr-3">{c.last_activity ? new Date(c.last_activity).toLocaleDateString("tr-TR") : <span className="text-slate">Henüz yok</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
