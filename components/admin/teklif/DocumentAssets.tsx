"use client";

/* eslint-disable @next/next/no-img-element -- yönetim ekranında yüklenen görseller */
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import FileUploadField from "@/components/admin/FileUploadField";
import type { QuoteSettings } from "@/lib/teklif/pricing";

// Teklif PDF'inin ekleri: ürün datasheet'leri, referans görselleri, banka bilgileri ve şartlar.
// Dosyalar Supabase Storage'a yüklenir; değişiklikler anında kaydedilir.

const uid = () => Math.random().toString(36).slice(2, 9);
type Product = { slug?: string; name: string };

export default function DocumentAssets({ settings, onChange, products }: { settings: QuoteSettings; onChange: (s: QuoteSettings) => void; products: Product[] }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [adding, setAdding] = useState<{ ad: string; url: string | null }>({ ad: "", url: null });
  const sheets = settings.datasheets ?? [];
  const refs = settings.references ?? [];
  const input = "w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 text-[13px]";

  async function persist(next: QuoteSettings) {
    onChange(next);
    setMsg("Kaydediliyor…");
    const r = await fetch("/api/admin/quote-settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
    const d = await r.json().catch(() => ({}));
    setMsg(r.ok ? "Kaydedildi." : `Kaydedilemedi: ${d.error ?? r.status}`);
  }
  const patchSheet = (id: string, x: Partial<NonNullable<QuoteSettings["datasheets"]>[number]>) => ({ ...settings, datasheets: sheets.map((s) => (s.id === id ? { ...s, ...x } : s)) });

  return (
    <div className="mt-5 space-y-5">
      {msg && <p className="text-[12.5px] font-semibold text-brand">{msg}</p>}

      <section className="rounded-2xl border border-line bg-paper-raised p-5">
        <h3 className="font-semibold">Ürün datasheet&apos;leri</h3>
        <p className="text-[12.5px] text-slate">Her datasheet&apos;i bir kez yükleyin ve ürüne bağlayın. Teklifte o ürün seçilince PDF&apos;in sonuna kendiliğinden eklenir. Hazır paketlerdeki ürünler için “Kalem adında geçen” alanını doldurun.</p>
        <div className="mt-3 space-y-3">
          {sheets.map((s) => (
            <div key={s.id} className="rounded-xl border border-line p-3">
              <div className="grid gap-2 md:grid-cols-[1.4fr_1fr_auto]">
                <input aria-label="Datasheet adı" defaultValue={s.ad} onBlur={(e) => e.target.value !== s.ad && persist(patchSheet(s.id, { ad: e.target.value }))} className={input} />
                <input aria-label="Kalem adında geçen" defaultValue={s.kelime ?? ""} placeholder="Kalem adında geçen, ör. 51.2V 280" onBlur={(e) => e.target.value !== (s.kelime ?? "") && persist(patchSheet(s.id, { kelime: e.target.value }))} className={input} />
                <div className="flex items-center gap-3">
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-brand hover:underline">Aç</a>
                  <button onClick={() => confirm(`${s.ad} silinsin mi?`) && persist({ ...settings, datasheets: sheets.filter((x) => x.id !== s.id) })} aria-label="Datasheet'i sil" className="text-slate hover:text-red-600"><Trash2 size={15} /></button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px]">
                {(s.slugs ?? []).map((slug) => (
                  <span key={slug} className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2 py-0.5">
                    {products.find((x) => x.slug === slug)?.name ?? slug}
                    <button onClick={() => persist(patchSheet(s.id, { slugs: (s.slugs ?? []).filter((x) => x !== slug) }))} aria-label="Bağlantıyı kaldır" className="text-slate hover:text-red-600">×</button>
                  </span>
                ))}
                <select aria-label="Ürüne bağla" value="" onChange={(e) => e.target.value && persist(patchSheet(s.id, { slugs: [...(s.slugs ?? []), e.target.value] }))} className="max-w-[320px] rounded-lg border border-line bg-paper px-2 py-1">
                  <option value="">Ürüne bağla…</option>
                  {products.filter((x) => x.slug && !(s.slugs ?? []).includes(x.slug)).map((x) => <option key={x.slug} value={x.slug}>{x.name}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-line pt-3">
          <label className="block min-w-[240px] flex-1">
            <span className="text-[11.5px] font-semibold text-slate">Yeni datasheet adı</span>
            <input value={adding.ad} onChange={(e) => setAdding({ ...adding, ad: e.target.value })} className={`mt-0.5 ${input}`} />
          </label>
          <FileUploadField value={adding.url} onChange={(url) => setAdding({ ...adding, url })} label="PDF seç" />
          <button disabled={!adding.ad.trim() || !adding.url} onClick={() => { persist({ ...settings, datasheets: [...sheets, { id: uid(), ad: adding.ad.trim(), url: adding.url!, slugs: [] }] }); setAdding({ ad: "", url: null }); }} className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-[13px] font-semibold text-paper disabled:opacity-40"><Plus size={14} /> Ekle</button>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-paper-raised p-5">
        <h3 className="font-semibold">Referans görselleri</h3>
        <p className="text-[12.5px] text-slate">Teklifte her sayfada iki görsel olacak şekilde sıralanır. Yatay görsel kullanın.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {refs.map((r) => (
            <div key={r.id} className="relative">
              <img src={r.url} alt={r.ad} className="aspect-[4/3] w-full rounded-lg object-cover" />
              <button onClick={() => confirm("Görsel kaldırılsın mı?") && persist({ ...settings, references: refs.filter((x) => x.id !== r.id) })} aria-label="Görseli kaldır" className="absolute right-1.5 top-1.5 rounded-full bg-ink/80 p-1 text-paper"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <FileUploadField value={null} onChange={(url) => url && persist({ ...settings, references: [...refs, { id: uid(), ad: "Referans", url }] })} accept="image/*" label="Görsel ekle" preview="image" />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-paper-raised p-5">
        <h3 className="font-semibold">Şartlar ve banka bilgileri</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="block"><span className="text-[11.5px] font-semibold text-slate">Önemli notlar (her satır bir madde)</span><textarea rows={8} defaultValue={settings.notlar ?? ""} onBlur={(e) => e.target.value !== settings.notlar && persist({ ...settings, notlar: e.target.value })} className={`mt-0.5 ${input}`} /></label>
          <label className="block"><span className="text-[11.5px] font-semibold text-slate">Garanti dışı unsurlar (her satır bir madde)</span><textarea rows={8} defaultValue={settings.garantiDisi ?? ""} onBlur={(e) => e.target.value !== settings.garantiDisi && persist({ ...settings, garantiDisi: e.target.value })} className={`mt-0.5 ${input}`} /></label>
        </div>
        <label className="mt-3 block"><span className="text-[11.5px] font-semibold text-slate">Hesap sahibi</span><input defaultValue={settings.hesapSahibi ?? ""} onBlur={(e) => e.target.value !== settings.hesapSahibi && persist({ ...settings, hesapSahibi: e.target.value })} className={`mt-0.5 ${input}`} /></label>
        <div className="mt-2 space-y-2">
          {(settings.banks ?? []).map((b) => (
            <div key={b.iban} className="grid gap-2 md:grid-cols-[1fr_1fr_2fr_auto]">
              <input aria-label="Banka" defaultValue={b.banka} onBlur={(e) => persist({ ...settings, banks: settings.banks!.map((x) => (x === b ? { ...x, banka: e.target.value } : x)) })} className={input} />
              <input aria-label="Şube" defaultValue={b.sube} onBlur={(e) => persist({ ...settings, banks: settings.banks!.map((x) => (x === b ? { ...x, sube: e.target.value } : x)) })} className={input} />
              <input aria-label="IBAN" defaultValue={b.iban} onBlur={(e) => persist({ ...settings, banks: settings.banks!.map((x) => (x === b ? { ...x, iban: e.target.value } : x)) })} className={input} />
              <button onClick={() => confirm(`${b.banka} kaldırılsın mı?`) && persist({ ...settings, banks: settings.banks!.filter((x) => x !== b) })} aria-label="Bankayı kaldır" className="text-slate hover:text-red-600"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
