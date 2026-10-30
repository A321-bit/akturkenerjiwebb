"use client";

import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { CATI_ADI, salePrice, type QuoteRule, type QuoteSettings, type RoofKind } from "@/lib/teklif/pricing";

// Fiyat kuralları: konstrüksiyon, kablo, pano, nakliye, vinç, proje gibi kalemlerin maliyeti ve kârı.
// Her kural bir kW aralığında ve istenirse tek çatı tipinde geçerlidir.

const uid = () => Math.random().toString(36).slice(2, 9);
const BIRIM: Record<QuoteRule["birim"], string> = { sabit: "İş başına", kwp: "kWp başına", panel: "Panel başına" };

export default function PricingRules({ settings, onChange }: { settings: QuoteSettings; onChange: (s: QuoteSettings) => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const patch = (id: string, x: Partial<QuoteRule>) => onChange({ ...settings, rules: settings.rules.map((r) => (r.id === id ? { ...r, ...x } : r)) });
  const missing = settings.rules.filter((r) => !r.maliyetUsd).length;

  async function save() {
    setMsg("Kaydediliyor…");
    const r = await fetch("/api/admin/quote-settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    const d = await r.json().catch(() => ({}));
    setMsg(r.ok ? "Kaydedildi." : /quote_settings/.test(d.error ?? "") ? "Ayar tablosu henüz yok: supabase/quote-settings.sql çalıştırılmalı." : `Kaydedilemedi: ${d.error ?? r.status}`);
  }

  const input = "w-full rounded-lg border border-line bg-paper px-2 py-1.5 text-[13px]";
  return (
    <section className="mt-5 rounded-2xl border border-line bg-paper-raised p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Fiyat kuralları</h3>
          <p className="text-[12.5px] text-slate">Panel, invertör ve batarya maliyeti mağazadan gelir. Buradaki kalemler kW aralığına ve çatı tipine göre teklife eklenir. Tutarlar USD ve KDV hariçtir.</p>
        </div>
        <div className="flex items-center gap-2">
          {msg && <span className="text-[12.5px] text-slate">{msg}</span>}
          <button onClick={() => onChange({ ...settings, rules: [...settings.rules, { id: uid(), ad: "Yeni kalem", birim: "sabit", kwFrom: 0, kwTo: 100000, cati: "hepsi", maliyetUsd: 0, marjPct: settings.defaultMarginPct }] })} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[13px] font-semibold hover:border-ink"><Plus size={14} /> Kural ekle</button>
          <button onClick={save} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[13px] font-semibold text-paper hover:bg-brand-deep"><Save size={14} /> Kaydet</button>
        </div>
      </div>
      {missing > 0 && <p className="mt-3 rounded-lg bg-sun/15 p-2.5 text-[12.5px]">{missing} kuralın maliyeti girilmedi. Aynı kalem güce göre değişiyorsa kuralı çoğaltıp kW aralıklarını ayırın.</p>}

      <div className="mt-4 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
        {([["defaultMarginPct", "Varsayılan kâr %"], ["minMarginPct", "En düşük kâr %"], ["oversizePct", "PV fazlası %"]] as const).map(([k, label]) => (
          <label key={k} className="block">
            <span className="text-[11.5px] font-semibold text-slate">{label}</span>
            <input type="number" value={settings[k]} onChange={(e) => onChange({ ...settings, [k]: Number(e.target.value) })} className={`mt-0.5 ${input}`} />
          </label>
        ))}
      </div>

      <div className="mt-4">
        <p className="text-[11.5px] font-semibold text-slate">Elektrik zam tablosu: bugüne göre artış (%). 10. yıldan sonra sabit kabul edilir.</p>
        <div className="mt-1 grid max-w-3xl grid-cols-5 gap-2 sm:grid-cols-9">
          {settings.hikeTable.map((v, i) => (
            <label key={i} className="block">
              <span className="text-[11px] text-slate">{i + 2}. yıl</span>
              <input type="number" value={v} onChange={(e) => onChange({ ...settings, hikeTable: settings.hikeTable.map((x, j) => (j === i ? Number(e.target.value) : x)) })} className={input} />
            </label>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-line bg-paper p-3">
        <p className="text-[13px] font-semibold">Gerçek üretim verileri</p>
        <p className="text-[12px] text-slate">Kurduğunuz sistemlerin yıllık üretimi. Benzer güçte kayıt varsa teklifte ortalaması gösterilir.</p>
        <div className="mt-2 space-y-1.5">
          {(settings.realProduction ?? []).map((r) => {
            const list = settings.realProduction ?? [];
            const set = (x: Partial<typeof r>) => onChange({ ...settings, realProduction: list.map((q) => (q.id === r.id ? { ...q, ...x } : q)) });
            return (
              <div key={r.id} className="grid grid-cols-[1fr_90px_110px_70px_24px] items-center gap-2">
                <input value={r.ad} onChange={(e) => set({ ad: e.target.value })} placeholder="Sistem (ör. Ankara mesken)" className={input} />
                <input type="number" value={r.kwp || ""} onChange={(e) => set({ kwp: Number(e.target.value) })} placeholder="kWp" className={input} />
                <input type="number" value={r.yillikKwh || ""} onChange={(e) => set({ yillikKwh: Number(e.target.value) })} placeholder="kWh/yıl" className={input} />
                <span className="text-right font-mono-data text-[12px] text-slate">{r.kwp > 0 ? Math.round(r.yillikKwh / r.kwp) : 0}</span>
                <button onClick={() => onChange({ ...settings, realProduction: list.filter((q) => q.id !== r.id) })} className="text-slate hover:text-red-600" aria-label="Kaydı sil"><Trash2 size={14} /></button>
              </div>
            );
          })}
        </div>
        <button onClick={() => onChange({ ...settings, realProduction: [...(settings.realProduction ?? []), { id: uid(), ad: "", kwp: 0, yillikKwh: 0 }] })} className="mt-2 text-[12.5px] font-semibold text-brand hover:underline">+ Kayıt ekle</button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[900px] space-y-2">
          <div className="grid grid-cols-[1fr_110px_70px_70px_170px_90px_70px_80px_28px] gap-2 text-[11.5px] font-semibold text-slate">
            <span>Kalem</span><span>Hesap</span><span>kW’dan</span><span>kW’a</span><span>Çatı</span><span>Maliyet $</span><span>Kâr %</span><span className="text-right">Satış $</span><span />
          </div>
          {settings.rules.map((r) => (
            <div key={r.id} className="grid grid-cols-[1fr_110px_70px_70px_170px_90px_70px_80px_28px] items-center gap-2">
              <input value={r.ad} onChange={(e) => patch(r.id, { ad: e.target.value })} className={input} />
              <select value={r.birim} onChange={(e) => patch(r.id, { birim: e.target.value as QuoteRule["birim"] })} className={input}>
                {(Object.keys(BIRIM) as QuoteRule["birim"][]).map((k) => <option key={k} value={k}>{BIRIM[k]}</option>)}
              </select>
              <input type="number" value={r.kwFrom} onChange={(e) => patch(r.id, { kwFrom: Number(e.target.value) })} className={input} />
              <input type="number" value={r.kwTo} onChange={(e) => patch(r.id, { kwTo: Number(e.target.value) })} className={input} />
              <select value={r.cati} onChange={(e) => patch(r.id, { cati: e.target.value as QuoteRule["cati"] })} className={input}>
                <option value="hepsi">Tüm çatılar</option>
                {(Object.keys(CATI_ADI) as RoofKind[]).map((k) => <option key={k} value={k}>{CATI_ADI[k]}</option>)}
              </select>
              <input type="number" value={r.maliyetUsd} onChange={(e) => patch(r.id, { maliyetUsd: Number(e.target.value) })} className={input} />
              <input type="number" value={r.marjPct} onChange={(e) => patch(r.id, { marjPct: Number(e.target.value) })} className={input} />
              <span className="text-right font-mono-data text-[13px]">{Math.round(salePrice(r.maliyetUsd, r.marjPct)).toLocaleString("tr-TR")}</span>
              <button onClick={() => onChange({ ...settings, rules: settings.rules.filter((x) => x.id !== r.id) })} className="text-slate hover:text-red-600" aria-label="Kuralı sil"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
