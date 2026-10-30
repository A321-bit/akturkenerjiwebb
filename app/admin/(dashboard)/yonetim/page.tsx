"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

// Yönetim: personelin bugünkü işleri ve yöneticinin şirket özeti tek ekranda.

type Kpi = { days: number; talep: number; musteri: number; teklif: number; satis: number; kayip: number; ciroUsd: number; karUsd: number; kw: number; kapanmaGun: number | null; bekleyenTahsilat: number; alinanTahsilat: number; gecikenTahsilat: number };
type Item = { id: number; customerId: number | null; ad: string | null; phone: string | null; no: string; at?: string; note?: string };
type Data = {
  staff: { id: number; full_name: string; title: string | null; active: boolean }[];
  today: {
    tasks: { id: number; customer_id: number; kind: string; text: string | null; due_at: string; customers: { full_name: string; phone: string } | null }[];
    hot: Item[];
    follow: Item[];
    fresh: { id: number; full_name: string; phone: string; source: string | null }[];
    overdue: { id: number; step: string; amount: number; currency: string; due_at: string; ad: string | null; customerId: number | null }[];
  };
  kpi: Kpi;
  channels: { ad: string; musteri: number; teklif: number; satis: number }[];
  perStaff: { id: number; ad: string; musteri: number; teklif: number; satis: number; ciro: number }[];
  reasons: { ad: string; adet: number }[];
  openProjects: number;
};

const n0 = (v: number) => Math.round(v).toLocaleString("tr-TR");
const pct = (a: number, b: number) => (b > 0 ? `%${Math.round((a / b) * 100)}` : "—");

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper-raised p-4">
      <p className="text-[12.5px] text-slate">{label}</p>
      <p className="mt-1 font-mono-data text-[21px] font-semibold">{value}</p>
      {note && <p className="text-[12px] text-slate">{note}</p>}
    </div>
  );
}

function Group({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  if (!count) return null;
  return (
    <section className="rounded-2xl border border-line bg-paper-raised p-4">
      <h3 className="font-semibold">{title} <span className="text-slate">({count})</span></h3>
      <div className="mt-2 divide-y divide-line text-[13.5px]">{children}</div>
    </section>
  );
}

export default function YonetimPage() {
  const [d, setD] = useState<Data | null>(null);
  const [gun, setGun] = useState(90);
  const [error, setError] = useState<string | null>(null);
  const [yeni, setYeni] = useState({ full_name: "", title: "" });

  const load = useCallback(() => {
    fetch(`/api/admin/crm?gun=${gun}`)
      .then(async (r) => {
        const x = await r.json();
        if (!r.ok) throw new Error(x.error);
        setD(x);
      })
      .catch((e) => setError(e.message));
  }, [gun]);
  useEffect(load, [load]);

  const post = (body: object) => fetch("/api/admin/crm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(load);

  if (error) return <p className="rounded-xl bg-red-500/10 p-4 text-red-700">{error}</p>;
  if (!d) return <p className="text-slate">Yükleniyor…</p>;
  const k = d.kpi;
  const t = d.today;
  const todayCount = t.tasks.length + t.hot.length + t.follow.length + t.overdue.length + t.fresh.length;
  const funnel = [
    { ad: "Talep", v: k.talep },
    { ad: "Teklif", v: k.teklif },
    { ad: "Satış", v: k.satis },
  ];
  const top = Math.max(1, ...funnel.map((f) => f.v));

  return (
    <div>
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Satış</p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Yönetim</h1>

      <h2 className="mt-5 text-[17px] font-semibold">Bugün yapılacaklar {todayCount === 0 && <span className="text-[14px] font-normal text-slate">· bekleyen iş yok</span>}</h2>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <Group title="Teklifi son 2 günde açanlar: şimdi arayın" count={t.hot.length}>
          {t.hot.map((x) => <div key={x.id} className="flex justify-between gap-2 py-2"><Link href={x.customerId ? `/admin/musteriler/${x.customerId}` : `/admin/teklif-studyosu?id=${x.id}`} className="font-semibold hover:text-brand">{x.ad ?? "İsimsiz"}</Link>{x.phone && <a href={`tel:${x.phone}`} className="text-brand">{x.phone}</a>}</div>)}
        </Group>
        <Group title="Görevler" count={t.tasks.length}>
          {t.tasks.map((x) => (
            <div key={x.id} className="flex items-start justify-between gap-2 py-2">
              <div><Link href={`/admin/musteriler/${x.customer_id}`} className="font-semibold hover:text-brand">{x.customers?.full_name}</Link><p className="text-[12.5px] text-slate">{x.text} · {new Date(x.due_at).toLocaleDateString("tr-TR")}</p></div>
              <button onClick={() => post({ action: "taskDone", id: x.id })} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand"><CheckCircle2 size={14} /> Bitti</button>
            </div>
          ))}
        </Group>
        <Group title="Takip günü gelen teklifler" count={t.follow.length}>
          {t.follow.map((x) => <div key={x.id} className="py-2"><Link href={x.customerId ? `/admin/musteriler/${x.customerId}` : `/admin/teklif-studyosu?id=${x.id}`} className="font-semibold hover:text-brand">{x.ad ?? "İsimsiz"}</Link>{x.note && <p className="text-[12.5px] text-slate">{x.note}</p>}</div>)}
        </Group>
        <Group title="Geciken tahsilat" count={t.overdue.length}>
          {t.overdue.map((x) => <div key={x.id} className="flex justify-between gap-2 py-2"><span>{x.customerId ? <Link href={`/admin/musteriler/${x.customerId}`} className="font-semibold hover:text-brand">{x.ad}</Link> : x.ad} <span className="text-[12.5px] text-slate">· {x.step}</span></span><span className="font-mono-data text-red-600">{n0(Number(x.amount))} {x.currency === "USD" ? "$" : "TL"}</span></div>)}
        </Group>
        <Group title="Yeni, henüz aranmamış" count={t.fresh.length}>
          {t.fresh.map((x) => <div key={x.id} className="flex justify-between gap-2 py-2"><Link href={`/admin/musteriler/${x.id}`} className="font-semibold hover:text-brand">{x.full_name}</Link><a href={`tel:${x.phone}`} className="text-brand">{x.phone}</a></div>)}
        </Group>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[17px] font-semibold">Şirket özeti</h2>
        <div className="flex gap-1">
          {[30, 90, 365].map((g) => <button key={g} onClick={() => setGun(g)} className={`rounded-full border px-3 py-1 text-[13px] font-semibold ${gun === g ? "border-ink bg-ink text-paper" : "border-line text-slate"}`}>{g === 365 ? "1 yıl" : `${g} gün`}</button>)}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Satış" value={`${k.satis}`} note={`Tekliften ${pct(k.satis, k.teklif)}`} />
        <Stat label="Ciro (KDV dahil)" value={`${n0(k.ciroUsd)} $`} note="Dolar bazlı teklifler" />
        <Stat label="Tahmini kâr (KDV hariç)" value={`${n0(k.karUsd)} $`} note="Kalem maliyetlerinden" />
        <Stat label="Satılan güç" value={`${n0(k.kw)} kWp`} note={`${d.openProjects} açık proje`} />
        <Stat label="Alınan tahsilat" value={`${n0(k.alinanTahsilat)} $`} />
        <Stat label="Bekleyen tahsilat" value={`${n0(k.bekleyenTahsilat)} $`} />
        <Stat label="Geciken tahsilat" value={`${n0(k.gecikenTahsilat)} $`} />
        <Stat label="Ortalama kapanma" value={k.kapanmaGun != null ? `${n0(k.kapanmaGun)} gün` : "—"} note="Tekliften kabule" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-paper-raised p-4">
          <h3 className="font-semibold">Satış hunisi</h3>
          <div className="mt-3 space-y-2.5">
            {funnel.map((f, i) => (
              <div key={f.ad}>
                <div className="flex justify-between text-[13px]"><span>{f.ad}</span><span className="font-mono-data">{n0(f.v)}{i > 0 ? ` · ${pct(f.v, funnel[i - 1].v)}` : ""}</span></div>
                <div className="mt-1 h-2 rounded-full bg-ink/5"><div className="h-2 rounded-full bg-brand" style={{ width: `${Math.max(1, (f.v / top) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
          {d.reasons.length > 0 && (
            <div className="mt-4 border-t border-line pt-3 text-[13px]">
              <p className="font-semibold">Kaybedilme sebepleri ({k.kayip})</p>
              {d.reasons.map((r) => <div key={r.ad} className="flex justify-between text-slate"><span>{r.ad}</span><span>{r.adet}</span></div>)}
            </div>
          )}
        </section>
        <section className="rounded-2xl border border-line bg-paper-raised p-4">
          <h3 className="font-semibold">Hangi kanal satış getiriyor?</h3>
          <table className="mt-2 w-full text-[13px]">
            <thead className="text-slate"><tr className="border-b border-line text-left"><th className="py-1 font-medium">Kaynak</th><th className="text-right font-medium">Müşteri</th><th className="text-right font-medium">Teklif</th><th className="text-right font-medium">Satış</th></tr></thead>
            <tbody>{d.channels.map((c) => <tr key={c.ad} className="border-b border-line last:border-0"><td className="py-1.5">{c.ad}</td><td className="text-right">{c.musteri}</td><td className="text-right">{c.teklif}</td><td className="text-right font-semibold">{c.satis}</td></tr>)}</tbody>
          </table>
          {d.channels.length === 0 && <p className="mt-2 text-[13px] text-slate">Bu dönemde kayıt yok.</p>}
        </section>
      </div>

      <section className="mt-4 rounded-2xl border border-line bg-paper-raised p-4">
        <h3 className="font-semibold">Personel</h3>
        <table className="mt-2 w-full text-[13px]">
          <thead className="text-slate"><tr className="border-b border-line text-left"><th className="py-1 font-medium">Ad</th><th className="text-right font-medium">Müşteri</th><th className="text-right font-medium">Teklif</th><th className="text-right font-medium">Satış</th><th className="text-right font-medium">Ciro $</th></tr></thead>
          <tbody>{d.perStaff.map((s) => <tr key={s.id} className="border-b border-line last:border-0"><td className="py-1.5">{s.ad}</td><td className="text-right">{s.musteri}</td><td className="text-right">{s.teklif}</td><td className="text-right">{s.satis}</td><td className="text-right font-mono-data">{n0(s.ciro)}</td></tr>)}</tbody>
        </table>
        {d.staff.length === 0 && <p className="mt-2 text-[13px] text-slate">Henüz personel yok.</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <input value={yeni.full_name} onChange={(e) => setYeni({ ...yeni, full_name: e.target.value })} placeholder="Ad soyad" className="rounded-lg border border-line bg-paper px-3 py-1.5 text-[13.5px]" />
          <input value={yeni.title} onChange={(e) => setYeni({ ...yeni, title: e.target.value })} placeholder="Unvan" className="rounded-lg border border-line bg-paper px-3 py-1.5 text-[13.5px]" />
          <button onClick={() => yeni.full_name.trim() && post({ action: "staffAdd", ...yeni }).then(() => setYeni({ full_name: "", title: "" }))} className="rounded-lg bg-ink px-3 py-1.5 text-[13px] font-semibold text-paper">Personel ekle</button>
        </div>
      </section>
    </div>
  );
}
