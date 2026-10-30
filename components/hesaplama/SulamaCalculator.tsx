"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Droplets, Gauge, Sun, Wallet } from "lucide-react";
import { DIZEL_FIYAT, ENERJILER, URUNLER, YONTEMLER, calculateSulama, sulamaScore, type Enerji, type SulamaInput, type SulamaPackage, type Urun, type Yontem } from "@/lib/sulama-calc";
import { PUMP_OPTIONS } from "@/lib/pumpOptions";
import { FALLBACK_YIELD } from "@/lib/ongrid-calc";
import { TARIFE_TARIHI } from "@/lib/elektrik-tarife";
import { BLUE, CallUs, Choice, ContactStep, GOLD, Kpi, MonthlyPair, Nav, NumField, Panel, PlacePicker, ProductBox, Row, Stepper, num, tl, toNum, usePlace, useWizard, type CompanyContact, type Place } from "./ui";

const PAGE = "/hesaplama/tarimsal-sulama";

export default function SulamaCalculator({ packages, contact }: { packages: SulamaPackage[]; contact: CompanyContact }) {
  const { step, go, ref } = useWizard(PAGE, "sulama");
  const [donum, setDonum] = useState("");
  const [urun, setUrun] = useState<Urun>("misir");
  const [yontem, setYontem] = useState<Yontem>("damla");
  const [derinlik, setDerinlik] = useState("");
  const [pompa, setPompa] = useState(""); // kW, boş: bilmiyorum
  const [enerji, setEnerji] = useState<Enerji>("dizel");
  const [dizel, setDizel] = useState(String(DIZEL_FIYAT));
  const loc = usePlace();
  const [yieldPerKwp, setYieldPerKwp] = useState<{ monthly: number[]; source: "pvgis" | "ortalama" } | null>(null);

  // Güneş üretimi: sulama sistemlerinde paneller yere, güneye 30° eğimle kurulur.
  const ready = step >= 4;
  const { lat, lon } = loc.place;
  useEffect(() => {
    if (!ready) return;
    let cancel = false;
    fetch(`/api/hesaplama/pvgis?lat=${lat}&lon=${lon}&angle=30&aspect=0`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => !cancel && setYieldPerKwp({ monthly: d.monthly, source: "pvgis" }))
      .catch(() => !cancel && setYieldPerKwp({ monthly: FALLBACK_YIELD, source: "ortalama" }));
    return () => {
      cancel = true;
    };
  }, [ready, lat, lon]);

  const input: SulamaInput = {
    donum: toNum(donum),
    urun,
    yontem,
    derinlikM: toNum(derinlik),
    mevcutPompaKw: toNum(pompa) || undefined,
    enerji,
    dizelFiyat: toNum(dizel) || DIZEL_FIYAT,
  };
  const result = input.donum > 0 && input.derinlikM > 0 && yieldPerKwp ? calculateSulama(input, yieldPerKwp.monthly, packages) : null;

  return (
    <div ref={ref} className="mx-auto max-w-4xl">
      <Stepper step={step} labels={["Arazi", "Kuyu ve pompa", "Konum", "İletişim", "Rapor"]} />

      {step === 1 && (
        <Panel title="Araziniz ve ürününüz" hint="Su ihtiyacı ürüne, arazi büyüklüğüne ve sulama yöntemine göre hesaplanır.">
          <NumField label="Sulanan alan" value={donum} onChange={setDonum} unit="dönüm" placeholder="ör. 20" note="1 dönüm = 1.000 m², 1 hektar = 10 dönüm" />
          <p className="mt-6 text-[13px] font-semibold text-ink">Ürün</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(URUNLER) as Urun[]).map((k) => (
              <button key={k} onClick={() => setUrun(k)} className={`rounded-full border px-4 py-2 text-[13.5px] font-semibold ${urun === k ? "border-ink bg-ink text-paper" : "border-line text-slate hover:border-ink"}`}>
                {URUNLER[k].ad}
              </button>
            ))}
          </div>
          <p className="mt-6 text-[13px] font-semibold text-ink">Sulama yöntemi</p>
          <div className="mt-2">
            <Choice value={yontem} onChange={setYontem} options={(Object.keys(YONTEMLER) as Yontem[]).map((k) => ({ key: k, ad: YONTEMLER[k].ad, not: YONTEMLER[k].not }))} />
          </div>
          <Nav onNext={() => go(2)} disabled={!(input.donum > 0)} />
        </Panel>
      )}

      {step === 2 && (
        <Panel title="Kuyu ve pompa" hint="Pompanın suyu ne kadar derinden çektiği, gereken gücü belirleyen en önemli bilgidir.">
          <NumField label="Pompa derinliği (dinamik su seviyesi)" value={derinlik} onChange={setDerinlik} unit="m" placeholder="ör. 60" note="Pompa çalışırken suyun düştüğü seviye. Bilmiyorsanız pompanın asılı olduğu derinliği yazın." />

          <label className="mt-6 block max-w-sm">
            <span className="text-[13px] font-semibold text-ink">Mevcut pompanızın gücü (isteğe bağlı)</span>
            <select value={pompa} onChange={(e) => setPompa(e.target.value)} className="mt-1.5 w-full rounded-xl border border-line bg-paper-raised px-4 py-3 text-[15px] outline-none focus:border-brand">
              <option value="">Bilmiyorum / henüz yok</option>
              {PUMP_OPTIONS.map((p) => (
                <option key={p.hp} value={p.kw}>
                  {p.hp} ({num(p.kw, 2)} kW)
                </option>
              ))}
            </select>
            <span className="mt-1 block text-[12px] text-slate">Seçerseniz sistem mevcut pompanıza göre önerilir; seçmezseniz ihtiyacınıza göre hesaplarız.</span>
          </label>

          <p className="mt-6 text-[13px] font-semibold text-ink">Pompayı bugün neyle çalıştırıyorsunuz?</p>
          <div className="mt-2">
            <Choice value={enerji} onChange={setEnerji} options={(Object.keys(ENERJILER) as Enerji[]).map((k) => ({ key: k, ad: ENERJILER[k], not: k === "yok" ? "Şebeke maliyetiyle karşılaştırılır" : undefined }))} />
          </div>
          {enerji === "dizel" && (
            <div className="mt-5">
              <NumField label="Motorin fiyatı" value={dizel} onChange={setDizel} unit="TL / L" note="Ekim 2026 pompa fiyatı; bölgenize göre değiştirebilirsiniz." />
            </div>
          )}
          <Nav onBack={() => go(1)} onNext={() => go(3)} disabled={!(input.derinlikM > 0)} />
        </Panel>
      )}

      {step === 3 && (
        <Panel title="Arazinin konumu" hint="Güneş üretimi arazinizin bulunduğu yerin uydu tabanlı güneş verisiyle hesaplanır.">
          <PlacePicker {...loc} mapLabel="Daha hassas sonuç için arazinizi haritada işaretleyin (isteğe bağlı)" />
          <Nav onBack={() => go(2)} onNext={() => go(4)} nextLabel="Raporu hazırla" disabled={!loc.il} />
        </Panel>
      )}

      {step === 4 && !result && <Panel title="Raporunuz hazırlanıyor…" hint={`${loc.place.ad} için güneş verisi alınıyor.`}>{null}</Panel>}

      {step === 4 && result && (
        <ContactStep
          page={PAGE}
          place={loc.place}
          bullets={[
            "Arazinize uygun pompa gücü ve güneş paneli sistemi",
            "En yoğun dönemde gereken debi ve basma yüksekliği",
            `${loc.place.ad} güneş verisiyle aylık su karşılama oranı`,
            enerji === "dizel" ? "Yıllık mazot tasarrufu ve geri ödeme süresi" : "Yıllık elektrik tasarrufu ve geri ödeme süresi",
            "Önerilen paket ve güncel fiyatı",
          ]}
          payload={{
            needType: "Tarımsal sulama hesaplama",
            source: "sulama_calculator",
            calcType: "sulama",
            summary: `Sulama · ${num(input.donum)} dönüm ${URUNLER[urun].ad.toLocaleLowerCase("tr-TR")}, ${YONTEMLER[yontem].ad.toLocaleLowerCase("tr-TR")}, ${num(input.derinlikM)} m derinlik, ${loc.place.ad}; ${result.pumpHp} pompa, ${num(result.pvKwp, 1)} kWp güneş; bugün ${ENERJILER[enerji].toLocaleLowerCase("tr-TR")}, yıllık tasarruf ~${Math.round(result.annualSavingTl)} TL.`,
            inputs: input,
            results: { ...result, systemKw: result.pumpKw, panelCount: null },
            recommendedProduct: result.package?.name,
            estimatedValue: result.package?.price,
            score: sulamaScore(result, input),
          }}
          onDone={() => go(5)}
          onBack={() => go(3)}
        />
      )}

      {step === 5 && result && yieldPerKwp && <Result r={result} input={input} place={loc.place} source={yieldPerKwp.source} contact={contact} onBack={() => go(3)} />}
    </div>
  );
}

function Result({
  r,
  input,
  place,
  source,
  contact,
  onBack,
}: {
  r: ReturnType<typeof calculateSulama>;
  input: SulamaInput;
  place: Place;
  source: "pvgis" | "ortalama";
  contact: CompanyContact;
  onBack: () => void;
}) {
  const fromExisting = Boolean(input.mevcutPompaKw);
  const undersized = fromExisting && r.requiredKw > r.pumpKw * 1.1;
  return (
    <div>
      <div className="overflow-hidden rounded-3xl bg-ink text-paper">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-sun">Ön fizibilite raporu · {place.ad}</p>
            <p className="mt-3 text-[13px] text-paper/70">{fromExisting ? "Mevcut pompanıza göre sistem" : "Önerilen pompa gücü"}</p>
            <p className="mt-1 font-display text-[44px] font-semibold leading-none">
              {r.pumpHp.replace(" HP", "")} <span className="text-[24px] text-paper/70">HP · {num(r.pumpKw, 2)} kW</span>
            </p>
            <p className="mt-2 text-[14.5px] text-paper/80">
              {num(r.pvKwp, 1)} kWp güneş paneli · en yoğun dönemde saatte {num(r.peakFlowM3h, 1)} m³ su, {r.headM} m basma yüksekliği
            </p>
            {undersized && (
              <p className="mt-3 rounded-lg bg-paper/10 px-3 py-2 text-[13px] text-sun-soft">
                Hesaplanan ihtiyaç {num(r.requiredKw, 1)} kW; mevcut pompanız en sıcak aylarda yetersiz kalabilir. Keşifte birlikte değerlendirelim.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Kpi icon={<Wallet size={16} />} label={input.enerji === "dizel" ? "Yıllık mazot tasarrufu" : "Yıllık tasarruf"} value={tl(r.annualSavingTl)} />
            <Kpi icon={<Droplets size={16} />} label="Suyu güneşle karşılama" value={`%${r.coveragePct}`} />
            <Kpi icon={<Sun size={16} />} label="Geri ödeme" value={r.paybackYears != null ? `${num(r.paybackYears, 1)} yıl` : "Teklifle netleşir"} />
            <Kpi icon={<Gauge size={16} />} label="Sezonluk su" value={`${num(r.annualNeedM3)} m³`} />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-line bg-paper-raised p-5">
          <h3 className="font-semibold text-ink">Aylık su ihtiyacı ve güneşle basılabilecek su</h3>
          <p className="text-[12.5px] text-slate">
            {source === "pvgis" ? `${place.ad} için Avrupa Komisyonu PVGIS güneş verisiyle` : "Bölge ortalamasıyla"} hesaplanmıştır. Değerler m³ cinsindendir.
          </p>
          <MonthlyPair a={r.monthlyNeedM3} b={r.monthlySolarM3} aLabel="Su ihtiyacı" bLabel="Güneşle basılabilen" unit="m³" aColor={GOLD} bColor={BLUE} totals={false} />
        </section>

        <section className="flex flex-col rounded-2xl border border-line bg-paper-raised p-5">
          <ProductBox title="Önerilen paket" pkg={r.package} includes="KDV dahil · panel, pompa sürücüsü, konstrüksiyon ve kablolama" empty="Bu güçte hazır paketimiz yok; size özel sistem teklifi hazırlıyoruz." />
          <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-[13px]">
            <Row k="Toplam basma yüksekliği" v={`${r.headM} m`} />
            <Row k="Tepe debi" v={`${num(r.peakFlowM3h, 1)} m³/saat`} />
            <Row k="Yıllık pompa enerjisi" v={`${num(r.annualKwh)} kWh`} />
            <Row k={input.enerji === "dizel" ? "Mazotla kWh maliyeti" : "Şebekeden kWh maliyeti"} v={`${num(r.costPerKwh, 2)} TL`} />
          </dl>
        </section>
      </div>

      <CallUs contact={contact} team="Ziraat ve elektrik mühendislerimiz" waText="Merhaba, sitenizde güneş enerjili sulama fizibilite raporumu oluşturdum. Ücretsiz keşif için görüşmek istiyorum." />

      <p className="mt-4 text-[12px] leading-relaxed text-slate">
        Bu rapor; ürünün ortalama sezonluk sulama suyu ihtiyacı (yağış düşülmüş), sulama yönteminin randımanı, pompa derinliği ve arazinizin güneş verisiyle hazırlanmış bir ön fizibilitedir.
        {input.enerji === "dizel" ? " Mazot tüketimi jeneratörde kWh başına 0,33 L kabul edilmiştir." : ` Şebeke maliyeti EPDK ${TARIFE_TARIHI} tarımsal sulama tarifesiyle hesaplanmıştır.`} Kesin pompa seçimi kuyu testi ve yerinde keşiften sonra netleşir.
      </p>
      <button onClick={onBack} className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-slate hover:text-ink">
        <ArrowLeft size={15} /> Bilgileri değiştir
      </button>
    </div>
  );
}
