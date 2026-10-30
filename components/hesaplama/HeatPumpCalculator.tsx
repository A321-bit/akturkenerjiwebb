"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Flame, Gauge, Leaf, Sun, Wallet } from "lucide-react";
import {
  BINA_ADLARI,
  TESISAT_ADLARI,
  YAKITLAR,
  YALITIM_ADLARI,
  calculateHeatPump,
  fallbackClimate,
  heatPumpScore,
  solarCombo,
  type BinaTipi,
  type Climate,
  type HeatPumpInput,
  type HeatPumpOption,
  type Tesisat,
  type Yakit,
  type Yalitim,
} from "@/lib/isipompasi-calc";
import { TARIFE_TARIHI } from "@/lib/elektrik-tarife";
import type { PackageOption } from "@/lib/ongrid-calc";
import { BLUE, CallUs, Choice, ContactStep, GOLD, Kpi, MonthlyPair, Nav, NumField, Panel, PlacePicker, ProductBox, Row, Stepper, num, tl, toNum, usePlace, useWizard, type CompanyContact, type Place } from "./ui";

const PAGE = "/hesaplama/isi-pompasi";

const opts = <K extends string>(m: Record<K, string>, notes?: Partial<Record<K, string>>) => (Object.keys(m) as K[]).map((key) => ({ key, ad: m[key], not: notes?.[key] }));

export default function HeatPumpCalculator({ devices, solarPackages, contact }: { devices: HeatPumpOption[]; solarPackages: PackageOption[]; contact: CompanyContact }) {
  const { step, go, ref } = useWizard(PAGE, "heatpump");
  const [bina, setBina] = useState<BinaTipi>("mustakil");
  const [alan, setAlan] = useState("");
  const [yalitim, setYalitim] = useState<Yalitim>("standart");
  const [tesisat, setTesisat] = useState<Tesisat>("radyator");
  const [yakit, setYakit] = useState<Yakit>("dogalgaz");
  const [fiyat, setFiyat] = useState(String(YAKITLAR.dogalgaz.fiyat));
  const [harcama, setHarcama] = useState("");
  const [kisi, setKisi] = useState("3");
  const loc = usePlace();
  const [climate, setClimate] = useState<{ data: Climate; source: "pvgis" | "ortalama" } | null>(null);

  // İklim verisi konum seçilince (3. adımdan sonra) PVGIS tipik yılından alınır.
  const ready = step >= 4;
  const { lat, lon } = loc.place;
  useEffect(() => {
    if (!ready) return;
    let cancel = false;
    fetch(`/api/hesaplama/iklim?lat=${lat}&lon=${lon}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Climate) => !cancel && setClimate({ data: d, source: "pvgis" }))
      .catch(() => !cancel && setClimate({ data: fallbackClimate(), source: "ortalama" }));
    return () => {
      cancel = true;
    };
  }, [ready, lat, lon]);

  const pickYakit = (k: Yakit) => {
    setYakit(k);
    setFiyat(YAKITLAR[k].fiyat != null ? String(YAKITLAR[k].fiyat) : "");
  };

  const area = toNum(alan);
  const input: HeatPumpInput = {
    areaM2: area,
    bina,
    yalitim,
    tesisat,
    kisi: Math.min(12, Math.round(toNum(kisi))),
    yakit,
    yakitFiyat: toNum(fiyat),
    yillikHarcama: toNum(harcama) || undefined,
  };
  const priceOk = yakit === "elektrik" || toNum(fiyat) > 0;
  const result = area > 0 && climate ? calculateHeatPump(input, climate.data, devices) : null;

  return (
    <div ref={ref} className="mx-auto max-w-4xl">
      <Stepper step={step} labels={["Bina", "Isınma", "Konum", "İletişim", "Rapor"]} />

      {step === 1 && (
        <Panel title="Isıtılacak bina" hint="Isı ihtiyacı binanın büyüklüğüne ve yalıtımına göre hesaplanır.">
          <p className="text-[13px] font-semibold text-ink">Bina tipi</p>
          <div className="mt-2">
            <Choice value={bina} onChange={setBina} options={opts(BINA_ADLARI, { mustakil: "Dört cephesi dışarıya açık", apartman: "Alt, üst ve yan daireler var", isyeri: "Mağaza, ofis, atölye" })} />
          </div>
          <div className="mt-6">
            <NumField label="Isıtılan alan" value={alan} onChange={setAlan} unit="m²" placeholder="ör. 150" note="Kullanım alanı; ısıtılmayan bodrum ve çatı arası hariç." />
          </div>
          <p className="mt-6 text-[13px] font-semibold text-ink">Yalıtım durumu</p>
          <div className="mt-2">
            <Choice
              cols={4}
              value={yalitim}
              onChange={setYalitim}
              options={opts(YALITIM_ADLARI, { yok: "Eski bina, tek cam", kismi: "Isıcam var, mantolama yok", standart: "Dış cephe yalıtımlı", iyi: "Son 5 yılda yapılmış" })}
            />
          </div>
          <Nav onNext={() => go(2)} disabled={!(area >= 20)} />
        </Panel>
      )}

      {step === 2 && (
        <Panel title="Isınma ve sıcak su" hint="Mevcut sisteminizle karşılaştırma yapabilmemiz için bugün nasıl ısındığınızı seçin.">
          <p className="text-[13px] font-semibold text-ink">Isıtma tesisatı</p>
          <div className="mt-2">
            <Choice
              value={tesisat}
              onChange={setTesisat}
              options={opts(TESISAT_ADLARI, { yerden: "En yüksek verim (35 °C su)", fancoil: "Isıtma ve soğutma (45 °C)", radyator: "Mevcut kalorifer tesisatı (55 °C)" })}
            />
          </div>

          <p className="mt-6 text-[13px] font-semibold text-ink">Bugün kullandığınız yakıt</p>
          <div className="mt-2">
            <Choice cols={4} value={yakit} onChange={pickYakit} options={(Object.keys(YAKITLAR) as Yakit[]).map((k) => ({ key: k, ad: YAKITLAR[k].ad }))} />
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {yakit !== "elektrik" && (
              <NumField className="" label={`${YAKITLAR[yakit].ad} birim fiyatı`} value={fiyat} onChange={setFiyat} unit={`TL / ${YAKITLAR[yakit].birim}`} placeholder={yakit === "komur" ? "ör. 12" : undefined} note={YAKITLAR[yakit].not} />
            )}
            <NumField className="" label="Geçen kış toplam ısınma harcaması (isteğe bağlı)" value={harcama} onChange={setHarcama} unit="TL" placeholder="ör. 40000" note="Girerseniz hesap evinizin gerçek tüketimine göre ayarlanır." />
            <NumField className="" label="Sıcak su kullanan kişi sayısı" value={kisi} onChange={setKisi} unit="kişi" note="Sıcak su ihtiyacı yoksa 0 yazın." />
          </div>
          <Nav onBack={() => go(1)} onNext={() => go(3)} disabled={!priceOk} />
        </Panel>
      )}

      {step === 3 && (
        <Panel title="Konum" hint="Bölgenizin saatlik sıcaklık verisiyle hem ısı ihtiyacı hem de ısı pompasının verimi hesaplanır.">
          <PlacePicker {...loc} mapLabel="Daha hassas sonuç için evinizi haritada işaretleyin (isteğe bağlı)" />
          <Nav onBack={() => go(2)} onNext={() => go(4)} nextLabel="Raporu hazırla" disabled={!loc.il} />
        </Panel>
      )}

      {step === 4 && !result && <Panel title="Raporunuz hazırlanıyor…" hint={`${loc.place.ad} için iklim verisi alınıyor.`}>{null}</Panel>}

      {step === 4 && result && (
        <ContactStep
          page={PAGE}
          place={loc.place}
          bullets={[
            "Evinize uygun ısı pompası gücü ve önerilen cihaz",
            `${loc.place.ad} iklimine göre aylık ısı ihtiyacı`,
            "Mevcut yakıtınızla aylık gider karşılaştırması",
            "Yıllık tasarruf, verim (SCOP) ve geri ödeme",
            "Güneş enerjisiyle birlikte kurulum senaryosu",
          ]}
          payload={{
            needType: "Isı pompası hesaplama",
            source: "heatpump_calculator",
            calcType: "isi_pompasi",
            summary: `Isı pompası · ${num(area)} m² ${BINA_ADLARI[bina].toLocaleLowerCase("tr-TR")}, ${YALITIM_ADLARI[yalitim].toLocaleLowerCase("tr-TR")}, ${TESISAT_ADLARI[tesisat].toLocaleLowerCase("tr-TR")}, ${loc.place.ad}; ${result.deviceKw} kW cihaz${result.package ? ` (${result.package.name})` : ""}; şu an ${YAKITLAR[yakit].ad.toLocaleLowerCase("tr-TR")} ~${Math.round(result.currentAnnualTl)} TL/yıl, ısı pompasıyla ~${Math.round(result.hpAnnualTl)} TL/yıl.`,
            inputs: input,
            results: { ...result, systemKw: result.deviceKw, monthlyBillTl: Math.round(result.currentAnnualTl / 12) },
            recommendedProduct: result.package?.name,
            estimatedValue: result.package?.price,
            score: heatPumpScore(result),
          }}
          onDone={() => go(5)}
          onBack={() => go(3)}
        />
      )}

      {step === 5 && result && climate && (
        <Result r={result} input={input} place={loc.place} source={climate.source} designT={climate.data.designT} solarPackages={solarPackages} contact={contact} onBack={() => go(3)} />
      )}
    </div>
  );
}

function Result({
  r,
  input,
  place,
  source,
  designT,
  solarPackages,
  contact,
  onBack,
}: {
  r: ReturnType<typeof calculateHeatPump>;
  input: HeatPumpInput;
  place: Place;
  source: "pvgis" | "ortalama";
  designT: number;
  solarPackages: PackageOption[];
  contact: CompanyContact;
  onBack: () => void;
}) {
  const yakit = YAKITLAR[input.yakit];
  // Güneş paketi: ısı pompasının yıllık elektriğini karşılayan en küçük fiyatlı paket (paket gücü AC; DC ≈ 1,1 kat).
  const solar = solarPackages.filter((p) => p.price && p.kw * 1.1 >= r.pvKwp).sort((a, b) => a.kw - b.kw)[0] ?? null;
  const combo = solarCombo(r, solar);
  // Doğalgaz ucuz olduğundan cihaz tek başına geç amorti eder; asıl kazanç güneşle birlikte kurulumdadır.
  const longAlone = r.paybackYears == null || r.paybackYears > 12;

  return (
    <div>
      <div className="overflow-hidden rounded-3xl bg-ink text-paper">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-sun">Ön fizibilite raporu · {place.ad}</p>
            <p className="mt-3 text-[13px] text-paper/70">Önerilen ısı pompası gücü</p>
            <p className="mt-1 font-display text-[44px] font-semibold leading-none">
              {num(r.deviceKw, 1)} <span className="text-[24px] text-paper/70">kW</span>
            </p>
            <p className="mt-2 text-[14.5px] text-paper/80">
              Binanızın en soğuk günde ({designT} °C) ihtiyacı {num(r.peakKw, 1)} kW · yılda {num(r.annualHeatKwh)} kWh ısı{input.kisi > 0 ? " ve sıcak su" : ""}
            </p>
            {r.calibrated && <p className="mt-3 rounded-lg bg-paper/10 px-3 py-2 text-[13px] text-sun-soft">Hesap, geçen kışki harcamanıza göre evinizin gerçek tüketimine ayarlandı.</p>}
            {longAlone && combo && combo.payback < (r.paybackYears ?? Infinity) && (
              <p className="mt-3 rounded-lg bg-paper/10 px-3 py-2 text-[13px] text-sun-soft">
                Isı pompası tek başına mevcut yakıtınıza göre uzun vadede geri öder; güneş enerjisiyle birlikte kurulduğunda geri ödeme {num(combo.payback, 1)} yıla iner (aşağıda).
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Kpi icon={<Wallet size={16} />} label="Yıllık tasarruf" value={r.annualSavingTl > 0 ? tl(r.annualSavingTl) : "Tasarruf yok"} />
            <Kpi icon={<Gauge size={16} />} label="Mevsimsel verim (SCOP)" value={num(r.scop, 1)} />
            <Kpi icon={<Flame size={16} />} label="Geri ödeme (cihaz)" value={r.paybackYears != null ? `${num(r.paybackYears, 1)} yıl` : "Teklifle netleşir"} />
            <Kpi icon={<Leaf size={16} />} label="Yıllık CO₂ azaltımı" value={r.co2TonsPerYear > 0 ? `${num(r.co2TonsPerYear, 1)} ton` : "—"} />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-line bg-paper-raised p-5">
          <h3 className="font-semibold text-ink">Aylık ısınma gideri karşılaştırması</h3>
          <p className="text-[12.5px] text-slate">
            {source === "pvgis" ? `${place.ad} için Avrupa Komisyonu PVGIS saatlik sıcaklık verisiyle` : "Bölge ortalaması sıcaklıklarla"} hesaplanmıştır. Değerler TL cinsindendir.
          </p>
          <MonthlyPair a={r.monthlyCurrentTl} b={r.monthlyHpTl} aLabel={`Bugün (${yakit.ad.split(" (")[0].toLocaleLowerCase("tr-TR")})`} bLabel="Isı pompası ile" unit="TL" aColor={GOLD} bColor={BLUE} />
        </section>

        <section className="flex flex-col rounded-2xl border border-line bg-paper-raised p-5">
          <ProductBox title="Önerilen cihaz" pkg={r.package} includes="KDV dahil cihaz bedeli · montaj ve tesisat bağlantısı keşifte netleşir" empty="Bu güçte tek cihaz yerine birden fazla ısı pompasıyla (kaskad) özel proje hazırlıyoruz." />
          <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-[13px]">
            <Row k="Bugünkü yıllık gider" v={tl(r.currentAnnualTl)} />
            <Row k="Isı pompasıyla yıllık gider" v={tl(r.hpAnnualTl)} />
            <Row k="Isı pompası elektrik tüketimi" v={`${num(r.annualElKwh)} kWh/yıl`} />
            <Row k="Elektrik birim fiyatı" v={`${num(r.elPrice, 2)} TL/kWh`} />
          </dl>
        </section>
      </div>

      {/* Güneş enerjisiyle birlikte: ısı pompasının elektriği çatıdan karşılanır. */}
      <section className="mt-6 rounded-2xl border border-sun/40 bg-sun/5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <Sun className="mt-0.5 shrink-0 text-sun-soft" />
          <div className="flex-1">
            <h3 className="font-semibold text-ink">Güneş enerjisiyle birlikte kurulursa ısınma gideriniz neredeyse sıfırlanır</h3>
            <p className="mt-1 text-[14px] text-slate">
              Isı pompasının yıllık {num(r.annualElKwh)} kWh elektriğini yaklaşık {num(r.pvKwp, 1)} kWp güneş sistemi üretir. Yazın fazla üretilen elektrik şebekeye verilir, kışın şebekeden geri çekilir (aylık mahsuplaşma).
            </p>
            <dl className="mt-4 grid gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2">
              {solar && <Row k="Güneş paketi" v={`${solar.name.replace(" Güneş Paneli Paketi", "")} · yılda ~${num(combo?.production ?? 0)} kWh`} />}
              {combo && <Row k="Toplam yatırım (cihaz + güneş)" v={tl(combo.cost)} />}
              <Row k="Yıllık kazanç" v={tl(combo?.saving ?? r.currentAnnualTl)} />
              {combo && <Row k="Birlikte geri ödeme" v={`${num(combo.payback, 1)} yıl`} />}
            </dl>
            {combo && combo.extraKwh > 0 && (
              <p className="mt-2 text-[12px] text-slate">
                Kazanç; bugünkü ısınma gideriniz ile paketin ısı pompası dışında kalan üretiminin evinizin diğer elektriğini karşılamasından (yılda {num(combo.extraKwh)} kWh) oluşur.
              </p>
            )}
            <Link href="/hesaplama/on-grid" className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand hover:underline">
              Evinizin tüm elektriği için güneş enerjisi hesaplayın <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <CallUs contact={contact} team="Mühendislerimiz" waText="Merhaba, sitenizde ısı pompası fizibilite raporumu oluşturdum. Ücretsiz keşif için görüşmek istiyorum." />

      <p className="mt-4 text-[12px] leading-relaxed text-slate">
        Bu rapor; bölgenizin tipik yıl saatlik sıcaklıkları, bina tipi ve yalıtıma göre tahmini ısı kaybı, tesisat suyu sıcaklığına göre değişen ısı pompası verimi ve EPDK {TARIFE_TARIHI} elektrik tarifesiyle
        hazırlanmış bir ön fizibilitedir. Yakıt fiyatları girdiğiniz değerlerle hesaplanmıştır. Kesin cihaz seçimi, ısı kaybı hesabı ve montaj bedeli yerinde keşiften sonra netleşir.
      </p>
      <button onClick={onBack} className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-slate hover:text-ink">
        <ArrowLeft size={15} /> Bilgileri değiştir
      </button>
    </div>
  );
}
