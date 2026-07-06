"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { whatsappLink } from "@/lib/data";

// Ankara ortalama tepe güneşlenme saati ~4,5 saat/gün kabul edilmiştir.
// Birim elektrik fiyatı ve verim katsayısı güncel tarifeye göre ayarlanmalıdır.
const PEAK_SUN_HOURS = 4.5;
const SYSTEM_EFFICIENCY = 0.8;
const UNIT_PRICE_TL = 3.2; // [PLACEHOLDER] güncel birim fiyat ile değiştirin

const roofTypes = [
  { id: "villa", label: "Villa / Müstakil Ev" },
  { id: "hobi", label: "Hobi Bahçesi" },
  { id: "tarim", label: "Tarımsal Arazi" },
  { id: "muteahhit", label: "Müteahhit / Toplu Proje" },
] as const;

export default function SavingsCalculator({ whatsappNumber }: { whatsappNumber: string }) {
  const [roofType, setRoofType] = useState<(typeof roofTypes)[number]["id"]>("villa");
  const [monthlyBill, setMonthlyBill] = useState(2500);

  const result = useMemo(() => {
    const monthlyConsumptionKWh = monthlyBill / UNIT_PRICE_TL;
    const systemSizeKWp =
      monthlyConsumptionKWh / (PEAK_SUN_HOURS * 30 * SYSTEM_EFFICIENCY);
    const annualProductionKWh =
      systemSizeKWp * PEAK_SUN_HOURS * 365 * SYSTEM_EFFICIENCY;
    const annualSavingsTL = Math.min(
      annualProductionKWh,
      monthlyConsumptionKWh * 12
    ) * UNIT_PRICE_TL;

    return {
      systemSizeKWp: Math.max(systemSizeKWp, 1),
      annualSavingsTL: Math.max(annualSavingsTL, 0),
    };
  }, [monthlyBill]);

  const roofLabel = roofTypes.find((r) => r.id === roofType)?.label ?? "";

  const waMessage = `Merhaba, ${roofLabel} için yaklaşık ${result.systemSizeKWp.toFixed(
    1
  )} kWp'lik bir sistem hakkında bilgi almak istiyorum. Aylık faturam yaklaşık ${monthlyBill} TL.`;

  return (
    <div className="w-full rounded-2xl border border-line-dark bg-ink-soft/60 p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)] backdrop-blur sm:p-7">
      <p className="font-mono-data text-[11px] uppercase tracking-[0.16em] text-sun-soft">
        Anlık Hesaplama
      </p>
      <h3 className="mt-1.5 font-display text-xl font-semibold text-paper">
        Tahmini Sistem Boyutunuzu Görün
      </h3>

      <div className="mt-5">
        <label className="text-[12.5px] font-medium text-slate-soft">
          Kullanım Alanı
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {roofTypes.map((r) => (
            <button
              key={r.id}
              onClick={() => setRoofType(r.id)}
              className={`rounded-lg border px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                roofType === r.id
                  ? "border-sun bg-sun/15 text-paper"
                  : "border-line-dark text-slate-soft hover:border-sun/50"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="bill" className="text-[12.5px] font-medium text-slate-soft">
            Aylık Elektrik Faturanız
          </label>
          <span className="font-mono-data text-[15px] font-semibold text-sun-soft">
            {monthlyBill.toLocaleString("tr-TR")} TL
          </span>
        </div>
        <input
          id="bill"
          type="range"
          min={500}
          max={15000}
          step={100}
          value={monthlyBill}
          onChange={(e) => setMonthlyBill(Number(e.target.value))}
          className="mt-3 w-full accent-[var(--sun)]"
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-line-dark pt-5">
        <div>
          <p className="font-mono-data text-2xl font-semibold text-paper">
            {result.systemSizeKWp.toFixed(1)}{" "}
            <span className="text-sm font-normal text-slate-soft">kWp</span>
          </p>
          <p className="text-[12px] text-slate-soft">Tahmini sistem gücü</p>
        </div>
        <div>
          <p className="font-mono-data text-2xl font-semibold text-sun-soft">
            ~{Math.round(result.annualSavingsTL).toLocaleString("tr-TR")}{" "}
            <span className="text-sm font-normal text-slate-soft">TL/yıl</span>
          </p>
          <p className="text-[12px] text-slate-soft">Tahmini yıllık tasarruf</p>
        </div>
      </div>

      <a
        href={whatsappLink(whatsappNumber, waMessage)}
        target="_blank"
        rel="noopener noreferrer"
        className="group mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-sun px-5 py-3 text-[14px] font-semibold text-ink transition-colors hover:bg-sun-soft"
      >
        WhatsApp&apos;tan Net Teklif Al
        <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </a>
      <p className="mt-2.5 text-center text-[11px] leading-relaxed text-slate-soft">
        Bu rakamlar yaklaşık değerlerdir; kesin sistem boyutu ve fiyat için ücretsiz keşif talep edin.
      </p>
    </div>
  );
}
