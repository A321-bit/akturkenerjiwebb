"use client";

import { useState } from "react";
import Link from "next/link";
import { BatteryCharging, CheckCircle2, Gauge, Loader2, MessageCircle, Minus, Plus, Sun, Trash2, UserRound, Zap } from "lucide-react";
import { calculate, DEVICE_PRESETS, pickPackage, type CalcResult, type Device, type OffGridPackage, type Season } from "@/lib/offgrid-calc";
import { whatsappLink, SITE_URL } from "@/lib/data";
import { formatTL } from "@/lib/store";
import { trackEvent } from "@/lib/track";
import { trackGa4Lead, trackGa4WhatsappClick, trackGoogleAdsLead } from "@/lib/ga4";
import { trackMetaLead } from "@/lib/meta-pixel";
import { buildLeadAttributionFields } from "@/lib/attribution";
import { TURKISH_PROVINCES } from "@/lib/turkish-provinces";
import KvkkNotice from "@/components/KvkkNotice";

// Off grid paket talebi: müşteri bilgileri + cihaz/adet/saat. Hesap ve paket
// önerisi müşteri gönderdikten sonra gösterilir; aynı anda talep admin'e
// kaydedilir ve sonuç WhatsApp mesajı olarak açılır.

const PAGE = "/magaza/off-grid-hesaplama";
const NEED = "Off grid paket hesaplama";
const fmt = (n: number, d = 1) => n.toLocaleString("tr-TR", { maximumFractionDigits: d });

// Başlangıçta seçili gelen tipik bağ evi cihazları.
const START: Record<string, number> = { led: 6, buzdolabi: 1, tv: 1, telefon: 2 };

type Result = { r: CalcResult; pkg: OffGridPackage | null; message: string };

export default function OffGridCalculator({ packages, whatsappNumber }: { packages: OffGridPackage[]; whatsappNumber: string }) {
  const [contact, setContact] = useState({ name: "", phone: "", province: "Ankara", district: "" });
  const [devices, setDevices] = useState<Device[]>(() => DEVICE_PRESETS.map((d) => ({ ...d, qty: START[d.id] ?? 0 })));
  const [season, setSeason] = useState<Season>("yil");
  const [threePhase, setThreePhase] = useState(false);
  const [custom, setCustom] = useState({ name: "", watt: "", hours: "" });
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

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

  function submit() {
    const selected = devices.filter((d) => d.qty > 0 && d.hours > 0);
    if (contact.name.trim().length < 3) return fail("Lütfen adınızı ve soyadınızı yazın.");
    if (contact.phone.replace(/\D/g, "").length < 10) return fail("Lütfen geçerli bir telefon numarası yazın.");
    if (contact.district.trim().length < 2) return fail("Lütfen ilçenizi yazın.");
    if (selected.length === 0) return setError("Lütfen kullanacağınız en az bir cihaz seçin.");
    setError("");

    const r = calculate(selected, season, 1);
    const pkg = pickPackage(packages, r.inverterKw, threePhase);
    const message = [
      "Merhaba, off grid paket hesaplama sonucumu gönderiyorum:",
      "",
      `Ad Soyad: ${contact.name.trim()}`,
      `Telefon: ${contact.phone.trim()}`,
      `Konum: ${contact.province} / ${contact.district.trim()}`,
      "",
      ...selected.map((d) => `• ${d.name}: ${d.qty} adet, günde ${fmt(d.hours)} saat`),
      "",
      `Kullanım: ${season === "yil" ? "yıl boyu" : "yalnızca yaz ayları"}${threePhase ? ", trifaze (380 V)" : ""}`,
      `Günlük tüketim: ~${fmt(r.dailyKwh)} kWh | En yüksek güç: ~${fmt(r.peakW / 1000)} kW`,
      `Panel: ~${fmt(r.pvKwp)} kWp | Batarya: ~${fmt(r.batteryKwh)} kWh`,
      `Önerilen paket: ${pkg ? pkg.name : "proje bazlı"}`,
      "",
      `Hesaplama: ${SITE_URL}${PAGE}`,
    ].join("\n");

    // WhatsApp hemen açılır (açılır pencere engeline takılmasın); talep arka planda kaydedilir.
    window.open(whatsappLink(whatsappNumber, message), "_blank", "noopener,noreferrer");
    setSending(true);
    fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        needType: NEED,
        fullname: contact.name.trim(),
        phone: contact.phone.trim(),
        province: `${contact.province} / ${contact.district.trim()}`,
        source: "offgrid_calculator",
        notes: message,
        ...buildLeadAttributionFields(PAGE),
      }),
    })
      .catch(() => {})
      .finally(() => setSending(false));
    trackEvent("click", PAGE, "lead_form_submit");
    trackEvent("click", PAGE, "store_whatsapp_calculator");
    trackMetaLead(NEED);
    trackGa4Lead(NEED);
    trackGoogleAdsLead();
    trackGa4WhatsappClick();
    setResult({ r, pkg, message });
    setTimeout(() => document.getElementById("sonuc")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function fail(msg: string) {
    setError(msg);
    document.getElementById("musteri-bilgileri")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (result) {
    const { r, pkg, message } = result;
    return (
      <section id="sonuc" className="scroll-mt-32 flex flex-col gap-5">
        <div className="rounded-2xl bg-ink p-6 text-paper sm:p-8">
          <p className="flex items-center gap-2 text-[14px] font-semibold text-[#7ee2a8]">
            <CheckCircle2 size={18} /> Talebiniz alındı{sending ? "…" : ""} Uzmanımız sizi arayacak.
          </p>
          <p className="mt-4 text-[13px] text-paper/65">Size önerdiğimiz paket</p>
          {pkg ? (
            <>
              <Link href={pkg.href} className="mt-1 block font-display text-[24px] font-semibold leading-tight text-sun-soft hover:underline">
                {pkg.name}
              </Link>
              <p className="mt-1 text-[16px] font-semibold">{pkg.price != null ? `${formatTL(pkg.price)} (KDV dahil)` : "Fiyatını WhatsApp'tan iletiyoruz"}</p>
            </>
          ) : (
            <p className="mt-1 font-display text-[20px] font-semibold text-sun-soft">Size özel proje bazlı sistem</p>
          )}
          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-paper/15 pt-5 sm:grid-cols-4">
            <Stat icon={<Zap size={15} />} label="Günlük tüketim" value={`${fmt(r.dailyKwh)} kWh`} />
            <Stat icon={<Gauge size={15} />} label="En yüksek güç" value={`${fmt(r.peakW / 1000)} kW`} />
            <Stat icon={<Sun size={15} />} label="Panel gücü" value={`~${fmt(r.pvKwp)} kWp`} />
            <Stat icon={<BatteryCharging size={15} />} label="Lityum batarya" value={`~${fmt(r.batteryKwh)} kWh`} />
          </dl>
          <a
            href={whatsappLink(whatsappNumber, message)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 text-[15px] font-bold text-white transition-transform hover:scale-[1.02] sm:w-fit sm:px-8"
          >
            <MessageCircle size={18} fill="currentColor" />
            WhatsApp mesajı açılmadıysa buraya dokunun
          </a>
          {r.heaters.length > 0 && (
            <p className="mt-4 text-[12.5px] leading-relaxed text-paper/70">
              Not: {r.heaters.join(", ")} çok enerji harcar; ısınma ve su ısıtma için güneşli su ısıtıcısı ya da tüp/odun gibi alternatifleri
              birlikte değerlendireceğiz.
            </p>
          )}
        </div>
        <button type="button" onClick={() => setResult(null)} className="self-start text-[13.5px] font-semibold text-brand hover:underline">
          ← Cihazları değiştirip yeniden hesapla
        </button>
      </section>
    );
  }

  const field = "w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[14.5px] text-ink outline-none focus:border-brand";
  const small = "w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 text-[13.5px] text-ink outline-none focus:border-brand";
  const chip = (on: boolean) =>
    `rounded-full border px-4 py-2 text-[13.5px] font-semibold ${on ? "border-ink bg-ink text-paper" : "border-line text-slate hover:border-ink"}`;

  return (
    <div className="flex flex-col gap-6">
      <section id="musteri-bilgileri" className="scroll-mt-32 rounded-2xl border border-line bg-paper-raised p-5 sm:p-6">
        <p className="flex items-center gap-2 font-display text-[17px] font-semibold text-ink">
          <UserRound size={19} className="text-brand" /> 1. Bilgileriniz
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input aria-label="Ad Soyad" placeholder="Ad Soyad" autoComplete="name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className={field} />
          <input aria-label="Telefon" placeholder="Telefon (05xx xxx xx xx)" type="tel" inputMode="tel" autoComplete="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className={field} />
          <select aria-label="İl" value={contact.province} onChange={(e) => setContact({ ...contact, province: e.target.value })} className={field}>
            {[...TURKISH_PROVINCES].sort((a, b) => a.localeCompare(b, "tr")).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input aria-label="İlçe" placeholder="İlçe" value={contact.district} onChange={(e) => setContact({ ...contact, district: e.target.value })} className={field} />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-paper-raised">
        <div className="px-5 pb-2 pt-5 sm:px-6">
          <p className="font-display text-[17px] font-semibold text-ink">2. Kullanacağınız cihazlar</p>
          <p className="mt-1 text-[13.5px] text-slate">Adedini seçin ve günde yaklaşık kaç saat çalıştığını yazın.</p>
        </div>
        <div className="grid grid-cols-[1fr_104px_76px] gap-2 border-y border-line px-5 py-2 text-[12px] font-semibold text-slate sm:px-6">
          <span>Cihaz</span>
          <span>Adet</span>
          <span>Saat/gün</span>
        </div>
        <ul>
          {devices.map((d) => (
            <li key={d.id} className={`grid grid-cols-[1fr_104px_76px] items-center gap-2 border-b border-line px-5 py-2 sm:px-6 ${d.qty > 0 ? "bg-sun/5" : ""}`}>
              <span className="min-w-0">
                <span className="block text-[14px] font-medium text-ink">{d.name}</span>
                {d.note && <span className="block text-[11.5px] text-slate-soft">{d.note}</span>}
              </span>
              <span className="flex items-center gap-1">
                <button type="button" aria-label={`${d.name} azalt`} onClick={() => update(d.id, { qty: Math.max(0, d.qty - 1) })} className="rounded-full border border-line p-1 text-slate hover:border-ink">
                  <Minus size={13} />
                </button>
                <span className="w-7 text-center text-[14px] font-semibold text-ink">{d.qty}</span>
                <button type="button" aria-label={`${d.name} arttır`} onClick={() => update(d.id, { qty: d.qty + 1 })} className="rounded-full border border-line p-1 text-slate hover:border-ink">
                  <Plus size={13} />
                </button>
              </span>
              <span className="flex items-center gap-1">
                <input
                  aria-label={`${d.name} günlük çalışma saati`}
                  inputMode="decimal"
                  value={String(d.hours).replace(".", ",")}
                  onChange={(e) => update(d.id, { hours: Math.min(24, Number(e.target.value.replace(",", ".")) || 0) })}
                  className={small}
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
        <div className="flex flex-wrap items-end gap-2 px-5 py-3 sm:px-6">
          <span className="w-full text-[12.5px] font-semibold text-slate">Listede olmayan bir cihaz ekleyin</span>
          <input placeholder="Cihaz adı" value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} className={`${small} min-w-[150px] flex-1`} />
          <input placeholder="Güç (W)" inputMode="numeric" value={custom.watt} onChange={(e) => setCustom({ ...custom, watt: e.target.value })} className={`${small} w-24`} />
          <input placeholder="Saat/gün" inputMode="decimal" value={custom.hours} onChange={(e) => setCustom({ ...custom, hours: e.target.value })} className={`${small} w-24`} />
          <button type="button" onClick={addCustom} className="rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-paper hover:bg-sun hover:text-ink">
            Ekle
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-paper-raised p-5 sm:p-6">
        <p className="font-display text-[17px] font-semibold text-ink">3. Kullanım</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" aria-pressed={season === "yil"} onClick={() => setSeason("yil")} className={chip(season === "yil")}>
            Yıl boyu
          </button>
          <button type="button" aria-pressed={season === "yaz"} onClick={() => setSeason("yaz")} className={chip(season === "yaz")}>
            Sadece yaz ayları / hafta sonları
          </button>
          <label className="ml-1 flex items-center gap-2 text-[13.5px] text-slate">
            <input type="checkbox" checked={threePhase} onChange={(e) => setThreePhase(e.target.checked)} />
            Trifaze (380 V) cihazım var
          </label>
        </div>
      </section>

      <div>
        {error && <p className="mb-3 text-[13.5px] font-medium text-red-600">{error}</p>}
        <button
          type="button"
          onClick={submit}
          className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 text-[16px] font-bold text-white transition-transform hover:scale-[1.01]"
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={19} fill="currentColor" />}
          Paketimi hesapla ve WhatsApp&apos;tan gönder
        </button>
        <KvkkNotice className="mt-3" />
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[12px] text-paper/65">
        <span className="text-sun-soft">{icon}</span>
        {label}
      </dt>
      <dd className="mt-0.5 font-display text-[18px] font-semibold">{value}</dd>
    </div>
  );
}
