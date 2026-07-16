"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Gauge } from "lucide-react";
import { whatsappLink } from "@/lib/data";

// Solar sulama sistemlerinde panel gücü, pompanın VFD/invertör kayıplarını ve
// kalkış akımını karşılayabilmesi için pompa elektrik gücünün ~1,3 katı olarak
// boyutlandırılır. Panel başına 600W (Tommatech) kabul edilmiştir.
const SIZING_FACTOR = 1.3;
const PANEL_WATT = 600;

const pumpOptions = [
  { hp: "1 HP", kw: 0.75 },
  { hp: "2 HP", kw: 1.5 },
  { hp: "3 HP", kw: 2.2 },
  { hp: "5 HP", kw: 3.7 },
  { hp: "7.5 HP", kw: 5.5 },
  { hp: "10 HP", kw: 7.5 },
  { hp: "15 HP", kw: 11 },
  { hp: "20 HP", kw: 15 },
] as const;

export default function PumpPowerCalculator({ whatsappNumber }: { whatsappNumber: string }) {
  const [selected, setSelected] = useState<(typeof pumpOptions)[number]>(pumpOptions[2]);

  const result = useMemo(() => {
    const systemSizeKWp = selected.kw * SIZING_FACTOR;
    const panelCount = Math.ceil((systemSizeKWp * 1000) / PANEL_WATT);
    return { systemSizeKWp, panelCount };
  }, [selected]);

  const waMessage = `Merhaba, ${selected.hp} (${selected.kw} kW) sulama pompam için güneş enerjili sulama sistemi hakkında bilgi almak istiyorum. Yaklaşık ${result.systemSizeKWp.toFixed(
    1
  )} kWp'lik bir sistem öneriliyor.`;

  return (
    <div className="mt-6 rounded-2xl border border-line bg-paper-raised p-6 sm:p-7">
      <div className="flex items-center gap-2">
        <Gauge size={17} className="text-brand" />
        <p className="font-mono-data text-[11.5px] uppercase tracking-[0.14em] text-brand">
          Pompa Gücünüzü Seçin
        </p>
      </div>
      <h3 className="mt-2 font-display text-[18px] font-semibold text-ink">
        Sulama pompanıza göre önerilen sistem
      </h3>

      <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-8">
        {pumpOptions.map((p) => (
          <button
            key={p.hp}
            type="button"
            onClick={() => setSelected(p)}
            className={`rounded-lg border px-2 py-2.5 text-center text-[13px] font-semibold transition-colors ${
              selected.hp === p.hp
                ? "border-brand bg-brand/10 text-brand"
                : "border-line text-slate hover:border-brand/50"
            }`}
          >
            {p.hp}
          </button>
        ))}
      </div>
      <p className="mt-2.5 text-[12px] text-slate-soft">
        Seçili pompa: <span className="font-semibold text-ink">{selected.hp} ({selected.kw} kW)</span>
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-line pt-5">
        <div>
          <p className="font-mono-data text-2xl font-semibold text-ink">
            {result.systemSizeKWp.toFixed(1)} <span className="text-sm font-normal text-slate-soft">kWp</span>
          </p>
          <p className="text-[12px] text-slate-soft">Önerilen sistem gücü</p>
        </div>
        <div>
          <p className="font-mono-data text-2xl font-semibold text-brand">
            ~{result.panelCount} <span className="text-sm font-normal text-slate-soft">panel</span>
          </p>
          <p className="text-[12px] text-slate-soft">600W panel bazında tahmini adet</p>
        </div>
      </div>

      <a
        href={whatsappLink(whatsappNumber, waMessage)}
        target="_blank"
        rel="noopener noreferrer"
        className="group mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-[14px] font-semibold text-paper transition-colors hover:bg-brand/90 sm:w-fit"
      >
        Bu Pompa İçin Teklif Al
        <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </a>
      <p className="mt-2.5 text-[11.5px] leading-relaxed text-slate-soft">
        Tahmini değerlerdir; kesin sistem boyutu kuyu debisi ve keşif sonrası netleşir.
      </p>
    </div>
  );
}
