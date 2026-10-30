"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Trash2 } from "lucide-react";

// Gönderi planı: taslaklar panelde düzenlenir; onaylanan gönderi Google'a ileri tarihli gider.
// Onaylanmayan hiçbir gönderi yayınlanmaz.

type Planned = { id: number; scheduled_at: string; kind: string; summary: string; url: string | null; photo_url: string | null; approved: boolean; status: string; error: string | null };

const KIND: Record<string, string> = { referans: "Referans", soru: "Soru-cevap", urun: "Ürün" };

// <input type="datetime-local"> yerel saat bekler.
const toLocal = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60e3).toISOString().slice(0, 16);
};

async function post(body: object) {
  const r = await fetch("/api/admin/gbp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? `Hata ${r.status}`);
}

export default function PlannedTab({ location }: { location: string }) {
  const [items, setItems] = useState<Planned[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/admin/gbp?view=planned&location=${location}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setItems(d.items);
      })
      .catch((e) => setError(e.message));
  }, [location]);
  useEffect(load, [load]);

  async function approveAll() {
    const drafts = (items ?? []).filter((x) => !x.approved);
    if (!confirm(`${drafts.length} gönderi Google'a ileri tarihli gönderilecek. Onaylıyor musunuz?`)) return;
    setBusy(true);
    let done = 0;
    for (const x of drafts) {
      setProgress(`${++done} / ${drafts.length}`);
      try {
        await post({ action: "planApprove", id: x.id });
      } catch (e) {
        setError(`${new Date(x.scheduled_at).toLocaleDateString("tr-TR")} gönderisi: ${e instanceof Error ? e.message : "hata"}`);
        break;
      }
    }
    setProgress(null);
    setBusy(false);
    load();
  }

  if (error && !items) return <p className="rounded-xl bg-red-500/10 p-4 text-[14px] text-red-700">{/gbp_scheduled_posts/.test(error) ? "Plan tablosu henüz yok: supabase/gbp-scheduled-posts.sql çalıştırılmalı." : error}</p>;
  if (!items) return <p className="text-slate">Yükleniyor…</p>;
  const drafts = items.filter((x) => !x.approved).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13.5px] text-slate">{items.length} gönderi · {drafts} onay bekliyor · {items.length - drafts} Google&apos;da planlı</p>
        {drafts > 0 && (
          <button disabled={busy} onClick={approveAll} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-[13.5px] font-semibold text-paper hover:bg-brand-deep disabled:opacity-40">
            <Check size={15} /> {progress ? `Gönderiliyor ${progress}` : "Hepsini onayla"}
          </button>
        )}
      </div>
      {error && <p className="mt-2 rounded-xl bg-red-500/10 p-3 text-[13.5px] text-red-700">{error}</p>}
      {items.length === 0 && <p className="mt-6 text-slate">Bu işletme için planlı gönderi yok.</p>}
      <div className="mt-4 space-y-3">
        {items.map((x) => (
          <Row key={x.id} x={x} onChange={load} onError={setError} />
        ))}
      </div>
    </div>
  );
}

function Row({ x, onChange, onError }: { x: Planned; onChange: () => void; onError: (m: string) => void }) {
  const [summary, setSummary] = useState(x.summary);
  const [url, setUrl] = useState(x.url ?? "");
  const [at, setAt] = useState(toLocal(x.scheduled_at));
  const [busy, setBusy] = useState(false);
  const dirty = summary !== x.summary || url !== (x.url ?? "") || at !== toLocal(x.scheduled_at);

  async function run(body: object) {
    setBusy(true);
    try {
      await post(body);
      onChange();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Hata");
    }
    setBusy(false);
  }

  return (
    <div className={`grid gap-4 rounded-2xl border bg-paper-raised p-4 sm:grid-cols-[150px_1fr] ${x.approved ? "border-volt/40" : "border-line"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Google'a gidecek özgün görsel aynen gösterilir */}
      {x.photo_url ? <img src={x.photo_url} alt="" className="h-28 w-full rounded-lg object-cover sm:w-[150px]" /> : <div className="flex h-28 items-center justify-center rounded-lg bg-ink/5 text-[12px] text-slate">Görselsiz</div>}
      <div>
        <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
          <span className="rounded-full border border-line px-2 py-0.5 font-semibold">{KIND[x.kind] ?? x.kind}</span>
          <span className={x.approved ? "font-semibold text-volt" : "text-slate"}>{x.approved ? "Google'da planlı" : "Onay bekliyor"}</span>
          {!x.approved && <input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} className="rounded-lg border border-line bg-paper px-2 py-1" />}
          {x.approved && <span className="text-slate">{new Date(x.scheduled_at).toLocaleString("tr-TR", { dateStyle: "long", timeStyle: "short" })}</span>}
        </div>
        {x.approved ? (
          <p className="mt-2 whitespace-pre-line text-[14px]">{x.summary}</p>
        ) : (
          <>
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} maxLength={1500} className="mt-2 w-full rounded-lg border border-line bg-paper px-3 py-2 text-[14px] outline-none focus:border-brand" />
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Bağlantı (isteğe bağlı)" className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-[13px] outline-none focus:border-brand" />
          </>
        )}
        {x.approved && x.url && <p className="mt-1 break-all text-[12.5px] text-slate">{x.url}</p>}
        {x.error && <p className="mt-1 text-[12.5px] text-red-600">{x.error}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px] font-semibold">
          {!x.approved && dirty && (
            <button disabled={busy} onClick={() => run({ action: "planUpdate", id: x.id, summary, url, scheduledAt: new Date(at).toISOString() })} className="text-brand hover:underline">Kaydet</button>
          )}
          {!x.approved && !dirty && (
            <button disabled={busy} onClick={() => run({ action: "planApprove", id: x.id })} className="inline-flex items-center gap-1 text-brand hover:underline"><Check size={14} /> Onayla</button>
          )}
          {x.approved && (
            <button disabled={busy} onClick={() => run({ action: "planRevoke", id: x.id })} className="text-slate hover:text-ink">Geri al (Google&apos;dan kaldır)</button>
          )}
          <button disabled={busy} onClick={() => confirm("Bu gönderi plandan silinsin mi?") && run({ action: "planDelete", id: x.id })} className="inline-flex items-center gap-1 text-slate hover:text-red-600"><Trash2 size={14} /> Sil</button>
        </div>
      </div>
    </div>
  );
}
