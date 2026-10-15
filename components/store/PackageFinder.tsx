"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import ProductCard from "./ProductCard";
import { STORE_PRODUCTS, type StoreProduct } from "@/lib/store";

// "Size uygun paketi bulalım": 3 soruya göre mağazadaki paketlerden birini önerir.
// Hesap: aylık fatura ÷ kWh birim fiyatı → yıllık tüketim; Ankara'da 1 kW
// yılda ~1.450 kWh üretir. Kesin boyutlandırma keşifte yapılır.
const KWH_PRICE = 4; // TL, vergiler dahil yaklaşık mesken birim fiyatı
const KWH_PER_KW = 1450;

// Değer, aralığın ortası (hesapta kullanılan tahmini aylık fatura).
const BILLS = [
  { label: "1.500 TL'ye kadar", value: 1000 },
  { label: "1.500 – 3.000 TL", value: 2250 },
  { label: "3.000 – 5.000 TL", value: 4000 },
  { label: "5.000 TL üzeri", value: 7000 },
];

const kwOf = (p: StoreProduct) => parseFloat(p.power.replace(",", "."));

function recommend(bill: number, grid: boolean, backup: boolean): StoreProduct | undefined {
  const needKw = (bill / KWH_PRICE) * 12 / KWH_PER_KW;
  const category = !grid ? "off-grid-paketler" : backup ? "hibrit-paketler" : "on-grid-paketler";
  const list = STORE_PRODUCTS.filter((p) => p.category === category).sort((a, b) => kwOf(a) - kwOf(b));
  return list.find((p) => kwOf(p) >= needKw) ?? list[list.length - 1];
}

export default function PackageFinder({ whatsappNumber }: { whatsappNumber: string }) {
  const [bill, setBill] = useState<number | null>(null);
  const [grid, setGrid] = useState<boolean | null>(null);
  const [backup, setBackup] = useState<boolean | null>(null);

  const done = bill != null && grid != null && (grid === false || backup != null);
  const result = useMemo(() => (done ? recommend(bill!, grid!, !!backup) : undefined), [done, bill, grid, backup]);

  const opt = (active: boolean) =>
    `rounded-full border px-4 py-2 text-[13.5px] font-semibold transition-colors ${
      active ? "border-ink bg-ink text-paper" : "border-line bg-paper-raised text-ink hover:border-ink"
    }`;

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-paper-raised">
      <div className="grid lg:grid-cols-[1.2fr_1fr]">
        <div className="p-6 sm:p-8">
          <p className="flex items-center gap-2 font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
            <Sparkles size={14} /> Paket sihirbazı
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-tight sm:text-2xl">Size uygun paketi bulalım</h2>
          <p className="mt-1 text-[14px] text-slate">Üç soruyu yanıtlayın, ihtiyacınıza en yakın paketi önerelim.</p>

          <div className="mt-6 flex flex-col gap-5">
            <div>
              <p className="text-[14px] font-semibold text-ink">1. Aylık elektrik faturanız ne kadar?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {BILLS.map((b) => (
                  <button key={b.value} type="button" onClick={() => setBill(b.value)} className={opt(bill === b.value)}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-ink">2. Kurulum yerinde şebeke elektriği var mı?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={() => setGrid(true)} className={opt(grid === true)}>
                  Evet, var
                </button>
                <button type="button" onClick={() => setGrid(false)} className={opt(grid === false)}>
                  Hayır, yok
                </button>
              </div>
            </div>
            {grid !== false && (
              <div>
                <p className="text-[14px] font-semibold text-ink">3. Elektrik kesintisinde de eviniz çalışsın mı?</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setBackup(true)} className={opt(backup === true)}>
                    Evet, önemli
                  </button>
                  <button type="button" onClick={() => setBackup(false)} className={opt(backup === false)}>
                    Gerek yok
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center bg-paper p-6 sm:p-8">
          {result ? (
            <div className="w-full max-w-[320px]">
              <p className="mb-3 text-center text-[13px] font-semibold uppercase tracking-[0.12em] text-brand">Size önerimiz</p>
              <ProductCard product={result} whatsappNumber={whatsappNumber} />
              <p className="mt-3 text-center text-[12px] text-slate-soft">
                Tahmini öneridir; kesin sistem gücü keşifte netleşir.
              </p>
            </div>
          ) : (
            <p className="max-w-[260px] text-center text-[14px] text-slate">
              Soruları yanıtladıkça size en uygun paket burada görünecek.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
