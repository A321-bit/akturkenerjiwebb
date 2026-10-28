"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Minus, Trophy } from "lucide-react";

// Genel Bakış grafikleri. Tek seri grafikler: ziyaret = marka mavisi, talep/dönüşüm = altın
// (altın açık zeminde 3:1'in altında kaldığı için her çubukta değer etiketi yazılı).
export const BLUE = "#3f74c4";
export const GOLD = "#d4861f";

export type DayPoint = { day: string; value: number };
export type RankRow = { label: string; value: number; prev?: number; href?: string };

const fmt = (n: number) => n.toLocaleString("tr-TR");
const dayLabel = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short" });

/** Günlük seri: alan + çizgi, üzerine gelince o günün değeri. */
export function DailyArea({ data, color = BLUE, unit }: { data: DayPoint[]; color?: string; unit: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720, H = 200, P = { l: 36, r: 8, t: 12, b: 24 };
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = Math.ceil(max / 4);
  const top = step * 4;
  const x = (i: number) => P.l + (i * (W - P.l - P.r)) / Math.max(1, data.length - 1);
  const y = (v: number) => P.t + (1 - v / top) * (H - P.t - P.b);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join("");
  const area = `${line}L${x(data.length - 1)},${y(0)}L${x(0)},${y(0)}Z`;
  const h = hover != null ? data[hover] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" onMouseLeave={() => setHover(null)} role="img" aria-label={`Günlük ${unit}`}>
        {[0, 1, 2, 3, 4].map((k) => (
          <g key={k}>
            <line x1={P.l} x2={W - P.r} y1={y(k * step)} y2={y(k * step)} stroke="var(--line)" strokeWidth={1} />
            <text x={P.l - 6} y={y(k * step) + 4} textAnchor="end" fontSize={10.5} fill="var(--slate, #64748b)">{fmt(k * step)}</text>
          </g>
        ))}
        <path d={area} fill={color} opacity={0.12} />
        <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
        {data.map((d, i) =>
          i % Math.ceil(data.length / 6) === 0 || i === data.length - 1 ? (
            <text key={d.day} x={x(i)} y={H - 6} textAnchor="middle" fontSize={10.5} fill="var(--slate, #64748b)">{dayLabel(d.day)}</text>
          ) : null
        )}
        {h && (
          <>
            <line x1={x(hover!)} x2={x(hover!)} y1={P.t} y2={y(0)} stroke="var(--ink)" strokeOpacity={0.25} />
            <circle cx={x(hover!)} cy={y(h.value)} r={5} fill={color} stroke="#fff" strokeWidth={2} />
          </>
        )}
        {/* Geniş, görünmez hover alanları */}
        {data.map((d, i) => (
          <rect key={d.day} x={x(i) - (W - P.l - P.r) / data.length / 2} y={P.t} width={(W - P.l - P.r) / data.length} height={H - P.t - P.b} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
      </svg>
      {h && (
        <div className="pointer-events-none absolute top-0 rounded-lg border border-line bg-paper-raised px-2.5 py-1.5 text-[12px] shadow-sm" style={{ left: `${(x(hover!) / W) * 100}%`, transform: "translateX(-50%)" }}>
          <span className="text-slate">{dayLabel(h.day)}</span> · <b className="text-ink">{fmt(h.value)}</b> {unit}
        </div>
      )}
    </div>
  );
}

/** Sayfa yarışı: en çok görüntülenen en üstte, önceki döneme göre sıra değişimi ve büyüme. */
export function PageRace({ rows, color = BLUE, unit = "görüntüleme" }: { rows: RankRow[]; color?: string; unit?: string }) {
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGrown(true), 60);
    return () => clearTimeout(t);
  }, []);
  const max = Math.max(1, ...rows.map((r) => r.value));
  const prevRank = new Map(
    [...rows].filter((r) => (r.prev ?? 0) > 0).sort((a, b) => (b.prev ?? 0) - (a.prev ?? 0)).map((r, i) => [r.label, i])
  );
  if (!rows.length) return <p className="text-[13px] text-slate">Henüz veri yok.</p>;
  return (
    <ol className="flex flex-col gap-2.5">
      {rows.map((r, i) => {
        const before = prevRank.get(r.label);
        const move = before == null ? null : before - i;
        const change = r.prev ? Math.round(((r.value - r.prev) / r.prev) * 100) : null;
        return (
          <li key={r.label} className="group">
            <div className="flex items-center gap-2.5">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono-data text-[12.5px] font-bold ${i < 3 ? "bg-ink text-paper" : "bg-ink/5 text-slate"}`}>
                {i === 0 ? <Trophy size={14} /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-[13.5px] font-medium text-ink" title={r.label}>{r.label}</span>
                  <span className="flex shrink-0 items-center gap-2 text-[12.5px]">
                    {move == null ? (
                      <span className="rounded-full bg-sun/15 px-1.5 text-[11px] font-semibold text-sun-soft">YENİ</span>
                    ) : move > 0 ? (
                      <span className="flex items-center text-volt"><ArrowUp size={13} />{move}</span>
                    ) : move < 0 ? (
                      <span className="flex items-center text-red-600"><ArrowDown size={13} />{-move}</span>
                    ) : (
                      <Minus size={13} className="text-slate" />
                    )}
                    <b className="font-mono-data text-ink">{fmt(r.value)}</b>
                  </span>
                </div>
                <div className="mt-1 h-2.5 w-full rounded-full bg-ink/5" title={`${fmt(r.value)} ${unit}${change != null ? ` · önceki döneme göre %${change > 0 ? "+" : ""}${change}` : ""}`}>
                  <div
                    className="h-full rounded-full transition-[width] duration-1000 ease-out"
                    style={{ width: grown ? `${Math.max(2, (r.value / max) * 100)}%` : "0%", background: color, transitionDelay: `${i * 70}ms` }}
                  />
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Basit sıralı çubuk listesi (kanallar, butonlar, şehirler). Değer her satırda yazılı. */
export function BarList({ rows, color = BLUE, empty = "Henüz veri yok." }: { rows: RankRow[]; color?: string; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const total = rows.reduce((s, r) => s + r.value, 0);
  if (!rows.length) return <p className="text-[13px] text-slate">{empty}</p>;
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((r) => (
        <li key={r.label} title={`${r.label}: ${fmt(r.value)} (%${Math.round((r.value / total) * 100)})`}>
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate text-ink">{r.label}</span>
            <span className="shrink-0 font-mono-data font-semibold text-ink">
              {fmt(r.value)} <span className="font-normal text-slate">%{Math.round((r.value / total) * 100)}</span>
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-ink/5">
            <div className="h-full rounded-full" style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, background: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
