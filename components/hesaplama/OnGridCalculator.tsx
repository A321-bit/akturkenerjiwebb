"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Factory, Home, Leaf, Lock, MapPin, MessageCircle, Phone, Sprout, Sun, Wallet, Zap } from "lucide-react";
import { calculateOnGrid, leadScore, type OnGridInput, type PackageOption, type RoofType, type UsageProfile } from "@/lib/ongrid-calc";
import { ABONE_ADLARI, TARIFE_TARIHI, type AboneGrubu } from "@/lib/elektrik-tarife";
import LocationPicker, { type PickedLocation } from "./LocationPicker";
import { ILLER } from "@/lib/il-konum";
import { buildLeadAttributionFields, getAttribution } from "@/lib/attribution";
import { trackEvent } from "@/lib/track";
import { trackGa4Lead, trackGoogleAdsLead } from "@/lib/ga4";

const PAGE = "/hesaplama/on-grid";
const BLUE = "#3f74c4";
const GOLD = "#d4861f";
const AYLAR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const tl = (n: number) => `${Math.round(n).toLocaleString("tr-TR")} TL`;
const num = (n: number, d = 0) => n.toLocaleString("tr-TR", { maximumFractionDigits: d });

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

/** Rapor sonrası gösterilen firma iletişim bilgisi. */
export type CompanyContact = { phone: string; whatsapp: string };

export default function OnGridCalculator({ packages, contact }: { packages: PackageOption[]; contact: CompanyContact }) {
  const [step, setStep] = useState(1);
  const [abone, setAbone] = useState<AboneGrubu>("mesken");
  const [mode, setMode] = useState<Mode>("fatura");
  const [value, setValue] = useState("");
  const [klima, setKlima] = useState(false);
  const [isitma, setIsitma] = useState(false);
  const [sozlesme, setSozlesme] = useState("");
  const [il, setIl] = useState("");
  const [loc, setLoc] = useState<PickedLocation | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [cati, setCati] = useState<RoofType>("egimli");
  const [yon, setYon] = useState("guney");
  const [alan, setAlan] = useState("");
  const [yieldPerKwp, setYieldPerKwp] = useState<number[] | null>(null);
  const [yieldSource, setYieldSource] = useState<"pvgis" | "ortalama" | null>(null);

  // Haritada işaret varsa tam nokta, yoksa seçilen ilin merkezi kullanılır (konum paylaşmak zorunlu değil).
  const ilMerkez = ILLER.find((i) => i.ad === il) ?? ILLER.find((i) => i.ad === "Ankara")!;
  const konum = loc ? { ad: loc.il, lat: loc.lat, lon: loc.lon } : { ad: ilMerkez.ad, lat: ilMerkez.lat, lon: ilMerkez.lon };
  const pickOnMap = (v: PickedLocation) => {
    setLoc(v);
    setIl(v.il);
  };
  const yonu = YONLER.find((y) => y.key === yon) ?? YONLER[0];
  // Düz çatıda paneller güneye bakan sehpalara kurulur; yön seçimi uygulanmaz.
  const azimuth = cati === "duz" ? 0 : yonu.azimuth;
  const tilt = cati === "duz" ? 30 : cati === "trapez" ? 10 : yonu.tilt;

  // Konuma özel üretim: 3. adım tamamlanınca PVGIS'ten alınır (sunucuda 30 gün önbellekli).
  useEffect(() => {
    if (step !== 4) return;
    let cancel = false;
    fetch(`/api/hesaplama/pvgis?lat=${konum.lat}&lon=${konum.lon}&angle=${tilt}&aspect=${azimuth}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => !cancel && (setYieldPerKwp(d.monthly), setYieldSource("pvgis")))
      .catch(() => !cancel && (setYieldPerKwp(null), setYieldSource("ortalama")));
    return () => {
      cancel = true;
    };
  }, [step, konum.lat, konum.lon, tilt, azimuth]);

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

  function go(next: number) {
    setStep(next);
    trackEvent("click", PAGE, `ongrid_step_${next}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const canNext2 = amount > 0;

  return (
    <div className="mx-auto max-w-4xl">
      <Stepper step={step} />

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
                onChange={(e) => setValue(e.target.value.replace(/[^\d.,]/g, ""))}
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
              <input inputMode="decimal" value={sozlesme} onChange={(e) => setSozlesme(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="ör. 10" className="w-full bg-transparent px-3 py-2 outline-none" />
              <span className="pr-3 font-semibold text-slate">kW</span>
            </div>
          </details>
          <Nav onBack={() => go(1)} onNext={() => go(3)} disabled={!canNext2} />
        </Panel>
      )}

      {step === 3 && (
        <Panel title="Konum ve çatı" hint="Güneş üretimi tam konumunuzun uydu tabanlı güneş verisiyle ve çatınızın yönüne göre hesaplanır.">
          <label className="block max-w-sm">
            <span className="text-[13px] font-semibold text-ink">İl</span>
            <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-line bg-paper-raised px-3 focus-within:border-brand">
              <MapPin size={17} className="text-brand" />
              <select
                value={il}
                onChange={(e) => {
                  setIl(e.target.value);
                  setLoc(null);
                }}
                className="w-full bg-transparent py-3 text-[15px] outline-none"
              >
                <option value="">İl seçin</option>
                {ILLER.map((i) => (
                  <option key={i.ad}>{i.ad}</option>
                ))}
              </select>
            </div>
          </label>
          {showMap ? (
            <div className="mt-4">
              <LocationPicker value={loc} onChange={pickOnMap} />
            </div>
          ) : (
            <button onClick={() => setShowMap(true)} className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-brand hover:underline">
              <MapPin size={15} /> Daha hassas sonuç için çatınızı haritada işaretleyin (isteğe bağlı)
            </button>
          )}

          <p className="mt-6 text-[13px] font-semibold text-ink">Çatı tipi</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {CATILAR.map((c) => (
              <button key={c.key} onClick={() => setCati(c.key)} className={`rounded-xl border p-4 text-left ${cati === c.key ? "border-brand bg-brand/5 ring-2 ring-brand/25" : "border-line bg-paper-raised hover:border-brand/60"}`}>
                <p className="font-semibold text-ink">{c.ad}</p>
                <p className="mt-0.5 text-[12.5px] text-slate">{c.not}</p>
              </button>
            ))}
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
              <input inputMode="decimal" value={alan} onChange={(e) => setAlan(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="ör. 80" className="w-full bg-transparent px-4 py-3 outline-none" />
              <span className="pr-4 font-semibold text-slate">m²</span>
            </div>
            <span className="mt-1 block text-[12px] text-slate">Bilmiyorsanız boş bırakın; keşifte ölçüyoruz.</span>
          </label>
          <Nav onBack={() => go(2)} onNext={() => go(4)} nextLabel="Sonucu gör" disabled={!il} />
        </Panel>
      )}

      {step === 4 && result && (
        <Result
          result={result}
          abone={abone}
          il={konum}
          yieldSource={yieldSource}
          input={input}
          unlocked={unlocked}
          onUnlock={() => setUnlocked(true)}
          contact={contact}
          onBack={() => go(3)}
        />
      )}
    </div>
  );
}

function Result({
  result: r,
  abone,
  il,
  yieldSource,
  input,
  unlocked,
  onUnlock,
  contact,
  onBack,
}: {
  result: ReturnType<typeof calculateOnGrid>;
  abone: AboneGrubu;
  il: { ad: string; lat: number; lon: number };
  yieldSource: "pvgis" | "ortalama" | null;
  input: OnGridInput;
  unlocked: boolean;
  onUnlock: () => void;
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
            <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-sun">Önerilen sistem · {il.ad}</p>
            <p className="mt-2 font-display text-[44px] font-semibold leading-none">
              {num(r.systemKw, 1)} <span className="text-[24px] text-paper/70">kW</span>
            </p>
            <p className="mt-2 text-[14.5px] text-paper/80">
              {r.panelCount} adet 620 Wp panel · {num(r.dcKwp, 2)} kWp · yılda yaklaşık {num(r.annualProduction)} kWh üretim
            </p>
            {limitText && <p className="mt-3 rounded-lg bg-paper/10 px-3 py-2 text-[13px] text-sun-soft">{limitText}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Kpi icon={<Wallet size={16} />} label="Yıllık tasarruf" value={tl(r.annualSavingTl)} locked={!unlocked} />
            <Kpi icon={<Zap size={16} />} label="Tüketimi karşılama" value={`%${r.coveragePct}`} />
            <Kpi icon={<Sun size={16} />} label="Geri ödeme" value={r.paybackYears != null ? `${num(r.paybackYears, 1)} yıl` : "Teklifle netleşir"} locked={!unlocked} />
            <Kpi icon={<Leaf size={16} />} label="Yıllık CO₂ azaltımı" value={`${num(r.co2TonsPerYear, 1)} ton`} />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-line bg-paper-raised p-5">
          <h3 className="font-semibold text-ink">Aylık üretim ve tüketim</h3>
          <p className="text-[12.5px] text-slate">
            {yieldSource === "pvgis" ? `${il.ad} için Avrupa Komisyonu PVGIS güneş verisiyle` : "Bölge ortalamasıyla"} hesaplandı (kWh)
          </p>
          <MonthlyBars production={r.monthlyProduction} consumption={r.monthlyKwh} />
        </section>

        <section className="relative flex flex-col overflow-hidden rounded-2xl border border-line bg-paper-raised p-5">
          {!unlocked && <LockedOverlay />}
          <h3 className="font-semibold text-ink">Size uygun paket</h3>
          {r.package ? (
            <>
              <p className="mt-2 font-display text-[18px] font-semibold text-ink">{r.package.name}</p>
              {r.package.price ? <p className="mt-1 font-mono-data text-[22px] font-semibold text-brand">{tl(r.package.price)}</p> : <p className="mt-1 text-slate">Fiyat için teklif alın</p>}
              <p className="mt-1 text-[12px] text-slate">KDV dahil · panel, invertör, konstrüksiyon ve elektrik projesi</p>
              <Link href={r.package.href} className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand hover:underline">
                Paketi incele <ArrowRight size={15} />
              </Link>
            </>
          ) : (
            <p className="mt-2 text-[14px] text-slate">Bu güçte hazır paketimiz yok; size özel sistem teklifi hazırlıyoruz.</p>
          )}
          <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-[13px]">
            <Row k="Bugünkü aylık fatura" v={tl(r.monthlyBillTl)} />
            <Row k="Yıllık tüketim" v={`${num(r.annualKwh)} kWh`} />
            <Row k="Ortalama kWh fiyatı" v={`${num(r.unitPrice, 2)} TL`} />
            <Row k="25 yılda toplam tasarruf" v={tl(r.savings25Tl)} />
          </dl>
        </section>
      </div>

      <LeadBox result={r} abone={abone} il={il} input={input} done={unlocked} onDone={onUnlock} contact={contact} />

      <p className="mt-4 text-[12px] leading-relaxed text-slate">
        Hesap; EPDK {TARIFE_TARIHI} tarifesi ({ABONE_ADLARI[abone].replace(/[()]/g, "").replace(" ", " / ")}), aylık mahsuplaşma ve bugünkü elektrik fiyatlarıyla yapılmış ön tahmindir. Fazla üretimin satış geliri dahil
        edilmemiştir. Kesin sistem, çatınızın yerinde incelenmesiyle netleşir.
      </p>
      <button onClick={onBack} className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-slate hover:text-ink">
        <ArrowLeft size={15} /> Bilgileri değiştir
      </button>
    </div>
  );
}

function LeadBox({
  result: r,
  abone,
  il,
  input,
  done,
  onDone,
  contact,
}: {
  result: ReturnType<typeof calculateOnGrid>;
  abone: AboneGrubu;
  il: { ad: string; lat: number; lon: number };
  input: OnGridInput;
  done: boolean;
  onDone: () => void;
  contact: CompanyContact;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const valid = name.trim().length > 2 && phone.replace(/\D/g, "").length >= 10 && consent;

  async function submit() {
    if (!valid) return;
    setState("sending");
    const summary = `On grid hesaplama: ${r.systemKw} kW (${r.panelCount} panel), ${ABONE_ADLARI[abone]}, ${il.ad}; aylık fatura ~${Math.round(r.monthlyBillTl)} TL, yıllık tasarruf ~${Math.round(r.annualSavingTl)} TL${r.package ? `, paket: ${r.package.name}` : ""}.`;
    const attribution = getAttribution();
    try {
      const [lead, calc] = await Promise.all([
        fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ needType: "On grid hesaplama", fullname: name, phone, province: il.ad, source: "ongrid_calculator", notes: summary, ...buildLeadAttributionFields(PAGE) }),
        }),
        fetch("/api/hesaplama/kaydet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "on_grid",
            fullname: name,
            phone,
            province: il.ad,
            lat: il.lat,
            lng: il.lon,
            consent,
            inputs: input,
            results: r,
            recommendedProduct: r.package?.name,
            estimatedValue: r.package?.price,
            score: leadScore(r, false),
            ...attribution,
          }),
        }),
      ]);
      if (!lead.ok && !calc.ok) throw new Error();
      trackEvent("click", PAGE, "ongrid_lead_submit");
      trackGa4Lead("ongrid_calculator");
      trackGoogleAdsLead();
      onDone();
    } catch {
      setState("error");
    }
  }

  if (done)
    return (
      <div className="mt-6 rounded-2xl border border-volt/30 bg-volt/5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 shrink-0 text-volt" />
          <div>
            <p className="font-semibold text-ink">Raporunuz açıldı. Elektrik mühendislerimiz sizi arayacak.</p>
            <p className="mt-1 text-[14px] text-slate">
              Hesaplamanızı inceleyip en kısa sürede {contact.phone} numaramızdan size ulaşacağız; çatınızı ücretsiz ölçüp kesin teklifinizi hazırlayacağız.
            </p>
          </div>
        </div>
        {/* Dosya indirilmez: numara gösterilir, arama ve WhatsApp telefonun kendi uygulamasında açılır. */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-volt/20 pt-4">
          <p className="w-full text-[13px] text-slate">Aradığımızda tanımanız için numaramızı rehberinize ekleyebilirsiniz:</p>
          <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-paper hover:bg-brand">
            <Phone size={16} /> {contact.phone}
          </a>
          <a
            href={`https://wa.me/${contact.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-[14px] font-semibold text-ink hover:border-volt"
          >
            <MessageCircle size={16} /> WhatsApp hattımız
          </a>
        </div>
      </div>
    );

  return (
    <section className="mt-6 rounded-2xl border border-brand/30 bg-brand/5 p-5 sm:p-6">
      <h3 className="flex items-center gap-2 font-display text-[18px] font-semibold text-ink">
        <Lock size={18} className="text-brand" /> Detaylı raporunuzu açın
      </h3>
      <p className="mt-1 text-[14px] text-slate">Size uygun paket ve fiyatı, yıllık tasarruf, geri ödeme süresi ve 25 yıllık kazancı görmek için bilgilerinizi bırakın. Mühendisimiz hesaplamanızı ücretsiz olarak da değerlendirir.</p>
      <p className="mt-2 text-[13px] font-semibold text-brand">Bilgilerinizi bıraktığınızda elektrik mühendislerimiz sizi arayacak.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ad soyad" className="rounded-xl border border-line bg-paper-raised px-4 py-3 outline-none focus:border-brand" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="Telefon (05xx xxx xx xx)" className="rounded-xl border border-line bg-paper-raised px-4 py-3 outline-none focus:border-brand" />
      </div>
      <label className="mt-3 flex items-start gap-2 text-[12.5px] text-slate">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
        <span>
          Kişisel verilerimin teklif ve keşif amacıyla işlenmesine ilişkin{" "}
          <Link href="/kvkk-aydinlatma-metni" target="_blank" className="text-brand underline">
            aydınlatma metnini
          </Link>{" "}
          okudum, onaylıyorum.
        </span>
      </label>
      <button onClick={submit} disabled={!valid || state === "sending"} className="mt-4 rounded-full bg-sun px-6 py-3 font-semibold text-ink transition hover:bg-sun-soft disabled:opacity-50">
        {state === "sending" ? "Gönderiliyor…" : "Raporumu göster"}
      </button>
      {state === "error" && <p className="mt-2 text-[13px] text-red-600">Gönderilemedi, lütfen tekrar deneyin ya da WhatsApp&apos;tan yazın.</p>}
    </section>
  );
}

function MonthlyBars({ production, consumption }: { production: number[]; consumption: number[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...production, ...consumption);
  return (
    <div className="mt-4">
      <div className="mb-2 flex gap-4 text-[12px] text-slate">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: BLUE }} /> Güneş üretimi</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: GOLD }} /> Tüketiminiz</span>
      </div>
      <div className="relative flex h-44 items-end gap-1.5" onMouseLeave={() => setHover(null)}>
        {production.map((p, i) => (
          <div key={i} className="flex h-full flex-1 flex-col justify-end" onMouseEnter={() => setHover(i)}>
            <div className="flex h-full items-end justify-center gap-[2px]">
              <div className="w-1/2 rounded-t-[4px]" style={{ height: `${(p / max) * 100}%`, background: BLUE, opacity: hover == null || hover === i ? 1 : 0.45 }} />
              <div className="w-1/2 rounded-t-[4px]" style={{ height: `${(consumption[i] / max) * 100}%`, background: GOLD, opacity: hover == null || hover === i ? 1 : 0.45 }} />
            </div>
            <span className="mt-1 text-center text-[10.5px] text-slate">{AYLAR[i]}</span>
          </div>
        ))}
        {hover != null && (
          <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 rounded-lg border border-line bg-paper-raised px-3 py-1.5 text-[12px] shadow-sm">
            <b className="text-ink">{AYLAR[hover]}</b> · üretim {num(production[hover])} kWh · tüketim {num(consumption[hover])} kWh
          </div>
        )}
      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const labels = ["Abonelik", "Tüketim", "Konum ve çatı", "Sonuç"];
  return (
    <ol className="mb-6 flex items-center gap-2">
      {labels.map((l, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <li key={l} className="flex flex-1 items-center gap-2">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono-data text-[13px] font-bold ${active ? "bg-brand text-paper" : done ? "bg-volt text-paper" : "bg-ink/5 text-slate"}`}>
              {done ? "✓" : n}
            </span>
            <span className={`hidden text-[13px] font-semibold sm:block ${active ? "text-ink" : "text-slate"}`}>{l}</span>
            {n < labels.length && <span className="h-px flex-1 bg-line" />}
          </li>
        );
      })}
    </ol>
  );
}

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-paper-raised p-6 shadow-[0_24px_60px_-40px_rgba(14,22,38,0.35)] sm:p-8">
      <h2 className="font-display text-[22px] font-semibold tracking-tight text-ink">{title}</h2>
      {hint && <p className="mt-1 text-[14px] text-slate">{hint}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Nav({ onBack, onNext, disabled, nextLabel = "Devam" }: { onBack?: () => void; onNext: () => void; disabled?: boolean; nextLabel?: string }) {
  return (
    // Butonlar solda: sağ alttaki canlı destek / ara / WhatsApp düğmelerinin altında kalmasın.
    <div className="mt-8 flex flex-wrap items-center gap-5">
      <button onClick={onNext} disabled={disabled} className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-[15px] font-semibold text-paper transition hover:bg-brand-deep disabled:opacity-40">
        {nextLabel} <ArrowRight size={16} />
      </button>
      {onBack && (
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-slate hover:text-ink">
          <ArrowLeft size={15} /> Geri
        </button>
      )}
    </div>
  );
}

function Toggle({ on, set, label }: { on: boolean; set: (v: boolean) => void; label: string }) {
  return (
    <button onClick={() => set(!on)} className={`rounded-full border px-4 py-2 text-[13.5px] font-semibold ${on ? "border-brand bg-brand text-paper" : "border-line text-slate hover:border-brand"}`}>
      {on ? "✓ " : ""}
      {label}
    </button>
  );
}

function Kpi({ icon, label, value, locked }: { icon: React.ReactNode; label: string; value: string; locked?: boolean }) {
  return (
    <div className="rounded-2xl bg-paper/10 p-4">
      <p className="flex items-center gap-1.5 text-[12px] text-paper/70">
        {icon} {label}
      </p>
      {locked ? (
        <p className="mt-1 flex items-center gap-1.5 font-mono-data text-[19px] font-semibold">
          <span className="select-none blur-[6px]" aria-hidden>
            88.888
          </span>
          <Lock size={15} className="text-sun" />
        </p>
      ) : (
        <p className="mt-1 font-mono-data text-[19px] font-semibold">{value}</p>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate">{k}</dt>
      <dd className="font-mono-data font-semibold text-ink">{v}</dd>
    </div>
  );
}

// Kilitli kart: içerik bulanık; bilgileri bırakınca açılır.
function LockedOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-paper-raised/80 p-6 text-center backdrop-blur-md">
      <Lock className="text-brand" />
      <p className="font-semibold text-ink">Paket ve fiyat bilgisi</p>
      <p className="text-[13px] text-slate">Aşağıdan bilgilerinizi bırakınca açılır.</p>
    </div>
  );
}
