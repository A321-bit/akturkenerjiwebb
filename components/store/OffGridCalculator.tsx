"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BatteryCharging, Gauge, MessageCircle, Minus, Plus, Sun, Trash2, Zap } from "lucide-react";
import { calculate, DEVICE_PRESETS, pickPackage, type Device, type OffGridPackage, type Season } from "@/lib/offgrid-calc";
import { whatsappLink, SITE_URL } from "@/lib/data";
import { formatTL } from "@/lib/store";
import { trackEvent } from "@/lib/track";
import { trackGa4WhatsappClick } from "@/lib/ga4";

const fmt = (n: number, d = 1) => n.toLocaleString("tr-TR", { maximumFractionDigits: d });

// Başlangıçta seçili gelen tipik bağ evi cihazları.
const START: Record<string, number> = { led: 6, buzdolabi: 1, tv: 1, telefon: 2 };

export default function OffGridCalculator({ packages, whatsappNumber }: { packages: OffGridPackage[]; whatsappNumber: string }) {
  const [devices, setDevices] = useState<Device[]>(() => DEVICE_PRESETS.map((d) => ({ ...d, qty: START[d.id] ?? 0 })));
  const [season, setSeason] = useState<Season>("yil");
  const [autonomy, setAutonomy] = useState(1);
  const [together, setTogether] = useState(false);
  const [threePhase, setThreePhase] = useState(false);
  const [custom, setCustom] = useState({ name: "", watt: "", hours: "" });

  const r = useMemo(() => calculate(devices, season, autonomy, together), [devices, season, autonomy, together]);
  const pkg = pickPackage(packages, r.inverterKw, threePhase);
  const biggest = [...packages].filter((p) => p.threePhase === threePhase).sort((a, b) => b.kw - a.kw)[0];
  const selected = devices.filter((d) => d.qty > 0);

  function update(id: string, patch: Partial<Device>) {
    setDevices((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }
  function addCustom() {
    const watt = Number(custom.watt.replace(",", "."));
    const hours = Number(custom.hours.replace(",", "."));
    if (!custom.name.trim() || !(watt > 0) || !(hours > 0)) return;
    setDevices((ds) => [...ds, { id: "ozel-" + Date.now(), name: custom.name.trim(), watt, hours, qty: 1 }]);
    setCustom({ name: "", watt: "", hours: "" });
  }

  const message = [
    "Merhaba, off grid paket hesaplama sonucumu gönderiyorum:",
    "",
    ...selected.map((d) => `• ${d.name}: ${d.qty} adet × ${d.watt} W × günde ${fmt(d.hours)} saat`),
    "",
    `Kullanım: ${season === "yil" ? "yıl boyu" : "yalnızca yaz ayları"}${threePhase ? ", trifaze (380 V)" : ""}`,
    `Günlük tüketim: ~${fmt(r.dailyKwh)} kWh | En yüksek güç: ~${fmt(r.peakW / 1000)} kW`,
    `Panel: ~${fmt(r.pvKwp)} kWp | Batarya: ~${fmt(r.batteryKwh)} kWh`,
    pkg ? `Önerilen paket: ${pkg.name}` : "Önerilen paket: proje bazlı",
    "",
    `Hesaplama: ${SITE_URL}/magaza/off-grid-hesaplama`,
  ].join("\n");

  const input = "w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 text-[13.5px] text-ink outline-none focus:border-brand";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
      {/* Cihaz listesi */}
      <div className="rounded-2xl border border-line bg-paper-raised">
        <div className="grid grid-cols-[1fr_96px_70px] gap-2 border-b border-line px-4 py-2.5 text-[12px] font-semibold text-slate sm:grid-cols-[1fr_80px_110px_80px]">
          <span>Cihaz</span>
          <span className="hidden sm:block">Güç (W)</span>
          <span>Adet</span>
          <span>Saat/gün</span>
        </div>
        <ul>
          {devices.map((d) => (
            <li
              key={d.id}
              className={`grid grid-cols-[1fr_96px_70px] items-center gap-2 border-b border-line px-4 py-2 last:border-0 sm:grid-cols-[1fr_80px_110px_80px] ${d.qty > 0 ? "bg-sun/5" : ""}`}
            >
              <span className="min-w-0">
                <span className="block text-[14px] font-medium text-ink">{d.name}</span>
                {d.note && <span className="block text-[11.5px] text-slate-soft">{d.note}</span>}
                <span className="block text-[11.5px] text-slate-soft sm:hidden">{d.watt} W</span>
              </span>
              <input
                aria-label={`${d.name} gücü (W)`}
                inputMode="numeric"
                value={d.watt}
                onChange={(e) => update(d.id, { watt: Number(e.target.value.replace(/\D/g, "")) || 0 })}
                className={`${input} hidden sm:block`}
              />
              <span className="flex items-center gap-1">
                <button type="button" aria-label="Azalt" onClick={() => update(d.id, { qty: Math.max(0, d.qty - 1) })} className="rounded-full border border-line p-1 text-slate hover:border-ink">
                  <Minus size={13} />
                </button>
                <span className="w-7 text-center text-[14px] font-semibold text-ink">{d.qty}</span>
                <button type="button" aria-label="Arttır" onClick={() => update(d.id, { qty: d.qty + 1 })} className="rounded-full border border-line p-1 text-slate hover:border-ink">
                  <Plus size={13} />
                </button>
              </span>
              <span className="flex items-center gap-1">
                <input
                  aria-label={`${d.name} günlük çalışma saati`}
                  inputMode="decimal"
                  value={String(d.hours).replace(".", ",")}
                  onChange={(e) => update(d.id, { hours: Math.min(24, Number(e.target.value.replace(",", ".")) || 0) })}
                  className={input}
                />
                {d.id.startsWith("ozel-") && (
                  <button type="button" aria-label="Cihazı sil" onClick={() => setDevices((ds) => ds.filter((x) => x.id !== d.id))} className="p-1 text-slate-soft hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-end gap-2 border-t border-line bg-paper px-4 py-3">
          <span className="w-full text-[12.5px] font-semibold text-slate">Listede olmayan bir cihaz ekleyin</span>
          <input placeholder="Cihaz adı" value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} className={`${input} min-w-[150px] flex-1`} />
          <input placeholder="Güç (W)" inputMode="numeric" value={custom.watt} onChange={(e) => setCustom({ ...custom, watt: e.target.value })} className={`${input} w-24`} />
          <input placeholder="Saat/gün" inputMode="decimal" value={custom.hours} onChange={(e) => setCustom({ ...custom, hours: e.target.value })} className={`${input} w-24`} />
          <button type="button" onClick={addCustom} className="rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-paper hover:bg-sun hover:text-ink">
            Ekle
          </button>
        </div>
      </div>

      {/* Sonuç */}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-28">
        <div className="rounded-2xl border border-line bg-paper-raised p-5">
          <p className="text-[13px] font-semibold text-slate">Kullanım şekli</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                ["yil", "Yıl boyu"],
                ["yaz", "Sadece yaz ayları"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setSeason(k)}
                className={`rounded-full border px-3 py-2 text-[13px] font-semibold ${season === k ? "border-ink bg-ink text-paper" : "border-line text-slate hover:border-ink"}`}
              >
                {l}
              </button>
            ))}
          </div>
          <label className="mt-3 flex items-center justify-between gap-2 text-[13px] text-slate">
            Güneşsiz geçebilecek gün
            <select value={autonomy} onChange={(e) => setAutonomy(Number(e.target.value))} className="rounded-lg border border-line bg-paper px-2 py-1 text-[13px] text-ink">
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n} gün
                </option>
              ))}
            </select>
          </label>
          <label className="mt-2 flex items-start gap-2 text-[13px] text-slate">
            <input type="checkbox" checked={together} onChange={(e) => setTogether(e.target.checked)} className="mt-0.5" />
            Ağır cihazları (çamaşır makinesi, ütü, kettle…) aynı anda kullanacağım
          </label>
          <label className="mt-2 flex items-start gap-2 text-[13px] text-slate">
            <input type="checkbox" checked={threePhase} onChange={(e) => setThreePhase(e.target.checked)} className="mt-0.5" />
            Trifaze (380 V) cihazım var
          </label>
        </div>

        <div className="rounded-2xl bg-ink p-5 text-paper">
          <p className="font-mono-data text-[11.5px] uppercase tracking-[0.16em] text-sun-soft">Hesap sonucu</p>
          <dl className="mt-3 grid grid-cols-2 gap-3">
            <Stat icon={<Zap size={15} />} label="Günlük tüketim" value={`${fmt(r.dailyKwh)} kWh`} />
            <Stat icon={<Gauge size={15} />} label="En yüksek güç" value={`${fmt(r.peakW / 1000)} kW`} />
            <Stat icon={<Sun size={15} />} label="Panel gücü" value={`~${fmt(r.pvKwp)} kWp`} sub={`≈ ${r.panelCount} × 600 W panel`} />
            <Stat icon={<BatteryCharging size={15} />} label="Lityum batarya" value={`~${fmt(r.batteryKwh)} kWh`} />
          </dl>

          <div className="mt-4 border-t border-paper/15 pt-4">
            {selected.length === 0 ? (
              <p className="text-[13.5px] text-paper/75">Hesap için en az bir cihaz seçin.</p>
            ) : pkg ? (
              <>
                <p className="text-[12.5px] text-paper/70">Önerilen paket</p>
                <Link href={pkg.href} className="mt-0.5 block font-display text-[18px] font-semibold leading-tight text-sun-soft hover:underline">
                  {pkg.name}
                </Link>
                <p className="mt-1 text-[14px] font-semibold">{pkg.price != null ? `${formatTL(pkg.price)} (KDV dahil)` : "Fiyat için WhatsApp'tan sorun"}</p>
                <p className="mt-1 text-[12px] text-paper/60">Paket, gereken invertör gücüne (~{fmt(r.inverterKw)} kW) göre seçildi. Panel ve batarya miktarını uzmanımız hesabınıza göre netleştirir.</p>
              </>
            ) : (
              <p className="text-[13.5px] text-paper/80">
                Gereken güç ({fmt(r.inverterKw)} kW) en büyük {threePhase ? "trifaze" : "monofaze"} paketimizi{biggest ? ` (${biggest.name})` : ""} aşıyor;
                {threePhase ? " sistemi projeye özel tasarlıyoruz." : " trifaze paketlere bakın ya da bize yazın."}
              </p>
            )}
          </div>

          <a
            href={whatsappLink(whatsappNumber, message)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackEvent("click", "/magaza/off-grid-hesaplama", "store_whatsapp_calculator");
              trackGa4WhatsappClick();
            }}
            className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 text-[14.5px] font-bold text-white transition-transform hover:scale-[1.02]"
          >
            <MessageCircle size={18} fill="currentColor" />
            Sonucu WhatsApp&apos;tan gönder
          </a>
        </div>

        {(r.heaters.length > 0 || r.hasMotor) && (
          <div className="flex gap-2.5 rounded-2xl border border-sun/40 bg-sun/10 p-4 text-[12.5px] leading-relaxed text-ink">
            <AlertTriangle size={17} className="mt-0.5 shrink-0 text-[#b7791f]" />
            <div className="flex flex-col gap-1.5">
              {r.heaters.length > 0 && (
                <p>
                  <strong>{r.heaters.join(", ")}</strong> çok enerji harcar; off grid sistemde ısınma ve su ısıtma için güneşli su ısıtıcısı ya da
                  odun/tüp gibi alternatifler çoğu zaman daha ekonomiktir.
                </p>
              )}
              {r.hasMotor && <p>Pompa, buzdolabı ve klima gibi motorlu cihazlar çalışmaya başlarken birkaç kat güç çeker; paketi seçerken bunu da hesaba katıyoruz.</p>}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[12px] text-paper/65">
        <span className="text-sun-soft">{icon}</span>
        {label}
      </dt>
      <dd className="mt-0.5 font-display text-[18px] font-semibold">{value}</dd>
      {sub && <dd className="text-[11.5px] text-paper/55">{sub}</dd>}
    </div>
  );
}
