"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

type Pair = { label: string; value: number };
type Totals = Record<"activeUsers" | "sessions" | "screenPageViews" | "averageSessionDuration" | "keyEvents", number>;
type Realtime = { activeUsers: number; pages: Pair[]; cities: Pair[]; devices: Pair[] };
type Overview = {
  today: Totals;
  yesterday: Totals;
  week: Totals;
  month: Totals;
  daily: { date: string; users: number; sessions: number }[];
  pages: Pair[];
  sources: Pair[];
  cities: Pair[];
  events: Pair[];
};

const fmt = (n: number) => Math.round(n).toLocaleString("tr-TR");
const dur = (s: number) => `${Math.floor(s / 60)} dk ${Math.round(s % 60)} sn`;
const DEVICE: Record<string, string> = { mobile: "Mobil", desktop: "Masaüstü", tablet: "Tablet" };

async function load<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? `Hata ${res.status}`);
  return body as T;
}

function List({ title, rows, unit, map }: { title: string; rows: Pair[]; unit?: string; map?: (s: string) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="rounded-2xl border border-line bg-paper-raised p-5">
      <p className="text-[14px] font-semibold">{title}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-[13px] text-slate-soft">Veri yok.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.label} className="text-[13.5px]">
              <div className="flex justify-between gap-3">
                <span className="min-w-0 truncate" title={r.label}>{map ? map(r.label) : r.label || "(belirsiz)"}</span>
                <span className="shrink-0 font-semibold tabular-nums">
                  {fmt(r.value)}
                  {unit ? ` ${unit}` : ""}
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-ink/5">
                <div className="h-1.5 rounded-full bg-brand/70" style={{ width: `${(r.value / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper-raised p-5">
      <p className="text-[13px] text-slate">{label}</p>
      <p className="mt-1 font-mono-data text-[1.7rem] font-bold">{value}</p>
      {sub && <p className="text-[12.5px] text-slate-soft">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [rt, setRt] = useState<Realtime | null>(null);
  const [ov, setOv] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState("");

  const refreshRealtime = useCallback(() => {
    load<Realtime>("/api/admin/ga?tip=anlik")
      .then((d) => {
        setRt(d);
        setUpdated(new Date().toLocaleTimeString("tr-TR"));
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    let alive = true;
    load<Overview>("/api/admin/ga")
      .then((d) => alive && setOv(d))
      .catch((e) => alive && setError(e.message));
    refreshRealtime();
    const t = setInterval(refreshRealtime, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [refreshRealtime]);

  const maxDay = Math.max(1, ...(ov?.daily.map((d) => d.users) ?? [1]));

  return (
    <div className="flex max-w-6xl flex-col gap-6">
      <div>
        <p className="font-mono-data text-[11px] uppercase tracking-[0.16em] text-brand">Google Analytics</p>
        <h1 className="mt-1 font-display text-2xl font-semibold">Ziyaretçi Analitiği</h1>
        <p className="mt-1 text-[13.5px] text-slate">GA4 verisi, canlı. Anlık bölüm 30 saniyede bir yenilenir.</p>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13.5px] text-red-700">
          {error}
          {/API has not been used|disabled/i.test(error) && " → Google Cloud'da Google Analytics Data API'yi etkinleştirin."}
          {/permission|PERMISSION/i.test(error) && !/disabled/i.test(error) && " → Servis hesabının GA4 mülkünde Görüntüleyici olarak ekli olduğunu kontrol edin."}
        </p>
      )}

      <section className="rounded-2xl border border-[#2e7d6b]/30 bg-[#2e7d6b]/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 font-mono-data text-[12px] uppercase tracking-[0.14em] text-[#2e7d6b]">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#2e7d6b]" /> Şu an sitede · son 30 dakika
          </p>
          <button type="button" onClick={refreshRealtime} className="flex items-center gap-1.5 text-[12.5px] text-slate hover:text-ink">
            <RefreshCw size={14} /> {updated ? `Güncellendi ${updated}` : "Yükleniyor…"}
          </button>
        </div>
        <p className="mt-2 font-mono-data text-[2.6rem] font-bold text-[#2e7d6b]">{rt ? fmt(rt.activeUsers) : "–"}</p>
        <p className="text-[13px] text-slate">aktif kullanıcı</p>
        {rt && (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <List title="Baktıkları sayfalar" rows={rt.pages} />
            <List title="Şehirler" rows={rt.cities} />
            <List title="Cihaz" rows={rt.devices} map={(s) => DEVICE[s] ?? s} />
          </div>
        )}
      </section>

      {ov && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card label="Bugün kullanıcı" value={fmt(ov.today.activeUsers)} sub={`dün ${fmt(ov.yesterday.activeUsers)}`} />
            <Card label="Son 7 gün kullanıcı" value={fmt(ov.week.activeUsers)} sub={`${fmt(ov.week.sessions)} oturum`} />
            <Card label="Son 28 gün kullanıcı" value={fmt(ov.month.activeUsers)} sub={`${fmt(ov.month.screenPageViews)} sayfa görüntüleme`} />
            <Card label="Önemli etkinlik (7 gün)" value={fmt(ov.week.keyEvents)} sub={`ort. oturum ${dur(ov.week.averageSessionDuration)}`} />
          </div>

          <div className="rounded-2xl border border-line bg-paper-raised p-5">
            <p className="text-[14px] font-semibold">Son 28 gün · günlük kullanıcı</p>
            <div className="mt-4 flex h-40 items-end gap-[3px]">
              {ov.daily.map((d) => (
                <div key={d.date} className="group relative flex h-full flex-1 items-end">
                  <div className="w-full rounded-t bg-brand/70 group-hover:bg-brand" style={{ height: `${(d.users / maxDay) * 100}%` }} />
                  <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[11px] text-paper group-hover:block">
                    {d.date.slice(6, 8)}.{d.date.slice(4, 6)} · {d.users}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-slate-soft">
              <span>{ov.daily[0] && `${ov.daily[0].date.slice(6, 8)}.${ov.daily[0].date.slice(4, 6)}`}</span>
              <span>bugün</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <List title="En çok görüntülenen sayfalar (7 gün)" rows={ov.pages} />
            <List title="Trafik kaynakları (7 gün, oturum)" rows={ov.sources} />
            <List title="Şehirler (7 gün, kullanıcı)" rows={ov.cities} />
            <List title="Etkinlikler (7 gün)" rows={ov.events} />
          </div>
        </>
      )}
      {!ov && !error && <p className="text-[13.5px] text-slate">Veriler yükleniyor…</p>}
    </div>
  );
}
