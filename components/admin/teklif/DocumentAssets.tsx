"use client";

/* eslint-disable @next/next/no-img-element -- yönetim ekranında proje görselleri */
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Search, Trash2 } from "lucide-react";
import FileUploadField from "@/components/admin/FileUploadField";
import { DEFAULT_REFERENCE_IDS, DEFAULT_SETTINGS, type Datasheet, type QuoteSettings } from "@/lib/teklif/pricing";

// Teklif belgeleri: ürün datasheet'leri, teklifte görünecek referanslar, şartlar ve banka hesapları.
// PDF'ler Supabase Storage'a yüklenir; her değişiklik anında kaydedilir.

const uid = () => Math.random().toString(36).slice(2, 9);
export type DocProduct = { slug: string; name: string; group: "Panel" | "İnvertör" | "Batarya" };
export type DocProject = { id: number; title: string; location?: string | null; image?: string | null };

const covers = (d: Datasheet, x: DocProduct) => Boolean(d.slugs?.includes(x.slug) || (d.kelime?.trim() && x.name.toLocaleLowerCase("tr-TR").includes(d.kelime.trim().toLocaleLowerCase("tr-TR"))));

export default function DocumentAssets({ products, projects }: { products: DocProduct[]; projects: DocProject[] }) {
  const [settings, setSettings] = useState<QuoteSettings | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<DocProduct["group"] | "Hepsi">("Hepsi");
  const [onlyMissing, setOnlyMissing] = useState(true);
  const [linking, setLinking] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/quote-settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setSettings({ ...DEFAULT_SETTINGS, ...d }))
      .catch(() => setSettings(DEFAULT_SETTINGS));
  }, []);

  const sheets = useMemo(() => settings?.datasheets ?? [], [settings]);
  const rows = useMemo(() => {
    const s = q.trim().toLocaleLowerCase("tr-TR");
    return products
      .map((x) => ({ ...x, sheet: sheets.find((d) => covers(d, x)) }))
      .filter((x) => (group === "Hepsi" || x.group === group) && (!onlyMissing || !x.sheet) && (!s || x.name.toLocaleLowerCase("tr-TR").includes(s)));
  }, [products, sheets, q, group, onlyMissing]);
  const coverage = (["Panel", "İnvertör", "Batarya"] as const).map((g) => {
    const list = products.filter((x) => x.group === g);
    return { g, total: list.length, done: list.filter((x) => sheets.some((d) => covers(d, x))).length };
  });

  async function persist(next: QuoteSettings) {
    setSettings(next);
    setMsg("Kaydediliyor…");
    const r = await fetch("/api/admin/quote-settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
    const d = await r.json().catch(() => ({}));
    setMsg(r.ok ? "Kaydedildi." : `Kaydedilemedi: ${d.error ?? r.status}`);
  }

  if (!settings) return <p className="mt-6 text-[13px] text-slate">Yükleniyor…</p>;
  const patchSheet = (id: string, x: Partial<Datasheet>) => ({ ...settings, datasheets: sheets.map((s) => (s.id === id ? { ...s, ...x } : s)) });
  const refIds = settings.referenceIds?.length ? settings.referenceIds : DEFAULT_REFERENCE_IDS;
  const input = "w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 text-[13px]";

  return (
    <div className="mt-5 space-y-5">
      {msg && <p className="text-[12.5px] font-semibold text-brand">{msg}</p>}

      <section className="rounded-2xl border border-line bg-paper-raised p-5">
        <h2 className="font-semibold">Ürün datasheet&apos;leri</h2>
        <p className="text-[12.5px] text-slate">PDF&apos;i ürünün yanından yükleyin. Teklifte o ürün seçilince PDF&apos;in sonuna kendiliğinden eklenir.</p>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:max-w-md">
          {coverage.map((c) => (
            <button key={c.g} onClick={() => setGroup(group === c.g ? "Hepsi" : c.g)} className={`rounded-xl border p-2.5 text-left ${group === c.g ? "border-ink" : "border-line"}`}>
              <p className="text-[11.5px] text-slate">{c.g}</p>
              <p className="font-mono-data text-[15px] font-semibold">{c.done}/{c.total}</p>
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="relative min-w-[220px] flex-1"><Search size={14} className="absolute left-2.5 top-2.5 text-slate" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ürün ara" className={`${input} pl-8`} /></label>
          <label className="flex items-center gap-1.5 text-[13px]"><input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} /> Yalnız eksikler</label>
        </div>
        <div className="mt-3 divide-y divide-line rounded-xl border border-line">
          {rows.slice(0, 40).map((x) => (
            <div key={x.slug} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-[13px]">
              <span className="flex min-w-0 flex-1 items-center gap-2">
                {x.sheet ? <CheckCircle2 size={15} className="shrink-0 text-volt" /> : <CircleAlert size={15} className="shrink-0 text-sun" />}
                <span><span className="text-[11.5px] text-slate">{x.group} · </span>{x.name}</span>
              </span>
              {x.sheet ? (
                <a href={x.sheet.url} target="_blank" rel="noopener noreferrer" className="text-[12.5px] font-semibold text-brand hover:underline">{x.sheet.ad}</a>
              ) : (
                <span className="flex items-center gap-2">
                  {sheets.length > 0 && (
                    <select aria-label="Mevcut datasheet'e bağla" value="" onChange={(e) => { const d = sheets.find((s) => s.id === e.target.value); if (d) persist(patchSheet(d.id, { slugs: [...(d.slugs ?? []), x.slug] })); }} className="max-w-[170px] rounded-lg border border-line bg-paper px-2 py-1 text-[12.5px]">
                      <option value="">Mevcutla eşle…</option>
                      {sheets.map((s) => <option key={s.id} value={s.id}>{s.ad}</option>)}
                    </select>
                  )}
                  {linking === x.slug ? (
                    <FileUploadField value={null} label="PDF seç" onChange={(url) => { if (url) { persist({ ...settings, datasheets: [...sheets, { id: uid(), ad: x.name, url, slugs: [x.slug] }] }); setLinking(null); } }} />
                  ) : (
                    <button onClick={() => setLinking(x.slug)} className="rounded-lg bg-ink px-2.5 py-1 text-[12.5px] font-semibold text-paper">PDF yükle</button>
                  )}
                </span>
              )}
            </div>
          ))}
          {rows.length === 0 && <p className="px-3 py-4 text-[13px] text-slate">Bu filtrede ürün yok.</p>}
          {rows.length > 40 && <p className="px-3 py-2 text-[12px] text-slate">İlk 40 ürün gösteriliyor ({rows.length} sonuç). Aramayla daraltın.</p>}
        </div>

        <h3 className="mt-5 text-[14px] font-semibold">Yüklenen dosyalar ({sheets.length})</h3>
        <p className="text-[12.5px] text-slate">Tek PDF bir ürün ailesini kapsıyorsa “Adında geçen” alanına ortak ifadeyi yazın (ör. SUN-10K). Adında bunu taşıyan her ürün eşleşir.</p>
        <div className="mt-2 space-y-2">
          {sheets.map((s) => (
            <div key={s.id} className="grid items-center gap-2 rounded-xl border border-line p-2.5 md:grid-cols-[1.6fr_1fr_auto]">
              <input aria-label="Datasheet adı" defaultValue={s.ad} onBlur={(e) => e.target.value !== s.ad && persist(patchSheet(s.id, { ad: e.target.value }))} className={input} />
              <input aria-label="Adında geçen" defaultValue={s.kelime ?? ""} placeholder="Adında geçen" onBlur={(e) => e.target.value !== (s.kelime ?? "") && persist(patchSheet(s.id, { kelime: e.target.value }))} className={input} />
              <span className="flex items-center gap-3 text-[12.5px]">
                <span className="text-slate">{products.filter((x) => covers(s, x)).length} ürün</span>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:underline">Aç</a>
                <button onClick={() => confirm(`${s.ad} silinsin mi?`) && persist({ ...settings, datasheets: sheets.filter((x) => x.id !== s.id) })} aria-label="Datasheet'i sil" className="text-slate hover:text-red-600"><Trash2 size={15} /></button>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-paper-raised p-5">
        <h2 className="font-semibold">Teklifte görünecek referanslar</h2>
        <p className="text-[12.5px] text-slate">Sitedeki referans projelerden seçin. İlk seçilen büyük görünür; her sayfada altı proje yer alır. Yeni proje “Referanslar” sayfasından eklenir.</p>
        <div className="mt-3 grid grid-cols-2 gap-2.5 md:grid-cols-4 lg:grid-cols-6">
          {projects.filter((r) => r.image).map((r) => {
            const at = refIds.indexOf(r.id);
            return (
              <button key={r.id} onClick={() => persist({ ...settings, referenceIds: at >= 0 ? refIds.filter((x) => x !== r.id) : [...refIds, r.id] })} className={`relative overflow-hidden rounded-lg border-2 text-left ${at >= 0 ? "border-brand" : "border-transparent opacity-70 hover:opacity-100"}`}>
                <img src={r.image!} alt={r.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                {at >= 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-paper">{at + 1}</span>}
                <span className="block truncate px-1 py-0.5 text-[11px]">{r.title}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-paper-raised p-5">
        <h2 className="font-semibold">Şartlar ve banka hesapları</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="block"><span className="text-[11.5px] font-semibold text-slate">Önemli notlar (her satır bir madde)</span><textarea rows={9} defaultValue={settings.notlar ?? ""} onBlur={(e) => e.target.value !== settings.notlar && persist({ ...settings, notlar: e.target.value })} className={`mt-0.5 ${input}`} /></label>
          <label className="block"><span className="text-[11.5px] font-semibold text-slate">Garanti dışı unsurlar (her satır bir madde)</span><textarea rows={9} defaultValue={settings.garantiDisi ?? ""} onBlur={(e) => e.target.value !== settings.garantiDisi && persist({ ...settings, garantiDisi: e.target.value })} className={`mt-0.5 ${input}`} /></label>
        </div>
        <label className="mt-3 block"><span className="text-[11.5px] font-semibold text-slate">Hesap sahibi</span><input defaultValue={settings.hesapSahibi ?? ""} onBlur={(e) => e.target.value !== settings.hesapSahibi && persist({ ...settings, hesapSahibi: e.target.value })} className={`mt-0.5 ${input}`} /></label>
        <div className="mt-2 space-y-2">
          {(settings.banks ?? []).map((b, i) => {
            const set = (x: Partial<typeof b>) => persist({ ...settings, banks: settings.banks!.map((v, j) => (j === i ? { ...v, ...x } : v)) });
            return (
              <div key={i} className="grid items-center gap-2 md:grid-cols-[1fr_1fr_2fr_auto]">
                <input aria-label="Banka" defaultValue={b.banka} onBlur={(e) => e.target.value !== b.banka && set({ banka: e.target.value })} className={input} />
                <input aria-label="Şube" defaultValue={b.sube} onBlur={(e) => e.target.value !== b.sube && set({ sube: e.target.value })} className={input} />
                <input aria-label="IBAN" defaultValue={b.iban} onBlur={(e) => e.target.value !== b.iban && set({ iban: e.target.value })} className={input} />
                <button onClick={() => confirm(`${b.banka} kaldırılsın mı?`) && persist({ ...settings, banks: settings.banks!.filter((_, j) => j !== i) })} aria-label="Bankayı kaldır" className="text-slate hover:text-red-600"><Trash2 size={15} /></button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
