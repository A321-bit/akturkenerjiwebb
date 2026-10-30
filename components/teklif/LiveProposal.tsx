"use client";

import { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { FileDown, MessageCircle, Phone } from "lucide-react";
import EnergyFlow from "@/components/admin/teklif/EnergyFlow";
import { faceFrame, type LayoutSettings } from "@/lib/teklif/geometry";
import type { Proposal, ProposalNumbers } from "@/lib/teklif/proposal";

// Müşterinin gördüğü canlı teklif: kendi çatısı 3B, üretim, enerji akışı, fiyat ve iletişim.

const Roof3D = dynamic(() => import("@/components/admin/teklif/Roof3D"), { ssr: false, loading: () => <div className="h-[560px] animate-pulse rounded-2xl bg-ink/5" /> });

const AY = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const num = (v: number, d = 0) => v.toLocaleString("tr-TR", { maximumFractionDigits: d, minimumFractionDigits: d });
const tl = (v: number) => `${num(Math.round(v))} TL`;

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper-raised p-4">
      <p className="text-[12.5px] text-slate">{label}</p>
      <p className="mt-1 font-mono-data text-[20px] font-semibold text-ink">{value}</p>
    </div>
  );
}

function MonthlyBars({ prod, cons }: { prod: number[]; cons: number[] }) {
  const max = Math.max(1, ...prod, ...cons);
  const hasCons = cons.some((c) => c > 0);
  return (
    <div>
      <div className="flex h-44 items-end gap-1 sm:gap-2">
        {prod.map((v, i) => (
          <div key={AY[i]} className="flex h-full flex-1 flex-col justify-end">
            <div className="flex h-full items-end justify-center gap-0.5">
              <div className="w-1/2 rounded-t bg-sun" style={{ height: `${(v / max) * 100}%` }} title={`${AY[i]} üretim: ${num(v)} kWh`} />
              {hasCons && <div className="w-1/2 rounded-t bg-brand" style={{ height: `${(cons[i] / max) * 100}%` }} title={`${AY[i]} tüketim: ${num(cons[i])} kWh`} />}
            </div>
            <p className="mt-1 text-center text-[10.5px] text-slate">{AY[i]}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-4 text-[12px] text-slate">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-sun" /> Güneş üretimi</span>
        {hasCons && <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand" /> Tüketiminiz</span>}
      </div>
    </div>
  );
}

export default function LiveProposal({ p, n, token, expired, phoneHref, phoneDisplay, whatsappNumber }: { p: Proposal; n: ProposalNumbers; token: string; expired: boolean; phoneHref: string; phoneDisplay: string; whatsappNumber: string }) {
  const layout: LayoutSettings = useMemo(() => ({ setbackM: p.setbackM, gapM: p.gapM, lat: p.site.center[0] }), [p]);
  const frames = useMemo(() => p.faces.map((f) => faceFrame(f, p.site.center, p.panel, layout)), [p, layout]);
  const isUsd = p.priceCurrency === "USD";
  const money = (v: number) => (!isUsd ? tl(v) : p.showTl && p.usdTry ? tl(v * p.usdTry) : `${num(Math.round(v))} USD`);
  const hasCons = n.annualKwh > 0;
  // Şebekesiz sistemde tasarruf, girilen mevcut enerji gideridir; girilmediyse gösterilmez.
  const hasSaving = (p.systemType ?? "ongrid") !== "ongrid" ? (p.currentEnergyCostTl ?? 0) > 0 : hasCons;
  const until = new Date(new Date(p.createdAt).getTime() + p.validDays * 864e5);
  const wa = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Merhaba, ${p.proposalNo} numaralı teklifimi incelediğimi bildirmek ve görüşmek istiyorum.`)}`;

  // Sayfada birkaç saniye kalındıysa açılma bildirilir (bağlantı önizlemeleri sayılmaz).
  useEffect(() => {
    const t = setTimeout(() => {
      fetch(`/api/teklif/${token}/acildi`, { method: "POST", keepalive: true }).catch(() => {});
    }, 3000);
    return () => clearTimeout(t);
  }, [token]);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6">
      <header className="rounded-3xl bg-ink p-6 text-paper sm:p-8">
        <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-sun">Size özel güneş enerjisi teklifi</p>
        <h1 className="mt-2 font-display text-[28px] font-semibold leading-tight sm:text-[36px]">Sayın {p.customer.name || "Müşterimiz"}</h1>
        <p className="mt-2 text-[14.5px] text-paper/80">
          Çatınız için {num(n.dcKwp, 2)} kWp güneş enerjisi sistemi tasarladık. Aşağıda kendi çatınızı üç boyutlu görebilir, gün içindeki güneş hareketini izleyebilirsiniz.
        </p>
        <p className="mt-3 text-[12.5px] text-paper/60">Teklif no {p.proposalNo} · {expired ? "Geçerlilik süresi doldu, güncel fiyat için bize ulaşın" : `${until.toLocaleDateString("tr-TR")} tarihine kadar geçerli`}</p>
      </header>

      <section className="mt-6">
        <Roof3D center={p.site.center} frames={frames} cells={p.cells} layout={layout} lat={p.site.center[0]} obstacles={p.obstacles} />
        <p className="mt-2 text-[12.5px] text-slate">Parmağınızla döndürün, iki parmakla yakınlaştırın. Saati değiştirerek gölgeleri görebilirsiniz.</p>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Sistem gücü" value={`${num(n.dcKwp, 2)} kWp`} />
        <Kpi label="Panel" value={`${n.panelCount} adet`} />
        <Kpi label="Yıllık üretim" value={`${num(n.annualProduction)} kWh`} />
        <Kpi label="Teklif tutarı (KDV dahil)" value={money(n.total)} />
        {hasSaving && <Kpi label="İlk yıl tasarruf" value={tl(n.annualSavingTl)} />}
        {hasCons && <Kpi label="Tüketimi karşılama" value={`%${num(n.coveragePct)}`} />}
        {hasSaving && n.paybackYears != null && <Kpi label="Tahmini geri ödeme" value={`${num(n.paybackYears, 1)} yıl`} />}
        {hasSaving && <Kpi label="25 yılda tasarruf" value={tl(n.savings25Tl)} />}
      </section>

      {p.optionMode === "uc" && (p.options?.length ?? 0) > 0 && (
        <section className="mt-6">
          <h2 className="font-semibold text-ink">Seçenekleriniz</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {p.options!.map((o) => (
              <div key={o.key} className={`rounded-2xl border p-4 ${o.key === "onerilen" ? "border-brand bg-brand/5" : "border-line bg-paper-raised"}`}>
                <p className="font-display text-[17px] font-semibold text-ink">{o.ad}</p>
                <p className="mt-1 font-mono-data text-[19px] font-semibold">{money(o.total)}</p>
                <dl className="mt-3 space-y-1 text-[13px] text-slate">
                  <div>{num(o.kwp, 2)} kWp · yılda {num(o.annualKwh)} kWh</div>
                  <div>{o.panel}</div>
                  <div>{o.inverter}</div>
                  {o.battery && <div>{num(o.batteryKwh ?? 0, 1)} kWh batarya</div>}
                  {o.paybackYears != null && <div>Geri ödeme {num(o.paybackYears, 1)} yıl</div>}
                </dl>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-line bg-paper-raised p-5">
        <h2 className="font-semibold text-ink">Aylık üretim{hasCons ? " ve tüketim" : ""}</h2>
        <p className="mb-3 text-[12.5px] text-slate">Çatınızın yönü ve eğimine göre, Avrupa Komisyonu PVGIS güneş verisiyle hesaplanmıştır.</p>
        <MonthlyBars prod={n.monthlyProduction} cons={n.monthlyKwh} />
      </section>

      <div className="mt-6">
        <EnergyFlow p={p} n={n} />
      </div>

      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-paper-raised p-5">
          <h2 className="font-semibold text-ink">Sistem içeriği</h2>
          <ul className="mt-3 divide-y divide-line text-[14px]">
            {p.lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-3 py-2">
                <span>{l.ad}</span>
                <span className="whitespace-nowrap text-slate">{num(l.adet, 2)} {l.birim}{p.showLinePrices ? ` · ${money(l.adet * l.birimFiyat)}` : ""}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-line bg-paper-raised p-5">
          <h2 className="font-semibold text-ink">Ödeme planı</h2>
          <ul className="mt-3 divide-y divide-line text-[14px]">
            {(p.paymentPlan ?? []).map((st) => (
              <li key={st.id} className="flex justify-between gap-3 py-2">
                <span>{st.ad} <span className="text-slate">· {st.sure}</span></span>
                <span className="whitespace-nowrap font-mono-data">%{st.pct} · {money((n.total * st.pct) / 100)}</span>
              </li>
            ))}
          </ul>
          {isUsd && <p className="mt-3 text-[12px] text-slate">Ödeme günündeki Merkez Bankası kuru geçerlidir.</p>}
        </div>
      </section>

      <p className="mt-5 text-[12px] leading-relaxed text-slate">
        Üretim ve tasarruf değerleri tahmindir; hava koşulları, gölgelenme ve tarife değişiklikleri sonucu etkileyebilir.
        {p.hikeTable?.length ? ` Geri ödeme hesabında elektrik fiyatının 10. yılda bugüne göre %${p.hikeTable[p.hikeTable.length - 1]} artacağı varsayılmıştır${n.paybackFlatYears != null ? `; zam olmazsa geri ödeme yaklaşık ${num(n.paybackFlatYears, 1)} yıldır` : ""}.` : ""}
      </p>

      <section className="mt-6 flex flex-col gap-3 rounded-2xl bg-ink p-5 text-paper sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold">Sorularınız için mühendislerimiz bir mesaj uzağınızda.</p>
        <div className="flex flex-wrap gap-2">
          <a href={wa} className="inline-flex items-center gap-1.5 rounded-lg bg-volt px-4 py-2.5 text-[14px] font-semibold text-paper"><MessageCircle size={16} /> WhatsApp</a>
          <a href={phoneHref} className="inline-flex items-center gap-1.5 rounded-lg bg-paper px-4 py-2.5 text-[14px] font-semibold text-ink"><Phone size={16} /> {phoneDisplay}</a>
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-paper/40 px-4 py-2.5 text-[14px] font-semibold"><FileDown size={16} /> PDF olarak kaydet</button>
        </div>
      </section>
    </main>
  );
}
