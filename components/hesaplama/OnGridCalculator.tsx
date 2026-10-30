"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Building2, Factory, Home, Leaf, Sprout, Sun, Wallet, Zap } from "lucide-react";
import { calculateOnGrid, leadScore, type OnGridInput, type PackageOption, type RoofType, type UsageProfile } from "@/lib/ongrid-calc";
import { ABONE_ADLARI, TARIFE_TARIHI, type AboneGrubu } from "@/lib/elektrik-tarife";
import { CallUs, Choice, ContactStep, Kpi, MonthlyPair, Nav, Panel, PlacePicker, ProductBox, Row, Stepper, Toggle, num, onlyNum, tl, usePlace, useWizard, type CompanyContact, type Place } from "./ui";

const PAGE = "/hesaplama/on-grid";

const ABONE_IKON: Record<AboneGrubu, typeof Home> = { mesken: Home, ticarethane: Building2, sanayi: Factory, tarimsal: Sprout };
const YONLER: { key: string; ad: string; azimuth: number; tilt: number }[] = [
  { key: "guney", ad: "Güney", azimuth: 0, tilt: 30 },
  { key: "guneydogu", ad: "Güneydoğu / Güneybatı", azimuth: 45, tilt: 30 },
  { key: "dogubati", ad: "Doğu / Batı", azimuth: 90, tilt: 25 },
  { key: "bilmiyorum", ad: "Bilmiyorum", azimuth: 0, tilt: 30 },
];
const CATILAR: { key: RoofType; ad: string; not: string }[] = [
  { key: "egimli", ad: "Kiremit / eğimli", not: "Müstakil ev ve villa çatıları" },
  { key: "duz", ad: "Düz beton / teras", not: "Paneller eğimli sehpaya kurulur" },
  { key: "trapez", ad: "Trapez sac / sandviç", not: "İşyeri, depo ve fabrika çatıları" },
];

type Mode = "fatura" | "aylik" | "gunluk";

export default function OnGridCalculator({ packages, contact }: { packages: PackageOption[]; contact: CompanyContact }) {
  const { step, go, ref } = useWizard(PAGE, "ongrid");
  const [abone, setAbone] = useState<AboneGrubu>("mesken");
  const [mode, setMode] = useState<Mode>("fatura");
  const [value, setValue] = useState("");
  const [klima, setKlima] = useState(false);
  const [isitma, setIsitma] = useState(false);
  const [sozlesme, setSozlesme] = useState("");
  const loc = usePlace();
  const konum = loc.place;
  const [cati, setCati] = useState<RoofType>("egimli");
  const [yon, setYon] = useState("guney");
  const [alan, setAlan] = useState("");
  const [yieldPerKwp, setYieldPerKwp] = useState<number[] | null>(null);
  const [yieldSource, setYieldSource] = useState<"pvgis" | "ortalama" | null>(null);

  const yonu = YONLER.find((y) => y.key === yon) ?? YONLER[0];
  // Düz çatıda paneller güneye bakan sehpalara kurulur; yön seçimi uygulanmaz.
  const azimuth = cati === "duz" ? 0 : yonu.azimuth;
  const tilt = cati === "duz" ? 30 : cati === "trapez" ? 10 : yonu.tilt;

  // Konuma özel üretim: 3. adım tamamlanınca PVGIS'ten alınır (sunucuda 30 gün önbellekli).
  const ready = step >= 4;
  useEffect(() => {
    if (!ready) return;
    let cancel = false;
    fetch(`/api/hesaplama/pvgis?lat=${konum.lat}&lon=${konum.lon}&angle=${tilt}&aspect=${azimuth}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => !cancel && (setYieldPerKwp(d.monthly), setYieldSource("pvgis")))
      .catch(() => !cancel && (setYieldPerKwp(null), setYieldSource("ortalama")));
    return () => {
      cancel = true;
    };
  }, [ready, konum.lat, konum.lon, tilt, azimuth]);

  const profile: UsageProfile = abone !== "mesken" ? "gunduz_isyeri" : isitma ? "kis_isitma" : klima ? "yaz_klima" : "dengeli";
  const amount = Number(value.replace(",", "."));
  const input: OnGridInput = {
    tariff: abone,
    monthlyBillTl: mode === "fatura" ? amount : undefined,
    monthlyKwh: mode === "aylik" ? amount : mode === "gunluk" ? amount * 30 : undefined,
    contractKw: Number(sozlesme.replace(",", ".")) || undefined,
    roofAreaM2: Number(alan.replace(",", ".")) || undefined,
    roofType: cati,
    azimuth,
    tilt,
    profile,
    monthlyYieldPerKwp: yieldPerKwp ?? undefined,
  };
  // Hesap hafif (12 aylık döngü); her çizimde yeniden yapılır.
  const result = amount > 0 ? calculateOnGrid(input, packages) : null;

  return (
    <div ref={ref} className="mx-auto max-w-4xl">
      <Stepper step={step} labels={["Abonelik", "Tüketim", "Konum ve çatı", "İletişim", "Rapor"]} />

      {step === 1 && (
        <Panel title="Elektrik aboneliğiniz hangi tipte?" hint="Faturanızın üst kısmında “Abone grubu” olarak yazar.">
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(ABONE_ADLARI) as AboneGrubu[]).map((g) => {
              const Icon = ABONE_IKON[g];
              const active = abone === g;
              return (
                <button
                  key={g}
                  onClick={() => setAbone(g)}
                  className={`flex items-center gap-4 rounded-2xl border p-5 text-left transition ${active ? "border-brand bg-brand/5 ring-2 ring-brand/25" : "border-line bg-paper-raised hover:border-brand/60"}`}
                >
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${active ? "bg-brand text-paper" : "bg-ink/5 text-ink"}`}>
                    <Icon size={22} />
                  </span>
                  <span className="font-display text-[16px] font-semibold text-ink">{ABONE_ADLARI[g]}</span>
                </button>
              );
            })}
          </div>
          <Nav onNext={() => go(2)} />
        </Panel>
      )}

      {step === 2 && (
        <Panel title="Elektrik tüketiminiz" hint="Hangisini biliyorsanız onu girin; fatura tutarından tüketimi EPDK tarifesiyle biz hesaplarız.">
          <div className="inline-flex rounded-xl border border-line bg-paper p-1">
            {(
              [
                ["fatura", "Aylık fatura (TL)"],
                ["aylik", "Aylık tüketim (kWh)"],
                ["gunluk", "Günlük tüketim (kWh)"],
              ] as const
            ).map(([k, label]) => (
              <button key={k} onClick={() => setMode(k)} className={`rounded-lg px-3.5 py-2 text-[13.5px] font-semibold ${mode === k ? "bg-ink text-paper" : "text-slate hover:text-ink"}`}>
                {label}
              </button>
            ))}
          </div>
          <label className="mt-5 block">
            <span className="text-[13px] font-semibold text-ink">
              {mode === "fatura" ? "Ortalama aylık fatura tutarı" : mode === "aylik" ? "Ortalama aylık tüketim" : "Ortalama günlük tüketim"}
            </span>
            <div className="mt-1.5 flex max-w-sm items-center rounded-xl border border-line bg-paper-raised focus-within:border-brand">
              <input
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(onlyNum(e.target.value))}
                placeholder={mode === "fatura" ? "ör. 2500" : mode === "aylik" ? "ör. 600" : "ör. 20"}
                className="w-full bg-transparent px-4 py-3 font-mono-data text-[18px] outline-none"
              />
              <span className="pr-4 text-[14px] font-semibold text-slate">{mode === "fatura" ? "TL" : "kWh"}</span>
            </div>
          </label>

          {abone === "mesken" && (
            <div className="mt-5 flex flex-wrap gap-3">
              <Toggle on={klima} set={setKlima} label="Yazın klima kullanıyorum" />
              <Toggle on={isitma} set={setIsitma} label="Evi elektrikle ısıtıyorum (ısı pompası, klima, elektrikli kalorifer)" />
            </div>
          )}

          <details className="mt-5 rounded-xl border border-line bg-paper p-4 text-[13.5px]">
            <summary className="cursor-pointer font-semibold text-ink">Sözleşme gücümü biliyorum (isteğe bağlı)</summary>
            <p className="mt-2 text-slate">Faturada “Sözleşme gücü” olarak yazar. Kurulabilecek en yüksek sistemi belirler.</p>
            <div className="mt-2 flex max-w-[200px] items-center rounded-xl border border-line bg-paper-raised">
              <input inputMode="decimal" value={sozlesme} onChange={(e) => setSozlesme(onlyNum(e.target.value))} placeholder="ör. 10" className="w-full bg-transparent px-3 py-2 outline-none" />
              <span className="pr-3 font-semibold text-slate">kW</span>
            </div>
          </details>
          <Nav onBack={() => go(1)} onNext={() => go(3)} disabled={!(amount > 0)} />
        </Panel>
      )}

      {step === 3 && (
        <Panel title="Konum ve çatı" hint="Güneş üretimi bulunduğunuz yerin uydu tabanlı güneş verisiyle ve çatınızın yönüne göre hesaplanır.">
          <PlacePicker {...loc} mapLabel="Daha hassas sonuç için çatınızı haritada işaretleyin (isteğe bağlı)" />

          <p className="mt-6 text-[13px] font-semibold text-ink">Çatı tipi</p>
          <div className="mt-2">
            <Choice value={cati} onChange={setCati} options={CATILAR} />
          </div>

          {cati === "egimli" && (
            <>
              <p className="mt-6 text-[13px] font-semibold text-ink">Çatının en geniş yüzü hangi yöne bakıyor?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {YONLER.map((y) => (
                  <button key={y.key} onClick={() => setYon(y.key)} className={`rounded-full border px-4 py-2 text-[13.5px] font-semibold ${yon === y.key ? "border-ink bg-ink text-paper" : "border-line text-slate hover:border-ink"}`}>
                    {y.ad}
                  </button>
                ))}
              </div>
            </>
          )}

          <label className="mt-6 block max-w-sm">
            <span className="text-[13px] font-semibold text-ink">Kullanılabilir çatı alanı (isteğe bağlı)</span>
            <div className="mt-1.5 flex items-center rounded-xl border border-line bg-paper-raised focus-within:border-brand">
              <input inputMode="decimal" value={alan} onChange={(e) => setAlan(onlyNum(e.target.value))} placeholder="ör. 80" className="w-full bg-transparent px-4 py-3 outline-none" />
              <span className="pr-4 font-semibold text-slate">m²</span>
            </div>
            <span className="mt-1 block text-[12px] text-slate">Bilmiyorsanız boş bırakın; keşifte ölçüyoruz.</span>
          </label>
          <Nav onBack={() => go(2)} onNext={() => go(4)} nextLabel="Raporu hazırla" disabled={!loc.il} />
        </Panel>
      )}

      {step === 4 && result && (
        <ContactStep
          page={PAGE}
          place={konum}
          bullets={[
            "Çatınıza uygun sistem gücü ve panel sayısı",
            `${konum.ad} güneş verisiyle aylık üretim tahmini`,
            "Aylık tüketim ve üretim dengesi",
            "Yıllık tasarruf ve geri ödeme süresi",
            "Önerilen paket ve güncel fiyatı",
          ]}
          payload={{
            needType: "On grid hesaplama",
            source: "ongrid_calculator",
            calcType: "on_grid",
            summary: `On grid · ${result.systemKw} kW (${result.panelCount} panel), ${ABONE_ADLARI[abone]}, ${konum.ad}; aylık fatura ~${Math.round(result.monthlyBillTl)} TL, yıllık tasarruf ~${Math.round(result.annualSavingTl)} TL${result.package ? `, paket: ${result.package.name}` : ""}.`,
            inputs: input,
            results: result,
            recommendedProduct: result.package?.name,
            estimatedValue: result.package?.price,
            score: leadScore(result, false),
          }}
          onDone={() => go(5)}
          onBack={() => go(3)}
        />
      )}

      {step === 5 && result && <Result result={result} abone={abone} il={konum} yieldSource={yieldSource} contact={contact} onBack={() => go(3)} />}
    </div>
  );
}

function Result({
  result: r,
  abone,
  il,
  yieldSource,
  contact,
  onBack,
}: {
  result: ReturnType<typeof calculateOnGrid>;
  abone: AboneGrubu;
  il: Place;
  yieldSource: "pvgis" | "ortalama" | null;
  contact: CompanyContact;
  onBack: () => void;
}) {
  const limitText =
    r.constrainedBy === "cati" ? "Çatı alanınız sistemi sınırlıyor." : r.constrainedBy === "mevzuat" ? `${r.limitNote ?? "Mevzuat sınırı"} sistemi sınırlıyor.` : null;
  return (
    <div>
      <div className="overflow-hidden rounded-3xl bg-ink text-paper">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-sun">Ön fizibilite raporu · {il.ad}</p>
            <p className="mt-3 text-[13px] text-paper/70">Önerilen sistem gücü</p>
            <p className="mt-1 font-display text-[44px] font-semibold leading-none">
              {num(r.systemKw, 1)} <span className="text-[24px] text-paper/70">kW</span>
            </p>
            <p className="mt-2 text-[14.5px] text-paper/80">
              {r.panelCount} adet 620 Wp panel · {num(r.dcKwp, 2)} kWp · yılda yaklaşık {num(r.annualProduction)} kWh üretim
            </p>
            {limitText && <p className="mt-3 rounded-lg bg-paper/10 px-3 py-2 text-[13px] text-sun-soft">{limitText}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Kpi icon={<Wallet size={16} />} label="Yıllık tasarruf" value={tl(r.annualSavingTl)} />
            <Kpi icon={<Zap size={16} />} label="Tüketimi karşılama" value={`%${r.coveragePct}`} />
            <Kpi icon={<Sun size={16} />} label="Geri ödeme" value={r.paybackYears != null ? `${num(r.paybackYears, 1)} yıl` : "Teklifle netleşir"} />
            <Kpi icon={<Leaf size={16} />} label="Yıllık CO₂ azaltımı" value={`${num(r.co2TonsPerYear, 1)} ton`} />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-line bg-paper-raised p-5">
          <h3 className="font-semibold text-ink">Aylık üretim ve tüketim dengesi</h3>
          <p className="text-[12.5px] text-slate">
            {yieldSource === "pvgis" ? `${il.ad} için Avrupa Komisyonu PVGIS güneş verisiyle` : "Bölge ortalamasıyla"} hesaplanmıştır. Değerler kWh cinsindendir.
          </p>
          <MonthlyPair a={r.monthlyProduction} b={r.monthlyKwh} aLabel="Güneş üretimi" bLabel="Tüketiminiz" unit="kWh" />
        </section>

        <section className="flex flex-col rounded-2xl border border-line bg-paper-raised p-5">
          <ProductBox title="Önerilen paket" pkg={r.package} includes="KDV dahil · panel, invertör, konstrüksiyon ve elektrik projesi" empty="Bu güçte hazır paketimiz yok; size özel sistem teklifi hazırlıyoruz." />
          <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-[13px]">
            <Row k="Bugünkü aylık fatura" v={tl(r.monthlyBillTl)} />
            <Row k="Yıllık tüketim" v={`${num(r.annualKwh)} kWh`} />
            <Row k="Ortalama kWh fiyatı" v={`${num(r.unitPrice, 2)} TL`} />
            <Row k="25 yılda toplam tasarruf" v={tl(r.savings25Tl)} />
          </dl>
        </section>
      </div>

      <CallUs contact={contact} team="Elektrik mühendislerimiz" waText="Merhaba, sitenizde güneş enerjisi fizibilite raporumu oluşturdum. Ücretsiz keşif için görüşmek istiyorum." />

      <p className="mt-4 text-[12px] leading-relaxed text-slate">
        Bu rapor; EPDK {TARIFE_TARIHI} tarifesi ({ABONE_ADLARI[abone].replace(/[()]/g, "").replace(" ", " / ")}), aylık mahsuplaşma ve güncel elektrik fiyatlarıyla hazırlanmış bir ön fizibilitedir. Şebekeye verilen fazla
        üretimin geliri hesaba katılmamıştır. Kesin sistem tasarımı ve fiyat, çatınızın yerinde incelenmesinin ardından netleşir.
      </p>
      <button onClick={onBack} className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-slate hover:text-ink">
        <ArrowLeft size={15} /> Bilgileri değiştir
      </button>
    </div>
  );
}
