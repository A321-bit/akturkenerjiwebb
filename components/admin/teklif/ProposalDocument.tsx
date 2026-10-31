/* eslint-disable @next/next/no-img-element -- belge görselleri data URL ve PDF çıktısına gömülür */
import qrcode from "qrcode-generator";
import { YON_ADI, isFlat } from "@/lib/teklif/geometry";
import type { Proposal, ProposalNumbers } from "@/lib/teklif/proposal";
import { meanAzimuth, simulateDay, simulateYear, type HourFlow } from "@/lib/teklif/simulate";
import { ABONE_ADLARI } from "@/lib/elektrik-tarife";
import type { QuoteSettings } from "@/lib/teklif/pricing";

// Teklif dosyası (A4): koyu zemin, güneş turuncusu ve müşterinin kendi verisinden çizilen grafikler.
// Kapaktaki güneş halkası çatının gerçek aylık üretimidir. PDF çıktısı ve müşteri linki aynı belgeyi kullanır.

export type Company = { name: string; phone: string; email: string; address: string; web: string };
export type DocReference = { id: number; ad: string; url: string; konum?: string | null; yil?: string | number | null };
/** Kapak dışı sayfalar için gereken ayarlar; maliyet içermez. */
export type DocAssets = Pick<QuoteSettings, "banks" | "hesapSahibi" | "notlar" | "garantiDisi"> & { references?: DocReference[] };

const AY = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const SUN = "#ff9a2e";
const ICE = "#58d6ff";
const LEAF = "#3fe0a0";
const MUTED = "#8f9bb3";
const tl = (n: number) => `${Math.round(n).toLocaleString("tr-TR")} TL`;
const num = (n: number, d = 0) => n.toLocaleString("tr-TR", { maximumFractionDigits: d, minimumFractionDigits: d });
const date = (iso: string, addDays = 0) => new Date(new Date(iso).getTime() + addDays * 864e5).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
const satirlar = (t?: string) => (t ?? "").split("\n").map((x) => x.trim()).filter(Boolean);

function Sheet({ children, last, bleed, final, screenOnly }: { children: React.ReactNode; last?: boolean; bleed?: boolean; final?: boolean; screenOnly?: boolean }) {
  return <section data-final={final ? "1" : undefined} className={`proposal-sheet pd-dark relative mx-auto ${bleed ? "proposal-bleed" : ""} ${last ? "" : "proposal-break"} ${screenOnly ? "print:hidden" : ""}`}>{children}</section>;
}

function Logo({ className = "h-8" }: { className?: string }) {
  return <img src="/logo.svg" alt="Aktürk Enerji" className={`${className} [filter:brightness(0)_invert(1)]`} />;
}

function Head({ index, title, lead }: { index: string; title: string; lead?: string }) {
  return (
    <header className="flex items-start justify-between gap-6">
      <div>
        <p className="font-mono-data text-[10px] tracking-[0.3em]" style={{ color: SUN }}>{index}</p>
        <h2 className="pd-title mt-1.5 font-display text-[30px] font-semibold leading-[1.08]">{title}</h2>
        {lead && <p className="mt-2 max-w-[125mm] text-[11.5px] leading-relaxed" style={{ color: MUTED }}>{lead}</p>}
      </div>
      <Logo className="mt-1 h-7 shrink-0" />
    </header>
  );
}

function Foot({ company, no, page, lat, lon }: { company: Company; no: string; page: number; lat: number; lon: number }) {
  return (
    <footer className="font-mono-data absolute bottom-[9mm] left-[16mm] right-[16mm] flex items-center justify-between border-t border-[#1d2739] pt-2 text-[8px] tracking-[0.08em]" style={{ color: "#66728a" }}>
      <span>{no}</span>
      <span>{lat.toFixed(4)}°K {lon.toFixed(4)}°D</span>
      <span>{company.phone} · {company.web}</span>
      <span style={{ color: SUN }}>{String(page).padStart(2, "0")}</span>
    </footer>
  );
}

function Stat({ label, value, note, accent }: { label: string; value: string; note?: string; accent?: boolean }) {
  return (
    <div className="pd-card px-4 py-3.5">
      <p className="text-[9.5px] uppercase tracking-[0.14em]" style={{ color: MUTED }}>{label}</p>
      <p className={`mt-1 font-display text-[21px] font-semibold leading-tight ${accent ? "pd-sun-text" : ""}`}>{value}</p>
      {note && <p className="mt-0.5 text-[9.5px]" style={{ color: MUTED }}>{note}</p>}
    </div>
  );
}

function Qr({ url, size = 96 }: { url: string; size?: number }) {
  const q = qrcode(0, "M");
  q.addData(url);
  q.make();
  const n = q.getModuleCount();
  let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
  return (
    <div className="rounded-xl bg-white p-2" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${n} ${n}`} className="h-full w-full" shapeRendering="crispEdges"><path d={d} fill="#060a14" /></svg>
    </div>
  );
}

// Güneş halkası: 144 ışın, uzunluğu o tarihteki aylık üretimden. Yaz ayları tepede, tıpkı öğle güneşi gibi.
function SolarPortal({ prod, img, kwp }: { prod: number[]; img?: string; kwp: number }) {
  const C = 330;
  const R = 196;
  const max = Math.max(1, ...prod);
  // Ay ortaları arasında yumuşak geçiş; Haziran-Temmuz arası tepeye (-90°) gelir.
  const angleOf = (monthPos: number) => ((monthPos - 6) / 12) * 360 - 90;
  const rays = Array.from({ length: 144 }, (_, i) => {
    const pos = i / 12;
    const a = Math.floor(pos) % 12;
    const b = (a + 1) % 12;
    const t = pos - Math.floor(pos);
    const v = ((prod[a] ?? 0) * (1 - t) + (prod[b] ?? 0) * t) / max;
    const ang = (angleOf(pos) * Math.PI) / 180;
    const len = 8 + v * 86;
    return { x1: C + Math.cos(ang) * (R + 12), y1: C + Math.sin(ang) * (R + 12), x2: C + Math.cos(ang) * (R + 12 + len), y2: C + Math.sin(ang) * (R + 12 + len), v };
  });
  const labels = AY.map((m, i) => {
    const r = (angleOf(i) * Math.PI) / 180;
    return { m, x: C + Math.cos(r) * (R + 118), y: C + Math.sin(r) * (R + 118) + 4 };
  });
  return (
    <div className="relative mx-auto aspect-square w-full">
      <svg viewBox={`0 0 ${C * 2} ${C * 2}`} className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="pd-halo"><stop offset="52%" stopColor="#ff8a1f" stopOpacity="0.42" /><stop offset="78%" stopColor="#ff5a36" stopOpacity="0.1" /><stop offset="100%" stopColor="#ff5a36" stopOpacity="0" /></radialGradient>
        </defs>
        <circle cx={C} cy={C} r={C} fill="url(#pd-halo)" />
        <circle cx={C} cy={C} r={R + 106} fill="none" stroke="#25324a" strokeDasharray="1 7" />
        {rays.map((r, i) => <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke={r.v > 0.72 ? "#ffd166" : r.v > 0.4 ? "#ff9a2e" : "#ff6a2b"} strokeWidth={3.4} strokeLinecap="round" />)}
        {labels.map((l) => <text key={l.m} x={l.x} y={l.y} textAnchor="middle" fontSize="13" fill={MUTED} fontFamily="monospace">{l.m}</text>)}
        <circle cx={C} cy={C} r={R + 4} fill="none" stroke="#ffb45c" strokeWidth={2} />
      </svg>
      <div className="absolute overflow-hidden rounded-full" style={{ left: `${((C - R) / (C * 2)) * 100}%`, top: `${((C - R) / (C * 2)) * 100}%`, width: `${(R / C) * 100}%`, height: `${(R / C) * 100}%` }}>
        {img ? (
          <img src={img} alt="Çatınızın üstten görünümü" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center" style={{ background: "radial-gradient(circle at 50% 42%, #ffe29a 0%, #ff9a2e 46%, #d9431f 100%)" }}>
            <p className="font-display text-[46px] font-semibold leading-none text-[#160b03]">{num(kwp, 1)}</p>
            <p className="font-mono-data text-[12px] tracking-[0.2em] text-[#160b03]">kWp</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EnergyChart({ prod, cons }: { prod: number[]; cons: number[] }) {
  const W = 640;
  const H = 330;
  const max = Math.max(1, ...prod, ...cons) * 1.08;
  const bw = W / 12;
  const hasCons = cons.some((c) => c > 0);
  const y = (v: number) => H - (v / max) * H;
  const line = cons.map((c, i) => `${i ? "L" : "M"}${(i + 0.5) * bw} ${y(c)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H + 26}`} className="w-full">
      <defs><linearGradient id="pd-bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffd166" /><stop offset="55%" stopColor="#ff9a2e" /><stop offset="100%" stopColor="#ff5a36" stopOpacity="0.35" /></linearGradient></defs>
      {[0.25, 0.5, 0.75, 1].map((f) => <line key={f} x1={0} x2={W} y1={H - H * f} y2={H - H * f} stroke="#1d2739" />)}
      {prod.map((p, i) => (
        <g key={i}>
          <rect x={i * bw + bw * 0.2} y={y(p)} width={bw * 0.6} height={Math.max(1, H - y(p))} rx={6} fill="url(#pd-bar)" />
          <text x={(i + 0.5) * bw} y={y(p) - 6} textAnchor="middle" fontSize="10" fill="#d7deea" fontFamily="monospace">{Math.round(p).toLocaleString("tr-TR")}</text>
          <text x={(i + 0.5) * bw} y={H + 18} textAnchor="middle" fontSize="11" fill={MUTED}>{AY[i]}</text>
        </g>
      ))}
      {hasCons && <path d={line} fill="none" stroke={ICE} strokeWidth={2.2} strokeLinejoin="round" />}
      {hasCons && cons.map((c, i) => <circle key={i} cx={(i + 0.5) * bw} cy={y(c)} r={3.4} fill="#060a14" stroke={ICE} strokeWidth={2} />)}
    </svg>
  );
}

function Gauge({ pct, label }: { pct: number; label: string }) {
  const r = 70;
  const len = Math.PI * r;
  const on = (Math.min(100, Math.max(0, pct)) / 100) * len;
  return (
    <div className="pd-card flex flex-col items-center justify-center px-4 py-3">
      <svg viewBox="0 0 180 100" className="w-full max-w-[150px]">
        <defs><linearGradient id="pd-g"><stop offset="0%" stopColor="#ff5a36" /><stop offset="100%" stopColor="#ffd166" /></linearGradient></defs>
        <path d={`M20 90 A${r} ${r} 0 0 1 160 90`} fill="none" stroke="#1d2739" strokeWidth={14} strokeLinecap="round" />
        <path d={`M20 90 A${r} ${r} 0 0 1 160 90`} fill="none" stroke="url(#pd-g)" strokeWidth={14} strokeLinecap="round" strokeDasharray={`${on} ${len}`} />
        <text x="90" y="84" textAnchor="middle" fontSize="28" fontWeight="600" fill="#f4f6fb">%{num(pct)}</text>
      </svg>
      <p className="mt-1 text-center text-[9.5px] uppercase tracking-[0.14em]" style={{ color: MUTED }}>{label}</p>
    </div>
  );
}

// 25 yıllık yol: sıfır çizgisinin altı yatırım, üstü kazanç. Dönüş noktası işaretlenir.
function PaybackCurve({ data, payback }: { data: number[]; payback: number | null }) {
  const W = 640;
  const H = 210;
  const hi = Math.max(0, ...data);
  const lo = Math.min(0, ...data);
  const span = hi - lo || 1;
  const y = (v: number) => 8 + (H - 8) * (1 - (v - lo) / span);
  const x = (i: number) => (i / Math.max(1, data.length - 1)) * W;
  const zero = y(0);
  const line = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const px = payback != null ? (Math.min(payback, data.length - 1) / Math.max(1, data.length - 1)) * W : null;
  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full">
      <defs>
        <linearGradient id="pd-up" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={LEAF} stopOpacity="0.55" /><stop offset="100%" stopColor={LEAF} stopOpacity="0.02" /></linearGradient>
        <clipPath id="pd-above"><rect x={0} y={0} width={W} height={zero} /></clipPath>
        <clipPath id="pd-below"><rect x={0} y={zero} width={W} height={H + 10 - zero} /></clipPath>
      </defs>
      <path d={`${line} L${W} ${zero} L0 ${zero}Z`} fill="url(#pd-up)" clipPath="url(#pd-above)" />
      <path d={`${line} L${W} ${zero} L0 ${zero}Z`} fill="#ff5a36" fillOpacity={0.16} clipPath="url(#pd-below)" />
      <line x1={0} x2={W} y1={zero} y2={zero} stroke="#3a475f" strokeDasharray="3 5" />
      <path d={line} fill="none" stroke={LEAF} strokeWidth={2.6} clipPath="url(#pd-above)" />
      <path d={line} fill="none" stroke="#ff7a4d" strokeWidth={2.6} clipPath="url(#pd-below)" />
      {px != null && (
        <g>
          <circle cx={px} cy={zero} r={13} fill={SUN} fillOpacity={0.22} />
          <circle cx={px} cy={zero} r={6} fill={SUN} />
          <text x={Math.max(0, px - 40)} y={zero - 24} fontSize="13" fontWeight="600" fill="#ffd166">Yatırım kendini amorti eder</text>
        </g>
      )}
      {[1, 5, 10, 15, 20, 25].map((yr) => <text key={yr} x={x(yr - 1)} y={H + 18} fontSize="11" fill={MUTED} textAnchor={yr === 1 ? "start" : yr === 25 ? "end" : "middle"}>{yr}. yıl</text>)}
    </svg>
  );
}

function DayCurve({ title, day }: { title: string; day: HourFlow[] }) {
  const W = 300;
  const H = 92;
  const max = Math.max(0.5, ...day.map((d) => Math.max(d.pv, d.load)));
  const x = (h: number) => (h / 23) * W;
  const y = (v: number) => H - (v / max) * H;
  const path = (f: (d: HourFlow) => number) => day.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(f(d)).toFixed(1)}`).join(" ");
  return (
    <div className="pd-card px-4 py-3">
      <p className="text-[10.5px] font-semibold">{title}</p>
      <svg viewBox={`0 0 ${W} ${H + 14}`} className="mt-1.5 w-full">
        <line x1={0} x2={W} y1={H} y2={H} stroke="#2a364d" />
        <path d={`${path((d) => d.pv)} L${W} ${H} L0 ${H}Z`} fill={SUN} fillOpacity={0.26} />
        <path d={path((d) => d.pv)} fill="none" stroke={SUN} strokeWidth={1.8} />
        <path d={path((d) => d.load)} fill="none" stroke={ICE} strokeWidth={1.8} />
        {[0, 6, 12, 18].map((h) => <text key={h} x={x(h)} y={H + 12} fontSize="8.5" fill={MUTED} textAnchor={h ? "middle" : "start"}>{String(h).padStart(2, "0")}:00</text>)}
      </svg>
    </div>
  );
}

function Legend({ items }: { items: [string, string][] }) {
  return <div className="flex flex-wrap gap-4 text-[10px]" style={{ color: MUTED }}>{items.map(([c, t]) => <span key={t} className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: c }} />{t}</span>)}</div>;
}

export default function ProposalDocument({ p, n, company, assets, attachments }: { p: Proposal; n: ProposalNumbers; company: Company; assets?: DocAssets; attachments?: { ad: string }[] }) {
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
  const headline = system === "offgrid" ? "Şebekeden bağımsız enerjiniz." : system === "sulama" ? "Sulamanızın gücü güneşten." : "Çatınızdaki enerji santrali.";
  const hasFlow = !offGrid && hasCons && n.annualProduction > 0 && !p.shortReport;
  const hasPayback = hasFlow || (offGrid && hasSaving && !p.shortReport);
  const options = p.optionMode === "uc" ? (p.options ?? []) : [];
  const [lat, lon] = p.site.center;
  const azimuth = meanAzimuth(n.byFace.map((f) => ({ azimuth: p.faces.find((x) => x.id === f.faceId)?.azimuth ?? 0, weight: f.annualKwh })));
  const battery = p.batteryKwh ?? 0;
  const flow = (month: number) => simulateDay({ month, monthlyPv: n.monthlyProduction[month], monthlyLoad: n.monthlyKwh[month], abone: p.abone, lat, azimuth, batteryKwh: battery });
  const year = hasFlow ? simulateYear({ monthlyPv: n.monthlyProduction, monthlyLoad: n.monthlyKwh, abone: p.abone, lat, azimuth, batteryKwh: battery }) : null;
  const liveUrl = p.shareToken ? `https://${company.web}/teklif/${p.shareToken}` : null;
  const refs = assets?.references ?? [];
  const refPages = Array.from({ length: Math.ceil(refs.length / 6) }, (_, i) => refs.slice(i * 6, i * 6 + 6));

  let page = 1;
  let section = 0;
  const nextPage = () => ++page;
  const nextSection = () => String(++section).padStart(2, "0");
  const foot = () => <Foot company={company} no={p.proposalNo} page={nextPage()} lat={lat} lon={lon} />;
  const equipment: [string, string][] = [
    ["Güneş paneli", `${n.panelCount} × ${p.panel.name}`],
    ...(p.inverter ? [["İnvertör", `${p.inverter.adet} × ${p.inverter.name}`] as [string, string]] : []),
    ...(p.extraInverters ?? []).map((i) => ["İnvertör", `${i.adet} × ${i.name}`] as [string, string]),
    ...(p.recipeName && offGrid ? [["Paket", p.recipeName] as [string, string]] : []),
    ...(system === "sulama" && p.sulama?.tip ? [["Sulama", `${p.sulama.tip}${p.sulama.kuyuM ? `, kuyu ${p.sulama.kuyuM} m` : ""}${p.sulama.pompaDahil ? ", pompa dahil" : ", pompa hariç"}`] as [string, string]] : []),
    ...(battery > 0 ? [["Batarya", `${num(battery, 1)} kWh lityum`] as [string, string]] : []),
    ...(p.voltage === "og" || p.term === "cift" ? [["Bağlantı", `${p.voltage === "og" ? "Orta gerilim" : "Alçak gerilim"}, ${p.term === "cift" ? "çift terim" : "tek terim"}`] as [string, string]] : []),
    ["DC / AC güç", `${num(n.dcKwp, 2)} kWp / ${n.acKw ? `${num(n.acKw, 1)} kW` : "—"}`],
    ["Özgül üretim", `${num(n.specificYield)} kWh/kWp·yıl`],
  ];

  return (
    <div className="proposal-doc space-y-6 print:space-y-0">
      {/* Kapak */}
      <Sheet bleed>
        <div className="absolute inset-0" style={{ background: "radial-gradient(120% 70% at 50% 38%, #1a1626 0%, #0a0e1b 52%, #060a14 100%)" }} />
        <div className="relative flex h-full flex-col px-[15mm] pb-[12mm] pt-[13mm]">
          <div className="flex items-center justify-between">
            <Logo />
            <div className="font-mono-data text-right text-[9.5px] tracking-[0.12em]" style={{ color: MUTED }}>
              <p>{p.proposalNo}</p>
              <p>{date(p.createdAt)}</p>
            </div>
          </div>
          <div className="mx-auto mt-[4mm] w-[172mm]"><SolarPortal prod={n.monthlyProduction} img={p.images?.top ?? p.images?.perspective} kwp={n.dcKwp} /></div>
          <p className="mt-[3mm] text-center text-[9px] tracking-[0.05em]" style={{ color: MUTED }}>Işınlar, bu konumda beklenen aylık üretiminizi gösterir.</p>
          <div className="mt-auto">
            <p className="font-mono-data text-[10px] uppercase tracking-[0.3em]" style={{ color: SUN }}>Sayın {p.customer.name || "Müşterimiz"}</p>
            <h1 className="pd-title mt-2 font-display text-[42px] font-semibold leading-[1.02]">{headline}</h1>
            <p className="mt-2 text-[12px]" style={{ color: MUTED }}>Size özel güneş enerjisi teklifi · {reportName}</p>
            <div className="mt-4 flex items-end justify-between gap-6">
              <div className="flex gap-8">
                <div><p className="pd-sun-text font-display text-[30px] font-semibold leading-none">{num(n.dcKwp, 2)}</p><p className="mt-1 text-[10px] tracking-[0.08em]" style={{ color: MUTED }}>kWp sistem gücü</p></div>
                <div><p className="pd-sun-text font-display text-[30px] font-semibold leading-none">{num(n.annualProduction)}</p><p className="mt-1 text-[10px] tracking-[0.08em]" style={{ color: MUTED }}>kWh yıllık üretim</p></div>
                {hasSaving && n.paybackYears != null && <div><p className="pd-sun-text font-display text-[30px] font-semibold leading-none">{num(n.paybackYears, 1)}</p><p className="mt-1 text-[10px] tracking-[0.08em]" style={{ color: MUTED }}>yılda geri ödeme</p></div>}
              </div>
              {liveUrl && (
                <div className="flex shrink-0 items-center gap-3">
                  <p className="w-[28mm] text-right text-[9.5px] leading-snug" style={{ color: MUTED }}>Okutun, çatınızı üç boyutlu gezin.</p>
                  <Qr url={liveUrl} size={82} />
                </div>
              )}
            </div>
          </div>
        </div>
      </Sheet>

      {/* Sisteminiz */}
      <Sheet>
        <Head index={nextSection()} title="Sisteminiz" lead={`${[p.customer.address, p.customer.mahalle, p.customer.district, p.customer.province, p.customer.ada && p.customer.parsel ? `Ada/Parsel: ${p.customer.ada}/${p.customer.parsel}` : null].filter(Boolean).join(", ")}${p.customer.phone ? ` · ${p.customer.phone}` : ""}`} />
        {p.images?.perspective && (
          <div className="relative mt-5 overflow-hidden rounded-2xl">
            <img src={p.images.perspective} alt="Sistemin üç boyutlu görünümü" className="h-[88mm] w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-20" style={{ background: "linear-gradient(to top, #060a14, transparent)" }} />
          </div>
        )}
        <div className="mt-4 grid grid-cols-4 gap-2.5">
          <Stat label="Sistem gücü" value={`${num(n.dcKwp, 2)} kWp`} accent />
          <Stat label="Panel" value={`${n.panelCount} adet`} />
          <Stat label="Yıllık üretim" value={`${num(n.annualProduction)} kWh`} />
          <Stat label="CO₂ azaltımı" value={`${num(n.co2Tons, 1)} ton`} note="yılda" />
        </div>
        <div className="mt-5 grid grid-cols-[1.25fr_1fr] gap-6">
          <div>
            <h3 className="text-[12px] font-semibold">Ekipman</h3>
            <dl className="mt-1.5 text-[10.5px]">
              {equipment.map(([k, v], i) => <div key={`${k}${i}`} className="flex justify-between gap-5 border-b border-[#1d2739] py-1.5"><dt className="shrink-0" style={{ color: MUTED }}>{k}</dt><dd className="text-right">{v}</dd></div>)}
              {!offGrid && <div className="flex justify-between gap-5 py-1.5"><dt style={{ color: MUTED }}>Abonelik</dt><dd>{ABONE_ADLARI[p.abone]}</dd></div>}
            </dl>
          </div>
          <div>
            <h3 className="text-[12px] font-semibold">Çatı yüzeyleri</h3>
            <div className="mt-1.5 space-y-1.5">
              {n.byFace.filter((f) => f.count > 0).map((f) => {
                const face = p.faces.find((x) => x.id === f.faceId)!;
                return (
                  <div key={f.faceId} className="pd-card px-3 py-2 text-[10px]">
                    <div className="flex justify-between font-semibold"><span>{f.name}</span><span className="font-mono-data">{num(f.annualKwh)} kWh/yıl</span></div>
                    <p className="mt-0.5" style={{ color: MUTED }}>{YON_ADI(face.azimuth)} · {isFlat(face) ? `düz, sehpa ${face.mountTilt}°` : `${face.pitch}°`} · {f.count} panel · {num(f.kwp, 2)} kWp</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {foot()}
      </Sheet>

      {/* Üretim */}
      <Sheet>
        <Head index={nextSection()} title="Güneşten gelen enerji" lead={`Avrupa Komisyonu PVGIS uydu güneş verisiyle, her çatı yüzeyinin yönü ve eğimine göre hesaplanmıştır (%14 sistem kaybı dahil${n.shadePct > 0.05 ? `, %${num(n.shadePct, 1)} gölge kaybı dahil` : ""}).${p.realRef ? ` Benzer güçteki ${p.realRef.count} kurulumumuzun gerçek ortalaması ${num(p.realRef.specific)} kWh/kWp·yıldır.` : ""}`} />
        <div className="pd-card mt-5 px-5 pb-3 pt-5">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[9.5px] uppercase tracking-[0.14em]" style={{ color: MUTED }}>Yıllık üretim</p>
              <p className="pd-sun-text font-display text-[42px] font-semibold leading-none">{num(n.annualProduction)} <span className="text-[16px]">kWh</span></p>
            </div>
            <Legend items={hasCons ? [[SUN, "Güneş üretimi (kWh)"], [ICE, "Tüketiminiz (kWh)"]] : [[SUN, "Güneş üretimi (kWh)"]]} />
          </div>
          <EnergyChart prod={n.monthlyProduction} cons={hasCons ? n.monthlyKwh : n.monthlyProduction.map(() => 0)} />
        </div>
        {(hasCons || hasSaving) && (
          <div className="mt-4 grid grid-cols-[150px_1fr] gap-2.5">
            {hasCons ? <Gauge pct={n.coveragePct} label="Tüketimi karşılama" /> : <div />}
            <div className="grid grid-cols-2 gap-2.5">
              {!offGrid && <Stat label="Bugünkü aylık fatura" value={tl(n.monthlyBillTl)} />}
              {hasCons && <Stat label="Yıllık tüketim" value={`${num(n.annualKwh)} kWh`} />}
              {offGrid && hasSaving && <Stat label="Mevcut yıllık enerji gideri" value={tl(p.currentEnergyCostTl ?? 0)} />}
              {hasSaving && <Stat label="İlk yıl tasarruf" value={tl(n.annualSavingTl)} accent />}
              {hasSaving && <Stat label="25 yılda tasarruf" value={tl(n.savings25Tl)} accent />}
            </div>
          </div>
        )}
        {foot()}
      </Sheet>

      {/* Yatırım yolculuğu */}
      {hasPayback && (
        <Sheet>
          <Head index={nextSection()} title="Yatırımınızın 25 yılı" lead={`Yıllık tasarruftan yatırım bedeli düşülerek, yılda %0,5 panel verim kaybıyla hesaplanmıştır. ${hike.length ? `Varsayım: ${offGrid ? "enerji" : "elektrik"} fiyatı 2. yılda %${hike[0]}, 10. yılda %${hike[hike.length - 1]} artmış olur (bugüne göre), sonra sabit kalır. Gerçek zamlar farklı olabilir.` : offGrid ? "Enerji fiyatı artışları dahil değildir." : "Elektrik zamları dahil değildir."}`} />
          <div className="pd-card mt-5 px-5 py-4"><PaybackCurve data={n.cumulativeTl} payback={n.paybackYears} /></div>
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            <Stat label="Geri ödeme" value={n.paybackYears != null ? `${num(n.paybackYears, 1)} yıl` : "—"} note={hike.length && n.paybackFlatYears != null ? `Zamsız ${num(n.paybackFlatYears, 1)} yıl` : undefined} accent />
            <Stat label="25 yılda toplam tasarruf" value={tl(n.savings25Tl)} />
            <Stat label="25 yıl sonunda net" value={tl(n.cumulativeTl[24] ?? 0)} accent />
          </div>
          {hasFlow && year && (
            <>
              <h3 className="mt-6 font-display text-[17px] font-semibold">Bir günde enerji akışı</h3>
              <p className="mt-1 text-[10.5px] leading-relaxed" style={{ color: MUTED }}>Üretimin tüketimi aştığı saatlerde fazlası {battery > 0 ? "önce bataryaya, sonra " : ""}şebekeye verilir; diğer saatlerde {battery > 0 ? "batarya ve " : ""}şebeke devreye girer.</p>
              <div className="mt-2"><Legend items={[[SUN, "Güneş üretimi"], [ICE, "Tüketiminiz (kW)"]]} /></div>
              <div className="mt-2 grid grid-cols-2 gap-2.5">
                <DayCurve title="Haziran, tipik gün" day={flow(5)} />
                <DayCurve title="Aralık, tipik gün" day={flow(11)} />
              </div>
              <div className="mt-2.5 grid grid-cols-4 gap-2.5">
                <Stat label="Üretimin evde kullanımı" value={`%${num(year.selfUsePct)}`} />
                <Stat label="Şebekeye verilen" value={`${num(year.toGrid)} kWh`} />
                <Stat label="Şebekeden çekilen" value={`${num(year.fromGrid)} kWh`} />
                <Stat label="Batarya" value={battery > 0 ? `${num(battery)} kWh` : "Yok"} />
              </div>
            </>
          )}
          {foot()}
        </Sheet>
      )}

      {/* Karşılaştırmalı seçenekler */}
      {options.length > 0 && (
        <Sheet>
          <Head index={nextSection()} title="Size uygun seçenekler" lead="Aynı çatı için hazırlanan seçenekler. Tutarlar KDV dahildir; sonraki sayfalar “Önerilen” seçeneği anlatır." />
          <div className="mt-6 grid gap-3" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
            {options.map((o) => (
              <div key={o.key} className={`pd-card p-4 ${o.ad === "Önerilen" ? "pd-card-sun" : ""}`}>
                <p className="font-display text-[17px] font-semibold">{o.ad}</p>
                <p className="pd-sun-text mt-2 font-display text-[24px] font-semibold leading-tight">{money(o.total)}</p>
                <dl className="mt-3 text-[10px]">
                  {([["Panel", o.panel], ["İnvertör", o.inverter], ["Batarya", o.battery ? `${num(o.batteryKwh ?? 0, 1)} kWh` : "Yok"], ["Sistem gücü", `${num(o.kwp, 2)} kWp`], ["Yıllık üretim", `${num(o.annualKwh)} kWh`], ["Yıllık tasarruf", tl(o.savingTl)], ["Geri ödeme", o.paybackYears != null ? `${num(o.paybackYears, 1)} yıl` : "—"]] as [string, string][]).map(([k, v]) => (
                    <div key={k} className="border-t border-[#1d2739] py-1.5"><dt style={{ color: MUTED }}>{k}</dt><dd className="mt-0.5">{v}</dd></div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          {foot()}
        </Sheet>
      )}

      {/* Özel sayfa */}
      {p.customPageText?.trim() && (
        <Sheet>
          <Head index={nextSection()} title={p.customPageTitle || "Ek bilgi"} />
          <p className="mt-6 whitespace-pre-line text-[12px] leading-relaxed text-[#cdd5e3]">{p.customPageText}</p>
          {foot()}
        </Sheet>
      )}

      {/* Fiyat ve koşullar */}
      <Sheet last={!assets}>
        <Head index={nextSection()} title="Yatırım tutarı" lead={`Teklif ${date(p.createdAt, p.validDays)} tarihine kadar geçerlidir.`} />
        <div className="pd-card pd-card-sun mt-5 flex items-end justify-between px-5 py-4">
          <div>
            <p className="text-[9.5px] uppercase tracking-[0.14em]" style={{ color: MUTED }}>Genel toplam (KDV dahil)</p>
            <p className="pd-sun-text font-display text-[38px] font-semibold leading-none">{money(n.total)}</p>
          </div>
          <div className="font-mono-data text-right text-[10px] leading-relaxed" style={{ color: MUTED }}>
            <p>Ara toplam {money(n.subtotal)}</p>
            {p.discountTl > 0 && <p>İndirim −{money(p.discountTl)}</p>}
            <p>{p.pricesIncludeVat ? "Dahil KDV (%20)" : "KDV (%20)"} {money(n.vat)}</p>
          </div>
        </div>
        {isUsd && p.usdTry ? <p className="mt-1.5 text-right text-[9px]" style={{ color: MUTED }}>{p.showTl ? `TCMB ${p.usdDate ?? ""} kuru ${p.usdTry} ile hesaplanmıştır. ` : ""}TL ödemede ödeme günündeki Ziraat Bankası efektif satış kuru geçerlidir.</p> : null}

        <table className="mt-4 w-full text-[10.5px]">
          <thead><tr className="border-b border-[#2a364d] text-left text-[9.5px] uppercase tracking-[0.1em]" style={{ color: MUTED }}><th className="py-1.5 font-medium">Kalem</th><th className="text-right font-medium">Miktar</th>{showPrices && <th className="text-right font-medium">Birim fiyat</th>}{showPrices && <th className="text-right font-medium">Tutar</th>}</tr></thead>
          <tbody>
            {p.lines.map((l) => (
              <tr key={l.id} className="border-b border-[#1d2739]">
                <td className="py-1.5 pr-3">{l.ad}</td>
                <td className="whitespace-nowrap text-right" style={{ color: MUTED }}>{num(l.adet, 2)} {l.birim}</td>
                {showPrices && <td className="whitespace-nowrap pl-3 text-right" style={{ color: MUTED }}>{money(l.birimFiyat)}</td>}
                {showPrices && <td className="font-mono-data whitespace-nowrap pl-3 text-right">{money(l.adet * l.birimFiyat)}</td>}
              </tr>
            ))}
          </tbody>
        </table>

        {plan.length > 0 ? (
          <div className="mt-5">
            <h3 className="text-[12px] font-semibold">Ödeme planı</h3>
            <div className="mt-2 flex gap-1 overflow-hidden rounded-lg">
              {plan.map((st, i) => <div key={st.id} className="h-2" style={{ width: `${st.pct}%`, background: ["#ffd166", "#ffb347", "#ff9a2e", "#ff7a3a", "#ff5a36"][i % 5] }} />)}
            </div>
            <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(plan.length, 5)}, minmax(0, 1fr))` }}>
              {plan.map((st) => (
                <div key={st.id} className="text-[9.5px]">
                  <p className="font-display text-[14px] font-semibold">%{st.pct}</p>
                  <p className="leading-snug">{st.ad}</p>
                  <p className="mt-0.5" style={{ color: MUTED }}>{st.sure}</p>
                  <p className="font-mono-data mt-0.5 text-[#ffd166]">{money((n.total * st.pct) / 100)}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-5 text-[10.5px] leading-relaxed text-[#cdd5e3]"><h3 className="text-[12px] font-semibold text-white">Ödeme koşulları</h3><p className="mt-1 whitespace-pre-line">{p.paymentTerms}</p></div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-5 text-[10px] leading-relaxed text-[#cdd5e3]">
          <div><h3 className="text-[12px] font-semibold text-white">Teklif kapsamı</h3><p className="mt-1 whitespace-pre-line">{p.scopeNotes}{p.callLetter ? " Çağrı mektubu başvuru dosyasının hazırlanması ve takibi teklife dahildir." : ""}</p></div>
          <div><h3 className="text-[12px] font-semibold text-white">Garanti</h3><p className="mt-1 whitespace-pre-line">{p.warrantyNotes}</p></div>
        </div>
        <p className="mt-3 text-[9px] leading-relaxed" style={{ color: MUTED }}>Üretim ve tasarruf değerleri; konumunuzun uzun yıllık güneş verisi, EPDK güncel elektrik tarifesi ve aylık mahsuplaşma esasına göre hesaplanmış tahminlerdir. Hava koşulları, gölgelenme ve tarife değişiklikleri sonuçları etkileyebilir.</p>
        <div className="mt-6 grid grid-cols-2 gap-10 text-[10.5px]">
          <div className="border-t border-[#3a475f] pt-2"><p className="font-semibold">{company.name}</p><p style={{ color: MUTED }}>Kaşe / imza</p></div>
          <div className="border-t border-[#3a475f] pt-2"><p className="font-semibold">{p.customer.name || "Müşteri"}</p><p style={{ color: MUTED }}>Onay / imza</p></div>
        </div>
        {foot()}
      </Sheet>

      {assets && (
        <>
          {/* Şartlar ve ödeme */}
          <Sheet>
            <Head index={nextSection()} title="Şartlar ve ödeme" />
            <div className="mt-6 grid grid-cols-2 gap-6 text-[10.5px] leading-relaxed text-[#cdd5e3]">
              <div><h3 className="text-[12px] font-semibold text-white">Önemli notlar</h3><ul className="mt-2 space-y-1.5">{satirlar(assets.notlar).map((x) => <li key={x} className="flex gap-2"><span style={{ color: SUN }}>—</span><span>{x}</span></li>)}</ul></div>
              <div><h3 className="text-[12px] font-semibold text-white">Garanti dışı unsurlar</h3><ul className="mt-2 space-y-1.5">{satirlar(assets.garantiDisi).map((x) => <li key={x} className="flex gap-2"><span style={{ color: SUN }}>—</span><span>{x}</span></li>)}</ul></div>
            </div>
            <h3 className="mt-7 text-[12px] font-semibold">Banka hesapları</h3>
            {assets.hesapSahibi && <p className="mt-1 text-[10.5px]" style={{ color: MUTED }}>{assets.hesapSahibi}</p>}
            <div className="mt-2.5 space-y-2">
              {(assets.banks ?? []).map((b) => (
                <div key={b.iban} className="pd-card flex items-center justify-between gap-4 px-4 py-3 text-[10.5px]">
                  <div><p className="font-semibold">{b.banka}</p><p style={{ color: MUTED }}>{b.sube}</p></div>
                  <p className="font-mono-data text-[12px] tracking-[0.04em] text-[#ffd166]">{b.iban}</p>
                </div>
              ))}
            </div>
            {foot()}
          </Sheet>

          {/* Neden Aktürk */}
          <Sheet>
            <Head index={nextSection()} title="Arkanızdaki ekip" lead="Aktürk Enerji Teknolojileri olarak, 2017 yılından bu yana Güneş ve Rüzgar Enerjisi alanında edindiğimiz saha tecrübesi ve mühendislik birikimiyle, bireysel ve ticari projeler için güvenilir enerji çözümleri sunuyoruz." />
            <div className="mt-6 grid grid-cols-3 gap-3">
              {([["2017", "yılından beri sahada"], ["1500+", "tamamlanan kurulum"], ["12+ MW", "toplam kurulu güç"]] as const).map(([v, l]) => (
                <div key={l} className="pd-card px-4 py-5 text-center"><p className="pd-sun-text font-display text-[34px] font-semibold leading-none">{v}</p><p className="mt-2 text-[10.5px]" style={{ color: MUTED }}>{l}</p></div>
              ))}
            </div>
            <div className="mt-6 space-y-2.5">
              {([
                ["Mühendislik odaklı yaklaşım", "Her proje, bulunduğu lokasyona göre özel olarak hazırlanır."],
                ["Kaliteli ekipman seçimi", "Uluslararası standartlara sahip, sertifikalı ve uzun ömürlü ekipmanlarla sistem performansı güvence altına alınır."],
                ["Anahtar teslim kurulum", "Deneyimli montaj ekibimiz, projelerinizi zamanında ve eksiksiz bir şekilde anahtar teslim olarak hayata geçirir."],
                ["Uzun vadeli destek", "Satış sonrası destek, garanti ve servis süreçlerinde yatırımınızın her aşamasında yanınızdayız."],
              ] as const).map(([t, d], i) => (
                <div key={t} className="pd-card flex items-center gap-4 px-4 py-3">
                  <p className="font-mono-data text-[20px]" style={{ color: SUN }}>{String(i + 1).padStart(2, "0")}</p>
                  <div><p className="text-[12px] font-semibold">{t}</p><p className="mt-0.5 text-[10.5px] leading-relaxed" style={{ color: MUTED }}>{d}</p></div>
                </div>
              ))}
            </div>
            {foot()}
          </Sheet>

          {/* Referanslar */}
          {refPages.map((rows) => (
            <Sheet key={rows[0].id}>
              <Head index={nextSection()} title="Gerçek çatılar, gerçek projeler" />
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                {rows.map((r, i) => (
                  <figure key={r.id} className={`relative overflow-hidden rounded-xl ${i === 0 ? "col-span-2 h-[74mm]" : i === rows.length - 1 && i % 2 === 1 ? "col-span-2 h-[50mm]" : "h-[50mm]"}`}>
                    <img src={r.url} alt={r.ad} className="h-full w-full object-cover" />
                    <figcaption className="absolute inset-x-0 bottom-0 px-3 pb-2 pt-8" style={{ background: "linear-gradient(to top, rgba(6,10,20,.92), transparent)" }}>
                      <p className="text-[10.5px] font-semibold leading-snug text-white">{r.ad}</p>
                      <p className="font-mono-data mt-0.5 text-[8.5px]" style={{ color: "#c3ccda" }}>{[r.konum, r.yil].filter(Boolean).join(" · ")}</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
              {foot()}
            </Sheet>
          ))}

          {/* Datasheet kapağı: yalnız indirilen PDF'te, ardından ürün dokümanları gelir */}
          {attachments && attachments.length > 0 && (
            <Sheet screenOnly>
              <Head index={nextSection()} title="Teknik dokümanlar" lead="Teklifinizdeki ürünlerin üretici belgeleri sonraki sayfalardadır." />
              <div className="mt-6 space-y-2">
                {attachments.map((a, i) => <div key={a.ad} className="pd-card flex items-center gap-4 px-4 py-3 text-[11.5px]"><span className="font-mono-data" style={{ color: SUN }}>{String(i + 1).padStart(2, "0")}</span>{a.ad}</div>)}
              </div>
              {foot()}
            </Sheet>
          )}

          {/* Kapanış */}
          <Sheet last bleed final>
            <div className="absolute inset-0" style={{ background: "radial-gradient(90% 46% at 50% 100%, #ff8a1f 0%, #d9431f 28%, #3a1420 58%, #060a14 100%)" }} />
            <div className="relative flex h-full flex-col items-center px-[18mm] pt-[34mm] text-center">
              <Logo className="h-10" />
              <h2 className="pd-title mt-[26mm] font-display text-[46px] font-semibold leading-[1.05]">Teşekkür ederiz.</h2>
              <p className="mt-4 max-w-[130mm] text-[13px] leading-relaxed text-[#cdd5e3]">Sorularınız için mühendislerimiz bir telefon uzağınızda. Teklif {date(p.createdAt, p.validDays)} tarihine kadar geçerlidir.</p>
              <div className="mt-9 flex items-center gap-7">
                {liveUrl && <Qr url={liveUrl} size={104} />}
                <div className="text-left text-[12px] leading-relaxed">
                  <p className="font-display text-[20px] font-semibold">{company.phone}</p>
                  <p>{company.email}</p>
                  <p>{company.web}</p>
                  <p className="mt-1 max-w-[80mm] text-[10px] text-[#cdd5e3]">{company.address}</p>
                </div>
              </div>
              <p className="font-mono-data absolute bottom-[12mm] text-[9px] tracking-[0.12em] text-white/70">{p.proposalNo} · {date(p.createdAt)}</p>
            </div>
          </Sheet>
        </>
      )}
    </div>
  );
}
