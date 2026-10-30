"use client";

import { useEffect, useMemo, useState } from "react";
import { Pause, Play } from "lucide-react";
import { meanAzimuth, simulateDay, simulateYear, suggestBattery, type HourFlow } from "@/lib/teklif/simulate";
import type { Proposal, ProposalNumbers } from "@/lib/teklif/proposal";

// Saatlik enerji akışı: panel, ev, şebeke ve batarya arasındaki akış animasyonu, günlük grafik
// ve bataryalı/bataryasız yıllık karşılaştırma. Değerler tipik gün tahminidir.

const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const C = { pv: "#d4861f", load: "#3f74c4", grid: "#6b7687", bat: "#2f9e6e" };
const kw = (v: number) => `${v.toLocaleString("tr-TR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })} kW`;
const n0 = (v: number) => Math.round(v).toLocaleString("tr-TR");

function Flow({ d, on, color, label, lx, ly }: { d: string; on: number; color: string; label: string; lx: number; ly: number }) {
  const active = on > 0.02;
  // Akış büyüdükçe çizgi kalınlaşır ve hızlanır.
  const dur = Math.max(0.5, 2.6 - on * 0.35);
  return (
    <g>
      <path d={d} fill="none" stroke="#e3e7ed" strokeWidth={4} strokeLinecap="round" />
      {active && <path d={d} fill="none" stroke={color} strokeWidth={Math.min(9, 3 + on * 0.8)} strokeLinecap="round" strokeDasharray="2 16" style={{ animation: `enerji-akis ${dur}s linear infinite` }} />}
      {active && (
        <text x={lx} y={ly} textAnchor="middle" fontSize="12.5" fontWeight="600" fill="#0e1626" stroke="#fff" strokeWidth={4} paintOrder="stroke">
          {label}
        </text>
      )}
    </g>
  );
}

function Node({ x, y, title, value, color }: { x: number; y: number; title: string; value: string; color: string }) {
  return (
    <g>
      <rect x={x - 62} y={y - 27} width={124} height={54} rx={12} fill="#fff" stroke={color} strokeWidth={2} />
      <text x={x} y={y - 6} textAnchor="middle" fontSize="12" fill="#5b6577">{title}</text>
      <text x={x} y={y + 14} textAnchor="middle" fontSize="15" fontWeight="700" fill="#0e1626">{value}</text>
    </g>
  );
}

function DayChart({ day, hour, onHour }: { day: HourFlow[]; hour: number; onHour: (h: number) => void }) {
  const W = 620;
  const H = 170;
  const max = Math.max(0.5, ...day.map((d) => Math.max(d.pv, d.load)));
  const x = (h: number) => (h / 23) * W;
  const y = (v: number) => H - (v / max) * H;
  const line = (f: (d: HourFlow) => number) => day.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(f(d)).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full touch-none" onPointerMove={(e) => e.buttons && onHour(Math.round(((e.clientX - e.currentTarget.getBoundingClientRect().left) / e.currentTarget.getBoundingClientRect().width) * 23))} onPointerDown={(e) => onHour(Math.round(((e.clientX - e.currentTarget.getBoundingClientRect().left) / e.currentTarget.getBoundingClientRect().width) * 23))} role="img" aria-label="Saatlik üretim ve tüketim grafiği">
      {[0.5, 1].map((f) => <line key={f} x1={0} x2={W} y1={H - H * f} y2={H - H * f} stroke="#e6eaf0" />)}
      <line x1={0} x2={W} y1={H} y2={H} stroke="#c6ccd6" />
      <path d={`${line((d) => d.pv)} L${W} ${H} L0 ${H}Z`} fill={C.pv} fillOpacity={0.18} />
      <path d={line((d) => d.pv)} fill="none" stroke={C.pv} strokeWidth={2} />
      <path d={line((d) => d.load)} fill="none" stroke={C.load} strokeWidth={2} />
      <line x1={x(hour)} x2={x(hour)} y1={0} y2={H} stroke="#0e1626" strokeDasharray="3 3" />
      <circle cx={x(hour)} cy={y(day[hour].pv)} r={4.5} fill={C.pv} stroke="#fff" strokeWidth={2} />
      <circle cx={x(hour)} cy={y(day[hour].load)} r={4.5} fill={C.load} stroke="#fff" strokeWidth={2} />
      {[0, 6, 12, 18, 23].map((h) => <text key={h} x={x(h)} y={H + 16} textAnchor={h === 0 ? "start" : h === 23 ? "end" : "middle"} fontSize="11" fill="#5b6577">{String(h).padStart(2, "0")}:00</text>)}
    </svg>
  );
}

export default function EnergyFlow({ p, n, onBattery }: { p: Proposal; n: ProposalNumbers; onBattery?: (kwh: number) => void }) {
  const [month, setMonth] = useState(5);
  const [hour, setHour] = useState(13);
  const [playing, setPlaying] = useState(false);
  const hasLoad = n.annualKwh > 0;
  const lat = p.site.center[0];
  const azimuth = useMemo(() => meanAzimuth(n.byFace.map((f) => ({ azimuth: p.faces.find((x) => x.id === f.faceId)?.azimuth ?? 0, weight: f.annualKwh }))), [n.byFace, p.faces]);
  const suggested = hasLoad ? suggestBattery(n.monthlyKwh, p.abone) : 10;
  const battery = p.batteryKwh ?? 0;

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setHour((h) => (h + 1) % 24), 700);
    return () => clearInterval(t);
  }, [playing]);

  const day = useMemo(() => simulateDay({ month, monthlyPv: n.monthlyProduction[month], monthlyLoad: n.monthlyKwh[month], abone: p.abone, lat, azimuth, batteryKwh: battery }), [month, n.monthlyProduction, n.monthlyKwh, p.abone, lat, azimuth, battery]);
  const compareKwh = battery || suggested;
  const year = useMemo(() => {
    const args = { monthlyPv: n.monthlyProduction, monthlyLoad: n.monthlyKwh, abone: p.abone, lat, azimuth };
    return { off: simulateYear({ ...args, batteryKwh: 0 }), on: simulateYear({ ...args, batteryKwh: compareKwh }) };
  }, [n.monthlyProduction, n.monthlyKwh, p.abone, lat, azimuth, compareKwh]);

  if (n.annualProduction <= 0) return null;
  const h = day[hour];
  const dayPv = day.reduce((s, d) => s + d.pv, 0);
  const dayLoad = day.reduce((s, d) => s + d.load, 0);

  return (
    <section className="rounded-2xl border border-line bg-paper-raised p-5">
      <style>{`@keyframes enerji-akis{to{stroke-dashoffset:-18}}`}</style>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Saatlik enerji akışı</h3>
          <p className="text-[12.5px] text-slate">{AYLAR[month]} ayının tipik bir günü için tahmin: günde {n0(dayPv)} kWh üretim{hasLoad ? `, ${n0(dayLoad)} kWh tüketim` : ""}.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} aria-label="Ay" className="rounded-lg border border-line bg-paper px-2 py-1.5 text-[13px]">
            {AYLAR.map((a, i) => <option key={a} value={i}>{a}</option>)}
          </select>
          <button onClick={() => setPlaying((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[13px] font-semibold text-paper">
            {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? "Durdur" : "Oynat"}
          </button>
          <span className="font-mono-data text-[15px] font-semibold">{String(hour).padStart(2, "0")}:00</span>
        </div>
      </div>

      {!hasLoad && <p className="mt-3 rounded-lg bg-sun/10 p-3 text-[13px]">Tüketim ve şebeke akışı için tüketim bilgisi gerekir.</p>}

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <svg viewBox="0 0 560 300" className="w-full" role="img" aria-label="Panel, ev, şebeke ve batarya arasındaki enerji akışı">
          <Flow d="M110 75 L450 75" on={h.direct} color={C.pv} label={kw(h.direct)} lx={280} ly={66} />
          <Flow d="M110 75 L110 225" on={h.toGrid} color={C.pv} label={kw(h.toGrid)} lx={70} ly={155} />
          <Flow d="M172 225 L450 75" on={h.fromGrid} color={C.grid} label={kw(h.fromGrid)} lx={250} ly={165} />
          {battery > 0 && <Flow d="M110 75 L450 225" on={h.toBattery} color={C.bat} label={kw(h.toBattery)} lx={345} ly={172} />}
          {battery > 0 && <Flow d="M450 225 L450 75" on={h.fromBattery} color={C.bat} label={kw(h.fromBattery)} lx={500} ly={155} />}
          <Node x={110} y={75} title="Güneş panelleri" value={kw(h.pv)} color={C.pv} />
          <Node x={450} y={75} title="Tüketim" value={kw(h.load)} color={C.load} />
          <Node x={110} y={225} title={h.toGrid > 0.02 ? "Şebekeye" : h.fromGrid > 0.02 ? "Şebekeden" : "Şebeke"} value={kw(h.toGrid > 0.02 ? h.toGrid : h.fromGrid)} color={C.grid} />
          {battery > 0 && <Node x={450} y={225} title={`Batarya ${n0(battery)} kWh`} value={`%${n0(h.soc * 100)} dolu`} color={C.bat} />}
        </svg>
        <div>
          <DayChart day={day} hour={hour} onHour={setHour} />
          <div className="mt-1 flex flex-wrap gap-4 text-[12px] text-slate">
            <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: C.pv }} /> Güneş üretimi</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: C.load }} /> Tüketim</span>
            <span>Grafiğe dokunarak saat seçebilirsiniz.</span>
          </div>
          <input type="range" min={0} max={23} value={hour} onChange={(e) => setHour(Number(e.target.value))} aria-label="Saat" className="mt-2 w-full accent-brand" />
        </div>
      </div>

      {hasLoad && onBattery && (
        <div className="mt-5 border-t border-line pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="font-semibold">Batarya karşılaştırması</h4>
            <label className="flex items-center gap-2 text-[13px]">
              Teklifteki batarya
              <input type="number" min={0} step={1} value={battery} onChange={(e) => onBattery(Math.max(0, Number(e.target.value)))} className="w-20 rounded-lg border border-line bg-paper px-2 py-1 text-right" />
              kWh
              {battery !== suggested && <button onClick={() => onBattery(suggested)} className="font-semibold text-brand hover:underline">Öneri: {suggested} kWh</button>}
            </label>
          </div>
          <table className="mt-3 w-full max-w-2xl text-[13px]">
            <thead className="text-slate">
              <tr className="border-b border-line text-left">
                <th className="py-1.5 font-medium">Yıllık tahmin</th>
                <th className="text-right font-medium">Bataryasız</th>
                <th className="text-right font-medium">{n0(compareKwh)} kWh bataryalı</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line"><td className="py-1.5">Üretimin evde kullanılan payı</td><td className="text-right font-mono-data">%{n0(year.off.selfUsePct)}</td><td className="text-right font-mono-data font-semibold">%{n0(year.on.selfUsePct)}</td></tr>
              <tr className="border-b border-line"><td className="py-1.5">Tüketimin güneşten karşılanan payı</td><td className="text-right font-mono-data">%{n0(year.off.independencePct)}</td><td className="text-right font-mono-data font-semibold">%{n0(year.on.independencePct)}</td></tr>
              <tr className="border-b border-line"><td className="py-1.5">Şebekeden çekilen</td><td className="text-right font-mono-data">{n0(year.off.fromGrid)} kWh</td><td className="text-right font-mono-data font-semibold">{n0(year.on.fromGrid)} kWh</td></tr>
              <tr><td className="py-1.5">Şebekeye verilen</td><td className="text-right font-mono-data">{n0(year.off.toGrid)} kWh</td><td className="text-right font-mono-data font-semibold">{n0(year.on.toGrid)} kWh</td></tr>
            </tbody>
          </table>
          <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-slate">Aylık mahsuplaşmada fazla üretim şebeke üzerinden faturadan düşüldüğü için bataryanın asıl faydası elektrik kesintisinde çalışma ve şebekeye bağımlılığı azaltmadır; yalnız tasarruf için genellikle gerekli değildir. Bu tablo tipik gün tahminidir.</p>
        </div>
      )}
    </section>
  );
}
