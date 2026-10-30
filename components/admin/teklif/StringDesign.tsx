"use client";

import { useState } from "react";
import { planStrings, panelVocCold, type InverterSpec, type PanelSpec } from "@/lib/teklif/strings";
import type { QuoteSettings } from "@/lib/teklif/pricing";

// String tasarımı: katalog değerleri ürün başına bir kez girilir, Fiyat kuralları ile birlikte saklanır.

const EMPTY_P: PanelSpec = { voc: 0, vmp: 0, isc: 0, tcVoc: 0 };
const EMPTY_I: InverterSpec = { vMax: 0, mpptMin: 0, mpptMax: 0, mpptCount: 0, stringsPerMppt: 0, iMax: 0 };

function Num({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-slate">{label}</span>
      <input type="number" step="any" value={value || ""} onChange={(e) => onChange(Number(e.target.value))} className="mt-0.5 w-full rounded-lg border border-line bg-paper px-2 py-1 text-[13px]" />
    </label>
  );
}

export default function StringDesign({ panelKey, panelName, inverterKey, inverterName, adet, faces, settings, onSettings }: { panelKey: string; panelName: string; inverterKey?: string; inverterName?: string; adet: number; faces: { name: string; panels: number }[]; settings: QuoteSettings; onSettings: (s: QuoteSettings) => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const specs = settings.specs ?? { panels: {}, inverters: {} };
  const ps = specs.panels[panelKey] ?? EMPTY_P;
  const is = inverterKey ? (specs.inverters[inverterKey] ?? EMPTY_I) : EMPTY_I;
  const temps = settings.temps ?? { minC: -15, maxCellC: 70 };
  const setP = (x: Partial<PanelSpec>) => onSettings({ ...settings, specs: { ...specs, panels: { ...specs.panels, [panelKey]: { ...ps, ...x } } } });
  const setI = (x: Partial<InverterSpec>) => inverterKey && onSettings({ ...settings, specs: { ...specs, inverters: { ...specs.inverters, [inverterKey]: { ...is, ...x } } } });
  const ready = ps.voc > 0 && ps.vmp > 0 && ps.isc > 0 && ps.tcVoc !== 0 && is.vMax > 0 && is.mpptMin > 0 && is.mpptMax > 0 && is.mpptCount > 0 && is.stringsPerMppt > 0 && is.iMax > 0;
  const plan = ready ? planStrings(ps, is, adet, temps, faces) : null;

  async function save() {
    const r = await fetch("/api/admin/quote-settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    setMsg(r.ok ? "Katalog değerleri kaydedildi." : "Kaydedilemedi.");
  }

  return (
    <section className="rounded-2xl border border-line bg-paper-raised p-5">
      <h3 className="font-semibold">String tasarımı</h3>
      <p className="text-[12.5px] text-slate">Değerleri ürünün veri sayfasından girin; aynı ürün için bir daha sorulmaz.</p>
      {!inverterKey && <p className="mt-2 rounded-lg bg-sun/15 p-2.5 text-[13px]">Önce invertör seçin.</p>}
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div>
          <p className="truncate text-[12.5px] font-semibold">{panelName}</p>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <Num label="Voc (V)" value={ps.voc} onChange={(v) => setP({ voc: v })} />
            <Num label="Vmp (V)" value={ps.vmp} onChange={(v) => setP({ vmp: v })} />
            <Num label="Isc (A)" value={ps.isc} onChange={(v) => setP({ isc: v })} />
            <Num label="Voc sıcaklık katsayısı (%/°C, eksi)" value={ps.tcVoc} onChange={(v) => setP({ tcVoc: v })} />
          </div>
        </div>
        <div>
          <p className="truncate text-[12.5px] font-semibold">{inverterName ?? "İnvertör"}</p>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <Num label="En yüksek DC gerilim (V)" value={is.vMax} onChange={(v) => setI({ vMax: v })} />
            <Num label="MPPT alt gerilim (V)" value={is.mpptMin} onChange={(v) => setI({ mpptMin: v })} />
            <Num label="MPPT üst gerilim (V)" value={is.mpptMax} onChange={(v) => setI({ mpptMax: v })} />
            <Num label="MPPT sayısı" value={is.mpptCount} onChange={(v) => setI({ mpptCount: v })} />
            <Num label="MPPT başına dizi" value={is.stringsPerMppt} onChange={(v) => setI({ stringsPerMppt: v })} />
            <Num label="MPPT başına en yüksek akım (A)" value={is.iMax} onChange={(v) => setI({ iMax: v })} />
          </div>
        </div>
      </div>
      <div className="mt-3 grid max-w-sm grid-cols-2 gap-2">
        <Num label="En düşük hava sıcaklığı (°C)" value={temps.minC} onChange={(v) => onSettings({ ...settings, temps: { ...temps, minC: v } })} />
        <Num label="En yüksek hücre sıcaklığı (°C)" value={temps.maxCellC} onChange={(v) => onSettings({ ...settings, temps: { ...temps, maxCellC: v } })} />
      </div>
      <button onClick={save} className="mt-3 rounded-lg border border-line px-3 py-1.5 text-[13px] font-semibold hover:border-ink">Değerleri kaydet</button>
      {msg && <span className="ml-2 text-[12.5px] text-slate">{msg}</span>}

      {plan && (
        <div className="mt-4 border-t border-line pt-3 text-[13.5px]">
          <p>Soğukta panel Voc <b>{panelVocCold(ps, temps).toFixed(1)} V</b> · Dizi başına <b>{plan.nMin}-{plan.nMax} panel</b> · Kullanılan giriş <b>{plan.usedStrings} / {plan.capacity}</b></p>
          <table className="mt-2 w-full text-[12.5px]">
            <thead className="text-slate"><tr className="border-b border-line text-left"><th className="py-1 font-medium">Yüzey</th><th className="text-right font-medium">Panel</th><th className="text-right font-medium">Dizi</th><th className="text-right font-medium">Dizi başına panel</th></tr></thead>
            <tbody>
              {plan.faces.map((f) => (
                <tr key={f.name} className="border-b border-line"><td className="py-1">{f.name}</td><td className="text-right">{f.panels}</td><td className="text-right">{f.strings}</td><td className={`text-right ${f.ok ? "" : "font-semibold text-red-600"}`}>{f.perString.join(" + ")}</td></tr>
              ))}
            </tbody>
          </table>
          {plan.problems.length > 0 ? (
            <ul className="mt-2 space-y-1 text-[13px] font-semibold text-red-600">{plan.problems.map((x) => <li key={x}>{x}</li>)}</ul>
          ) : (
            <p className="mt-2 text-[13px] font-semibold text-volt">Gerilim, akım ve giriş sayısı uygun.</p>
          )}
        </div>
      )}
    </section>
  );
}
