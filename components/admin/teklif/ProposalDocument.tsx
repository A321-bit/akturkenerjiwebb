/* eslint-disable @next/next/no-img-element -- yazdırma belgesinde data URL görselleri */
import { YON_ADI, isFlat } from "@/lib/teklif/geometry";
import type { Proposal, ProposalNumbers } from "@/lib/teklif/proposal";
import { meanAzimuth, simulateDay, simulateYear, type HourFlow } from "@/lib/teklif/simulate";
import { ABONE_ADLARI } from "@/lib/elektrik-tarife";

// Teklif belgesi (A4). Tarayıcının "PDF olarak kaydet" çıktısı için tasarlanmıştır;
// ekranda da önizleme olarak gösterilir.

export type Company = { name: string; phone: string; email: string; address: string; web: string };

const AY = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const tl = (n: number) => `${Math.round(n).toLocaleString("tr-TR")} TL`;
const num = (n: number, d = 0) => n.toLocaleString("tr-TR", { maximumFractionDigits: d, minimumFractionDigits: d });
const date = (iso: string, addDays = 0) => new Date(new Date(iso).getTime() + addDays * 864e5).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });

function Sheet({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return <section className={`proposal-sheet relative mx-auto bg-white text-[#0e1626] ${last ? "" : "proposal-break"}`}>{children}</section>;
}

function Head({ company, title, no }: { company: Company; title: string; no: string }) {
  return (
    <header className="flex items-center justify-between border-b-2 border-[#0e1626] pb-3">
      <img src="/logo.svg" alt={company.name} className="h-9" />
      <div className="text-right">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#5b6577]">{title}</p>
        <p className="font-mono text-[11px] font-semibold">{no}</p>
      </div>
    </header>
  );
}

function Foot({ company, page }: { company: Company; page: number }) {
  return (
    <footer className="absolute bottom-[12mm] left-[16mm] right-[16mm] flex justify-between border-t border-[#d9dee6] pt-2 text-[9px] text-[#5b6577]">
      <span>
        {company.name} · {company.address}
      </span>
      <span>
        {company.phone} · {company.email} · Sayfa {page}
      </span>
    </footer>
  );
}

function Fig({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f2f5f9] px-3 py-2.5">
      <p className="text-[9.5px] uppercase tracking-wide text-[#5b6577]">{label}</p>
      <p className="mt-0.5 font-mono text-[15px] font-semibold">{value}</p>
    </div>
  );
}

function Chart({ prod, cons }: { prod: number[]; cons: number[] }) {
  const max = Math.max(1, ...prod, ...cons);
  const W = 520;
  const H = 150;
  const bw = W / 12;
  return (
    <svg viewBox={`0 0 ${W} ${H + 34}`} className="w-full">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={0} x2={W} y1={H - H * f} y2={H - H * f} stroke="#e6eaf0" />
      ))}
      {prod.map((p, i) => {
        const hp = (p / max) * H;
        const hc = (cons[i] / max) * H;
        const x = i * bw + bw * 0.14;
        const w = bw * 0.34;
        return (
          <g key={i}>
            <rect x={x} y={H - hp} width={w} height={hp} rx={2} fill="#3f74c4" />
            {cons.some((c) => c > 0) && <rect x={x + w + 2} y={H - hc} width={w} height={hc} rx={2} fill="#d4861f" />}
            <text x={x + w} y={H - Math.max(hp, hc) - 4} textAnchor="middle" fontSize="8" fill="#3d4757" fontFamily="monospace">
              {Math.round(p).toLocaleString("tr-TR")}
            </text>
            <text x={x + w} y={H + 13} textAnchor="middle" fontSize="9" fill="#5b6577">
              {AY[i]}
            </text>
          </g>
        );
      })}
      <g fontSize="9" fill="#3d4757">
        <rect x={0} y={H + 22} width={9} height={9} rx={2} fill="#3f74c4" />
        <text x={13} y={H + 30}>Güneş üretimi (kWh)</text>
        {cons.some((c) => c > 0) && (
          <>
            <rect x={130} y={H + 22} width={9} height={9} rx={2} fill="#d4861f" />
            <text x={143} y={H + 30}>Tüketiminiz (kWh)</text>
          </>
        )}
      </g>
    </svg>
  );
}

// Tipik gün: üretim alanı, tüketim çizgisi.
function DayCurve({ title, day }: { title: string; day: HourFlow[] }) {
  const W = 250;
  const H = 88;
  const max = Math.max(0.5, ...day.map((d) => Math.max(d.pv, d.load)));
  const x = (h: number) => (h / 23) * W;
  const y = (v: number) => H - (v / max) * H;
  const path = (f: (d: HourFlow) => number) => day.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(f(d)).toFixed(1)}`).join(" ");
  return (
    <div>
      <p className="text-[10.5px] font-semibold">{title}</p>
      <svg viewBox={`0 0 ${W} ${H + 12}`} className="mt-1 w-full">
        <line x1={0} x2={W} y1={H} y2={H} stroke="#c6ccd6" />
        <path d={`${path((d) => d.pv)} L${W} ${H} L0 ${H}Z`} fill="#d4861f" fillOpacity={0.2} />
        <path d={path((d) => d.pv)} fill="none" stroke="#d4861f" strokeWidth={1.5} />
        <path d={path((d) => d.load)} fill="none" stroke="#3f74c4" strokeWidth={1.5} />
        {[0, 6, 12, 18].map((h) => <text key={h} x={x(h)} y={H + 10} fontSize="7.5" fill="#5b6577" textAnchor={h ? "middle" : "start"}>{String(h).padStart(2, "0")}:00</text>)}
      </svg>
    </div>
  );
}

// 25 yıllık birikimli net kazanç: yatırım geri dönene kadar gri, sonrası yeşil.
function PaybackChart({ data }: { data: number[] }) {
  const W = 520;
  const H = 130;
  const hi = Math.max(0, ...data);
  const lo = Math.min(0, ...data);
  const span = hi - lo || 1;
  const zero = H - ((0 - lo) / span) * H;
  const bw = W / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H + 16}`} className="w-full">
      {data.map((v, i) => {
        const h = (Math.abs(v) / span) * H;
        return <rect key={i} x={i * bw + 2} y={v >= 0 ? zero - h : zero} width={bw - 4} height={Math.max(1, h)} rx={2} fill={v >= 0 ? "#2f9e6e" : "#aeb6c2"} />;
      })}
      <line x1={0} x2={W} y1={zero} y2={zero} stroke="#0e1626" />
      {[1, 5, 10, 15, 20, 25].map((y) => <text key={y} x={(y - 0.5) * bw} y={H + 12} fontSize="8.5" fill="#5b6577" textAnchor="middle">{y}. yıl</text>)}
    </svg>
  );
}

export default function ProposalDocument({ p, n, company }: { p: Proposal; n: ProposalNumbers; company: Company }) {
  const system = p.systemType ?? "ongrid";
  const offGrid = system !== "ongrid";
  const hasCons = n.annualKwh > 0;
  // Şebekesiz sistemde tasarruf, girilen mevcut enerji gideridir; girilmediyse tasarruf hesabı belgede yer almaz.
  const hasSaving = offGrid ? (p.currentEnergyCostTl ?? 0) > 0 : hasCons;
  // Fiyat gösterimi: USD teklifte seçime göre dolar ya da günün kuruyla TL; eski tekliflerde TL.
  const isUsd = p.priceCurrency === "USD";
  const money = (v: number) => (!isUsd ? tl(v) : p.showTl && p.usdTry ? tl(v * p.usdTry) : `${Math.round(v).toLocaleString("tr-TR")} USD`);
  const showPrices = !isUsd || Boolean(p.showLinePrices);
  const plan = p.paymentPlan ?? [];
  const hike = p.hikeTable ?? [];
  const reportName = system === "offgrid" ? "Off grid sistem raporu" : system === "sulama" ? "Tarımsal sulama raporu" : p.reportType === "maksimum" ? "Maksimum kurulacak güç raporu" : "Optimal kurulacak güç raporu";
  const hasFlow = !offGrid && hasCons && n.annualProduction > 0 && !p.shortReport;
  const hasPayback = hasFlow || (offGrid && hasSaving && !p.shortReport);
  const options = p.optionMode === "uc" ? (p.options ?? []) : [];
  let page = 0;
  const nextPage = () => ++page;
  const lat = p.site.center[0];
  const azimuth = meanAzimuth(n.byFace.map((f) => ({ azimuth: p.faces.find((x) => x.id === f.faceId)?.azimuth ?? 0, weight: f.annualKwh })));
  const battery = p.batteryKwh ?? 0;
  const flow = (month: number) => simulateDay({ month, monthlyPv: n.monthlyProduction[month], monthlyLoad: n.monthlyKwh[month], abone: p.abone, lat, azimuth, batteryKwh: battery });
  const year = hasFlow ? simulateYear({ monthlyPv: n.monthlyProduction, monthlyLoad: n.monthlyKwh, abone: p.abone, lat, azimuth, batteryKwh: battery }) : null;
  return (
    <div className="proposal-doc space-y-6 print:space-y-0">
      {/* 1. Kapak ve özet */}
      <Sheet>
        <Head company={company} title={`Güneş enerjisi teklifi · ${reportName}`} no={p.proposalNo} />
        <div className="mt-6 grid grid-cols-[1.3fr_1fr] gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#d4861f]">Sayın</p>
            <h1 className="mt-1 text-[24px] font-semibold leading-tight">{p.customer.name || "Müşteri"}</h1>
            <p className="mt-1 text-[11.5px] text-[#3d4757]">
              {[p.customer.address, p.customer.mahalle, p.customer.district, p.customer.province, p.customer.ada && p.customer.parsel ? `Ada/Parsel: ${p.customer.ada}/${p.customer.parsel}` : null].filter(Boolean).join(", ")}
              {p.customer.phone ? ` · ${p.customer.phone}` : ""}
            </p>
            <p className="mt-4 text-[12px] leading-relaxed text-[#3d4757]">
              {system === "sulama" ? "Sulama sisteminiz" : "Çatınız"} için hazırladığımız {num(n.dcKwp, 2)} kWp güneş enerjisi sisteminin tasarımını, beklenen üretimini{hasSaving ? ", tasarruf hesabını" : ""} ve fiyatını bilgilerinize sunarız.
            </p>
          </div>
          <dl className="space-y-1 rounded-lg border border-[#d9dee6] p-3 text-[11px]">
            <div className="flex justify-between"><dt className="text-[#5b6577]">Teklif no</dt><dd className="font-mono font-semibold">{p.proposalNo}</dd></div>
            <div className="flex justify-between"><dt className="text-[#5b6577]">Tarih</dt><dd>{date(p.createdAt)}</dd></div>
            <div className="flex justify-between"><dt className="text-[#5b6577]">Geçerlilik</dt><dd>{date(p.createdAt, p.validDays)}</dd></div>
            {!offGrid && <div className="flex justify-between"><dt className="text-[#5b6577]">Abonelik</dt><dd>{ABONE_ADLARI[p.abone]}</dd></div>}
          </dl>
        </div>
        {p.images?.perspective && <img src={p.images.perspective} alt="Sistem 3B görünümü" className="mt-5 h-[92mm] w-full rounded-xl object-cover" />}
        <div className="mt-5 grid grid-cols-4 gap-2.5">
          <Fig label="Sistem gücü" value={`${num(n.dcKwp, 2)} kWp`} />
          <Fig label="Panel" value={`${n.panelCount} adet`} />
          <Fig label="Yıllık üretim" value={`${num(n.annualProduction)} kWh`} />
          <Fig label="Teklif tutarı" value={money(n.total)} />
          {hasSaving && <Fig label="Yıllık tasarruf" value={tl(n.annualSavingTl)} />}
          {hasSaving && <Fig label="Geri ödeme" value={n.paybackYears != null ? `${num(n.paybackYears, 1)} yıl` : "—"} />}
          {hasCons && <Fig label="Tüketimi karşılama" value={`%${num(n.coveragePct)}`} />}
          <Fig label="Yıllık CO₂ azaltımı" value={`${num(n.co2Tons, 1)} ton`} />
        </div>
        <Foot company={company} page={nextPage()} />
      </Sheet>

      {/* 2. Tasarım ve üretim */}
      <Sheet>
        <Head company={company} title="Sistem tasarımı ve üretim" no={p.proposalNo} />
        <div className="mt-5 grid grid-cols-[1fr_1fr] gap-5">
          {p.images?.top ? <img src={p.images.top} alt="Panel yerleşimi (üstten)" className="h-[78mm] w-full rounded-xl object-cover" /> : <div />}
          <div>
            <h2 className="text-[13px] font-semibold">Ekipman</h2>
            <table className="mt-2 w-full text-[11px]">
              <tbody>
                <tr className="border-b border-[#e6eaf0]"><td className="py-1.5 text-[#5b6577]">Güneş paneli</td><td className="py-1.5 text-right">{n.panelCount} × {p.panel.name} ({p.panel.wp} Wp)</td></tr>
                {p.inverter && <tr className="border-b border-[#e6eaf0]"><td className="py-1.5 text-[#5b6577]">İnvertör</td><td className="py-1.5 text-right">{p.inverter.adet} × {p.inverter.name}</td></tr>}
                {p.recipeName && system !== "ongrid" && <tr className="border-b border-[#e6eaf0]"><td className="py-1.5 text-[#5b6577]">Paket</td><td className="py-1.5 text-right">{p.recipeName}</td></tr>}
                {system === "sulama" && p.sulama?.tip && <tr className="border-b border-[#e6eaf0]"><td className="py-1.5 text-[#5b6577]">Sulama</td><td className="py-1.5 text-right">{p.sulama.tip}{p.sulama.kuyuM ? `, kuyu ${p.sulama.kuyuM} m` : ""}{p.sulama.pompaDahil ? ", pompa dahil" : ", pompa hariç"}</td></tr>}
                {(p.voltage === "og" || p.term === "cift") && <tr className="border-b border-[#e6eaf0]"><td className="py-1.5 text-[#5b6577]">Bağlantı</td><td className="py-1.5 text-right">{p.voltage === "og" ? "Orta gerilim" : "Alçak gerilim"}, {p.term === "cift" ? "çift terim" : "tek terim"}</td></tr>}
                {(p.extraInverters ?? []).map((i) => <tr key={i.id} className="border-b border-[#e6eaf0]"><td className="py-1.5 text-[#5b6577]">İnvertör</td><td className="py-1.5 text-right">{i.adet} × {i.name}</td></tr>)}
                {battery > 0 && <tr className="border-b border-[#e6eaf0]"><td className="py-1.5 text-[#5b6577]">Batarya</td><td className="py-1.5 text-right">{num(battery)} kWh lityum</td></tr>}
                <tr className="border-b border-[#e6eaf0]"><td className="py-1.5 text-[#5b6577]">DC güç / AC güç</td><td className="py-1.5 text-right">{num(n.dcKwp, 2)} kWp / {n.acKw ? `${num(n.acKw, 1)} kW` : "—"}</td></tr>
                <tr><td className="py-1.5 text-[#5b6577]">Özgül üretim</td><td className="py-1.5 text-right">{num(n.specificYield)} kWh/kWp·yıl</td></tr>
              </tbody>
            </table>
            <h2 className="mt-4 text-[13px] font-semibold">Çatı yüzeyleri</h2>
            <table className="mt-2 w-full text-[10.5px]">
              <thead className="text-[#5b6577]">
                <tr className="border-b border-[#d9dee6] text-left"><th className="py-1 font-medium">Yüzey</th><th className="font-medium">Yön / eğim</th><th className="text-right font-medium">Panel</th><th className="text-right font-medium">kWp</th><th className="text-right font-medium">kWh/yıl</th></tr>
              </thead>
              <tbody>
                {n.byFace.filter((f) => f.count > 0).map((f) => {
                  const face = p.faces.find((x) => x.id === f.faceId)!;
                  return (
                    <tr key={f.faceId} className="border-b border-[#e6eaf0]">
                      <td className="py-1">{f.name}</td>
                      <td>{YON_ADI(face.azimuth)} · {isFlat(face) ? `düz, sehpa ${face.mountTilt}°` : `${face.pitch}°`}</td>
                      <td className="text-right">{f.count}</td>
                      <td className="text-right">{num(f.kwp, 2)}</td>
                      <td className="text-right">{num(f.annualKwh)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <h2 className="mt-6 text-[13px] font-semibold">Aylık üretim{hasCons ? " ve tüketim" : ""}</h2>
        <p className="text-[10px] text-[#5b6577]">Avrupa Komisyonu PVGIS uydu güneş verisiyle, her çatı yüzeyinin yönü ve eğimine göre hesaplanmıştır (%14 sistem kaybı dahil{n.shadePct > 0.05 ? `, %${num(n.shadePct, 1)} gölge kaybı dahil` : ""}).{p.realRef ? ` Benzer güçteki ${p.realRef.count} kurulumumuzun gerçek ortalaması ${num(p.realRef.specific)} kWh/kWp·yıldır.` : ""}</p>
        <div className="mt-2"><Chart prod={n.monthlyProduction} cons={hasCons ? n.monthlyKwh : n.monthlyProduction.map(() => 0)} /></div>
        {(hasCons || hasSaving) && (
          <div className="mt-3 grid grid-cols-4 gap-2.5">
            {!offGrid && <Fig label="Bugünkü aylık fatura" value={tl(n.monthlyBillTl)} />}
            {hasCons && <Fig label="Yıllık tüketim" value={`${num(n.annualKwh)} kWh`} />}
            {offGrid && hasSaving && <Fig label="Mevcut yıllık enerji gideri" value={tl(p.currentEnergyCostTl ?? 0)} />}
            {hasSaving && <Fig label="Yıllık tasarruf" value={tl(n.annualSavingTl)} />}
            {hasSaving && <Fig label="25 yılda tasarruf" value={tl(n.savings25Tl)} />}
          </div>
        )}
        <Foot company={company} page={nextPage()} />
      </Sheet>

      {/* 3. Tasarruf ve enerji akışı (tüketim girildiyse; şebekesiz sistemde akış yok) */}
      {hasPayback && (
        <Sheet>
          <Head company={company} title={hasFlow ? "Tasarruf ve enerji akışı" : "Tasarruf"} no={p.proposalNo} />
          <h2 className="mt-5 text-[13px] font-semibold">25 yıllık birikimli kazanç</h2>
          <p className="text-[10px] text-[#5b6577]">Yıllık tasarruftan yatırım bedeli düşülerek, yılda %0,5 panel verim kaybıyla hesaplanmıştır. {hike.length ? `Varsayım: ${offGrid ? "enerji" : "elektrik"} fiyatı 2. yılda %${hike[0]}, 10. yılda %${hike[hike.length - 1]} artmış olur (bugüne göre), sonra sabit kalır. Gerçek zamlar farklı olabilir.` : offGrid ? "Enerji fiyatı artışları dahil değildir." : "Elektrik zamları dahil değildir."}</p>
          <div className="mt-2"><PaybackChart data={n.cumulativeTl} /></div>
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            <Fig label={hike.length && n.paybackFlatYears != null ? `Geri ödeme (zamsız ${num(n.paybackFlatYears, 1)} yıl)` : "Geri ödeme"} value={n.paybackYears != null ? `${num(n.paybackYears, 1)} yıl` : "—"} />
            <Fig label="25 yılda toplam tasarruf" value={tl(n.savings25Tl)} />
            <Fig label="25 yıl sonunda net" value={tl(n.cumulativeTl[24] ?? 0)} />
          </div>
          {hasFlow && year && <>
          <h2 className="mt-6 text-[13px] font-semibold">Bir günde enerji akışı</h2>
          <p className="text-[10px] text-[#5b6577]">Turuncu alan güneş üretimi, mavi çizgi tüketiminiz (kW). Üretimin tüketimi aştığı saatlerde fazlası {battery > 0 ? "önce bataryaya, sonra " : ""}şebekeye verilir; diğer saatlerde {battery > 0 ? "batarya ve " : ""}şebeke devreye girer.</p>
          <div className="mt-2 grid grid-cols-2 gap-5">
            <DayCurve title="Haziran, tipik gün" day={flow(5)} />
            <DayCurve title="Aralık, tipik gün" day={flow(11)} />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2.5">
            <Fig label="Üretimin evde kullanımı" value={`%${num(year.selfUsePct)}`} />
            <Fig label="Şebekeye verilen" value={`${num(year.toGrid)} kWh`} />
            <Fig label="Şebekeden çekilen" value={`${num(year.fromGrid)} kWh`} />
            <Fig label="Batarya" value={battery > 0 ? `${num(battery)} kWh` : "Yok"} />
          </div>
          </>}
          <Foot company={company} page={nextPage()} />
        </Sheet>
      )}

      {/* Karşılaştırmalı seçenekler */}
      {options.length > 0 && (
        <Sheet>
          <Head company={company} title="Seçenekler" no={p.proposalNo} />
          <h2 className="mt-5 text-[13px] font-semibold">Size uygun seçenekler</h2>
          <p className="text-[10px] text-[#5b6577]">Aynı çatı için hazırlanan seçenekler. Tutarlar KDV dahildir; sonraki sayfalar “Önerilen” seçeneği anlatır.</p>
          <table className="mt-3 w-full text-[11px]">
            <thead>
              <tr className="border-b-2 border-[#0e1626] text-left">
                <th className="py-1.5 font-semibold" />
                {options.map((o) => <th key={o.key} className="py-1.5 font-semibold">{o.ad}</th>)}
              </tr>
            </thead>
            <tbody>
              {([
                ["Panel", (o) => o.panel],
                ["İnvertör", (o) => o.inverter],
                ["Batarya", (o) => (o.battery ? `${num(o.batteryKwh ?? 0, 1)} kWh` : "Yok")],
                ["Sistem gücü", (o) => `${num(o.kwp, 2)} kWp`],
                ["Yıllık üretim", (o) => `${num(o.annualKwh)} kWh`],
                ["Yıllık tasarruf", (o) => tl(o.savingTl)],
                ["Geri ödeme", (o) => (o.paybackYears != null ? `${num(o.paybackYears, 1)} yıl` : "—")],
                ["Teklif tutarı", (o) => money(o.total)],
              ] as [string, (o: (typeof options)[number]) => string][]).map(([label, f]) => (
                <tr key={label} className="border-b border-[#e6eaf0] align-top">
                  <td className="py-1.5 text-[#5b6577]">{label}</td>
                  {options.map((o) => <td key={o.key} className="py-1.5 pr-2">{f(o)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <Foot company={company} page={nextPage()} />
        </Sheet>
      )}

      {/* Özel sayfa */}
      {p.customPageText?.trim() && (
        <Sheet>
          <Head company={company} title={p.customPageTitle || "Ek bilgi"} no={p.proposalNo} />
          {p.customPageTitle && <h2 className="mt-5 text-[14px] font-semibold">{p.customPageTitle}</h2>}
          <p className="mt-3 whitespace-pre-line text-[11.5px] leading-relaxed text-[#3d4757]">{p.customPageText}</p>
          <Foot company={company} page={nextPage()} />
        </Sheet>
      )}

      {/* Fiyat ve koşullar */}
      <Sheet last>
        <Head company={company} title="Fiyat ve koşullar" no={p.proposalNo} />
        <table className="mt-5 w-full text-[11px]">
          <thead>
            <tr className="border-b-2 border-[#0e1626] text-left">
              <th className="py-1.5 font-semibold">Kalem</th>
              <th className="text-right font-semibold">Miktar</th>
              {showPrices && <th className="text-right font-semibold">Birim fiyat</th>}
              {showPrices && <th className="text-right font-semibold">Tutar</th>}
            </tr>
          </thead>
          <tbody>
            {p.lines.map((l) => (
              <tr key={l.id} className="border-b border-[#e6eaf0]">
                <td className="py-1.5">{l.ad}</td>
                <td className="text-right">{num(l.adet, 2)} {l.birim}</td>
                {showPrices && <td className="text-right">{money(l.birimFiyat)}</td>}
                {showPrices && <td className="text-right font-mono">{money(l.adet * l.birimFiyat)}</td>}
              </tr>
            ))}
          </tbody>
          <tfoot className="text-[11.5px]">
            <tr><td colSpan={showPrices ? 3 : 1} className="pt-2 text-right text-[#5b6577]">Ara toplam</td><td className="pt-2 text-right font-mono">{money(n.subtotal)}</td></tr>
            {p.discountTl > 0 && <tr><td colSpan={showPrices ? 3 : 1} className="text-right text-[#5b6577]">İndirim</td><td className="text-right font-mono">−{money(p.discountTl)}</td></tr>}
            <tr><td colSpan={showPrices ? 3 : 1} className="text-right text-[#5b6577]">{p.pricesIncludeVat ? "Dahil KDV (%20)" : "KDV (%20)"}</td><td className="text-right font-mono">{money(n.vat)}</td></tr>
            <tr className="text-[14px]"><td colSpan={showPrices ? 3 : 1} className="pt-1 text-right font-semibold">Genel toplam (KDV dahil)</td><td className="pt-1 text-right font-mono font-semibold">{money(n.total)}</td></tr>
          </tfoot>
        </table>
        {isUsd && p.usdTry ? <p className="mt-1 text-right text-[9.5px] text-[#5b6577]">{p.showTl ? `TCMB ${p.usdDate ?? ""} kuru ${p.usdTry} ile hesaplanmıştır. ` : ""}Ödeme günündeki Merkez Bankası kuru geçerlidir.</p> : null}

        {plan.length > 0 && (
          <div className="mt-5">
            <h3 className="text-[12px] font-semibold">Ödeme planı</h3>
            <table className="mt-1 w-full text-[10.5px]">
              <tbody>
                {plan.map((st) => (
                  <tr key={st.id} className="border-b border-[#e6eaf0]">
                    <td className="py-1">{st.ad}</td>
                    <td className="text-right">%{st.pct}</td>
                    <td className="text-right text-[#5b6577]">{st.sure}</td>
                    <td className="text-right font-mono">{money((n.total * st.pct) / 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-5 space-y-3 text-[10.5px] leading-relaxed text-[#3d4757]">
          {plan.length === 0 && <div><h3 className="text-[12px] font-semibold text-[#0e1626]">Ödeme koşulları</h3><p className="mt-1 whitespace-pre-line">{p.paymentTerms}</p></div>}
          <div><h3 className="text-[12px] font-semibold text-[#0e1626]">Teklif kapsamı</h3><p className="mt-1 whitespace-pre-line">{p.scopeNotes}{p.callLetter ? " Çağrı mektubu başvuru dosyasının hazırlanması ve takibi teklife dahildir." : ""}</p></div>
          <div><h3 className="text-[12px] font-semibold text-[#0e1626]">Garanti</h3><p className="mt-1 whitespace-pre-line">{p.warrantyNotes}</p></div>
          <p className="text-[10px] text-[#5b6577]">
            Üretim ve tasarruf değerleri; konumunuzun uzun yıllık güneş verisi, EPDK güncel elektrik tarifesi ve aylık mahsuplaşma esasına göre hesaplanmış tahminlerdir. Hava koşulları, gölgelenme ve tarife değişiklikleri sonuçları etkileyebilir. Teklif {date(p.createdAt, p.validDays)} tarihine kadar geçerlidir.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-10 text-[11px]">
          <div className="border-t border-[#0e1626] pt-2"><p className="font-semibold">{company.name}</p><p className="text-[#5b6577]">Kaşe / imza</p></div>
          <div className="border-t border-[#0e1626] pt-2"><p className="font-semibold">{p.customer.name || "Müşteri"}</p><p className="text-[#5b6577]">Onay / imza</p></div>
        </div>
        <Foot company={company} page={nextPage()} />
      </Sheet>
    </div>
  );
}
