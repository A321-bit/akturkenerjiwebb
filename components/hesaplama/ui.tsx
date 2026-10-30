"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin, MessageCircle, Phone } from "lucide-react";
import LocationPicker, { type PickedLocation } from "./LocationPicker";
import { ILLER } from "@/lib/il-konum";
import { buildLeadAttributionFields, getAttribution } from "@/lib/attribution";
import { trackEvent } from "@/lib/track";
import { trackGa4Lead, trackGoogleAdsLead } from "@/lib/ga4";
import { rememberCalculation } from "@/lib/whatsapp-context";

// Hesaplayıcıların (on grid, ısı pompası, sulama) ortak parçaları: adım çubuğu, panel,
// gezinme, il/harita seçimi, iletişim adımı ve rapor altı "sizi arayacağız" kartı.

export const BLUE = "#3f74c4";
export const GOLD = "#d4861f";
export const AYLAR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
export const tl = (n: number) => `${Math.round(n).toLocaleString("tr-TR")} TL`;
export const num = (n: number, d = 0) => n.toLocaleString("tr-TR", { maximumFractionDigits: d });
/** Sayı alanı: yalnız rakam, nokta ve virgül; virgül ondalık ayıracı sayılır. */
export const onlyNum = (v: string) => v.replace(/[^\d.,]/g, "");
export const toNum = (v: string) => Number(v.replace(",", ".")) || 0;

/** Rapor sonrası gösterilen firma iletişim bilgisi. */
export type CompanyContact = { phone: string; whatsapp: string };
export type Place = { ad: string; lat: number; lon: number };

export function Stepper({ step, labels }: { step: number; labels: string[] }) {
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

export function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-paper-raised p-6 shadow-[0_24px_60px_-40px_rgba(14,22,38,0.35)] sm:p-8">
      <h2 className="font-display text-[22px] font-semibold tracking-tight text-ink">{title}</h2>
      {hint && <p className="mt-1 text-[14px] text-slate">{hint}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function Nav({ onBack, onNext, disabled, nextLabel = "Devam" }: { onBack?: () => void; onNext: () => void; disabled?: boolean; nextLabel?: string }) {
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

export function Toggle({ on, set, label }: { on: boolean; set: (v: boolean) => void; label: string }) {
  return (
    <button onClick={() => set(!on)} className={`rounded-full border px-4 py-2 text-[13.5px] font-semibold ${on ? "border-brand bg-brand text-paper" : "border-line text-slate hover:border-brand"}`}>
      {on ? "✓ " : ""}
      {label}
    </button>
  );
}

/** Seçenek kartları (tek seçim). */
export function Choice<K extends string>({ value, onChange, options, cols = 3 }: { value: K; onChange: (k: K) => void; options: { key: K; ad: string; not?: string }[]; cols?: 2 | 3 | 4 }) {
  const grid = cols === 2 ? "sm:grid-cols-2" : cols === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3";
  return (
    <div className={`grid gap-3 ${grid}`}>
      {options.map((o) => (
        <button key={o.key} onClick={() => onChange(o.key)} className={`rounded-xl border p-4 text-left ${value === o.key ? "border-brand bg-brand/5 ring-2 ring-brand/25" : "border-line bg-paper-raised hover:border-brand/60"}`}>
          <p className="font-semibold text-ink">{o.ad}</p>
          {o.not && <p className="mt-0.5 text-[12.5px] text-slate">{o.not}</p>}
        </button>
      ))}
    </div>
  );
}

/** Birimli sayı alanı. */
export function NumField({ label, value, onChange, unit, placeholder, note, className = "max-w-sm" }: { label: string; value: string; onChange: (v: string) => void; unit: string; placeholder?: string; note?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[13px] font-semibold text-ink">{label}</span>
      <div className="mt-1.5 flex items-center rounded-xl border border-line bg-paper-raised focus-within:border-brand">
        <input inputMode="decimal" value={value} onChange={(e) => onChange(onlyNum(e.target.value))} placeholder={placeholder} className="w-full bg-transparent px-4 py-3 font-mono-data text-[16px] outline-none" />
        <span className="whitespace-nowrap pr-4 text-[14px] font-semibold text-slate">{unit}</span>
      </div>
      {note && <span className="mt-1 block text-[12px] text-slate">{note}</span>}
    </label>
  );
}

/** İl seçimi (zorunlu) + isteğe bağlı harita işareti. Haritada işaret varsa tam nokta, yoksa il merkezi kullanılır. */
export function usePlace() {
  const [il, setIl] = useState("");
  const [loc, setLoc] = useState<PickedLocation | null>(null);
  const merkez = ILLER.find((i) => i.ad === il) ?? ILLER.find((i) => i.ad === "Ankara")!;
  const place: Place = loc ? { ad: loc.il, lat: loc.lat, lon: loc.lon } : { ad: merkez.ad, lat: merkez.lat, lon: merkez.lon };
  return { il, setIl, loc, setLoc, place };
}

export function PlacePicker({ il, setIl, loc, setLoc, mapLabel }: ReturnType<typeof usePlace> & { mapLabel: string }) {
  const [showMap, setShowMap] = useState(false);
  return (
    <>
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
          <LocationPicker
            value={loc}
            onChange={(v) => {
              setLoc(v);
              setIl(v.il);
            }}
          />
        </div>
      ) : (
        <button onClick={() => setShowMap(true)} className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-brand hover:underline">
          <MapPin size={15} /> {mapLabel}
        </button>
      )}
    </>
  );
}

export function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-paper/10 p-4">
      <p className="flex items-center gap-1.5 text-[12px] text-paper/70">
        {icon} {label}
      </p>
      <p className="mt-1 font-mono-data text-[19px] font-semibold">{value}</p>
    </div>
  );
}

export function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate">{k}</dt>
      <dd className="text-right font-mono-data font-semibold text-ink">{v}</dd>
    </div>
  );
}

export type LeadPayload = {
  /** Talepler listesinde görünen ihtiyaç adı (ör. "Isı pompası hesaplama"). */
  needType: string;
  /** Talep kaynağı kodu (ör. "heatpump_calculator"). */
  source: string;
  /** calculations.type */
  calcType: "on_grid" | "isi_pompasi" | "sulama";
  /** Talep notu ve WhatsApp mesajına eklenen kısa özet. */
  summary: string;
  inputs: object;
  results: object;
  recommendedProduct?: string;
  estimatedValue?: number;
  score: number;
};

/** Raporu açmadan önceki iletişim adımı: talebi ve hesap kaydını gönderir. */
export function ContactStep({ page, place, bullets, payload, onDone, onBack }: { page: string; place: Place; bullets: string[]; payload: LeadPayload; onDone: () => void; onBack: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const valid = name.trim().length > 2 && phone.replace(/\D/g, "").length >= 10 && consent;

  async function submit() {
    if (!valid) return;
    setState("sending");
    const attribution = getAttribution();
    try {
      const [lead, calc] = await Promise.all([
        fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ needType: payload.needType, fullname: name, phone, province: place.ad, source: payload.source, notes: payload.summary, ...buildLeadAttributionFields(page) }),
        }),
        fetch("/api/hesaplama/kaydet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: payload.calcType,
            fullname: name,
            phone,
            province: place.ad,
            lat: place.lat,
            lng: place.lon,
            consent,
            inputs: payload.inputs,
            results: payload.results,
            recommendedProduct: payload.recommendedProduct,
            estimatedValue: payload.estimatedValue,
            score: payload.score,
            ...attribution,
          }),
        }),
      ]);
      if (!lead.ok && !calc.ok) throw new Error();
      rememberCalculation(payload.summary);
      trackEvent("click", page, `${payload.source}_lead_submit`);
      trackGa4Lead(payload.source);
      trackGoogleAdsLead();
      onDone();
    } catch {
      setState("error");
    }
  }

  return (
    <Panel title="Ücretsiz fizibilite raporunuz hazır" hint="Raporu görüntülemek için iletişim bilgilerinizi girin. Mühendislerimiz raporunuzu inceleyip sizinle iletişime geçecek.">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <ul className="space-y-2.5 rounded-2xl border border-line bg-paper p-5 text-[14px] text-ink">
          <li className="font-semibold">Raporunuzda yer alanlar</li>
          {bullets.map((t) => (
            <li key={t} className="flex items-start gap-2 text-slate">
              <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-volt" /> {t}
            </li>
          ))}
        </ul>
        <div>
          <div className="grid gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Ad soyad" className="rounded-xl border border-line bg-paper-raised px-4 py-3 outline-none focus:border-brand" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" placeholder="Telefon (05xx xxx xx xx)" className="rounded-xl border border-line bg-paper-raised px-4 py-3 outline-none focus:border-brand" />
          </div>
          <label className="mt-3 flex items-start gap-2 text-[12.5px] text-slate">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
            <span>
              Kişisel verilerimin fizibilite raporu ve teklif hazırlanması amacıyla işlenmesine ilişkin{" "}
              <Link href="/kvkk-aydinlatma-metni" target="_blank" className="text-brand underline">
                aydınlatma metnini
              </Link>{" "}
              okudum, onaylıyorum.
            </span>
          </label>
          {state === "error" && <p className="mt-2 text-[13px] text-red-600">Gönderilemedi, lütfen tekrar deneyin ya da WhatsApp&apos;tan yazın.</p>}
        </div>
      </div>
      <Nav onBack={onBack} onNext={submit} disabled={!valid || state === "sending"} nextLabel={state === "sending" ? "Hazırlanıyor…" : "Raporumu görüntüle"} />
    </Panel>
  );
}

// Rapor altı: ekibin arayacağı bilgisi; dosya indirilmez, arama ve WhatsApp telefonun kendi uygulamasında açılır.
export function CallUs({ contact, team = "Mühendislerimiz", waText }: { contact: CompanyContact; team?: string; waText: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-volt/30 bg-volt/5 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 shrink-0 text-volt" />
        <div>
          <p className="font-semibold text-ink">Talebiniz alındı. {team} sizi arayacak.</p>
          <p className="mt-1 text-[14px] text-slate">
            Raporunuzu inceleyip en kısa sürede {contact.phone} numaramızdan size ulaşacağız. Yerinde ücretsiz keşif yapıp kesin teklifinizi hazırlayacağız.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-volt/20 pt-4">
        <p className="w-full text-[13px] text-slate">Aradığımızda tanımanız için numaramızı rehberinize ekleyebilirsiniz:</p>
        <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-paper hover:bg-brand">
          <Phone size={16} /> {contact.phone}
        </a>
        <a
          href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(waText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-[14px] font-semibold text-ink hover:border-volt"
        >
          <MessageCircle size={16} /> WhatsApp hattımız
        </a>
      </div>
    </div>
  );
}

/** İki seriyi ay ay yan yana gösteren çubuk grafik; ilk serinin değeri çubuğun üstünde yazar. */
export function MonthlyPair({ a, b, aLabel, bLabel, unit, format = (n: number) => num(n), aColor = BLUE, bColor = GOLD, totals = true }: { a: number[]; b: number[]; aLabel: string; bLabel: string; unit: string; format?: (n: number) => string; aColor?: string; bColor?: string; totals?: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...a, ...b);
  const sum = (s: number[]) => s.reduce((x, y) => x + y, 0);
  return (
    <div className="mt-4">
      <div className="mb-2 flex gap-4 text-[12px] text-slate">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: aColor }} /> {aLabel}</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: bColor }} /> {bLabel}</span>
      </div>
      <div className="relative mt-5 flex h-44 items-end gap-1.5" onMouseLeave={() => setHover(null)}>
        {a.map((p, i) => (
          <div key={i} className="flex h-full flex-1 flex-col justify-end" onMouseEnter={() => setHover(i)}>
            <div className="flex h-full items-end justify-center gap-[2px]">
              <div className="relative w-1/2 rounded-t-[4px]" style={{ height: `${(p / max) * 100}%`, background: aColor, opacity: hover == null || hover === i ? 1 : 0.45 }}>
                {p > 0 && <span className="absolute bottom-full left-1/2 mb-0.5 -translate-x-1/2 whitespace-nowrap font-mono-data text-[8.5px] font-semibold text-slate sm:text-[10px]">{num(p)}</span>}
              </div>
              <div className="w-1/2 rounded-t-[4px]" style={{ height: `${(b[i] / max) * 100}%`, background: bColor, opacity: hover == null || hover === i ? 1 : 0.45 }} />
            </div>
            <span className="mt-1 text-center text-[10.5px] text-slate">{AYLAR[i]}</span>
          </div>
        ))}
        {hover != null && (
          <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-paper-raised px-3 py-1.5 text-[12px] shadow-sm">
            <b className="text-ink">{AYLAR[hover]}</b> · {aLabel.toLocaleLowerCase("tr-TR")} {format(a[hover])} · {bLabel.toLocaleLowerCase("tr-TR")} {format(b[hover])}
          </div>
        )}
      </div>
      {totals && (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3 text-[12.5px] text-slate">
          <span>
            Yıllık {aLabel.toLocaleLowerCase("tr-TR")} <b className="font-mono-data text-ink">{format(sum(a))} {unit}</b>
          </span>
          <span>
            Yıllık {bLabel.toLocaleLowerCase("tr-TR")} <b className="font-mono-data text-ink">{format(sum(b))} {unit}</b>
          </span>
        </div>
      )}
    </div>
  );
}

/** Önerilen ürün kutusu (rapor). */
export function ProductBox({ title, pkg, includes, empty }: { title: string; pkg: { name: string; price?: number; href: string } | null; includes: string; empty: string }) {
  return (
    <>
      <h3 className="font-semibold text-ink">{title}</h3>
      {pkg ? (
        <>
          <p className="mt-2 font-display text-[18px] font-semibold text-ink">{pkg.name}</p>
          {pkg.price ? <p className="mt-1 font-mono-data text-[22px] font-semibold text-brand">{tl(pkg.price)}</p> : <p className="mt-1 text-slate">Fiyat için teklif alın</p>}
          <p className="mt-1 text-[12px] text-slate">{includes}</p>
          <Link href={pkg.href} className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand hover:underline">
            Ürünü incele <ArrowRight size={15} />
          </Link>
        </>
      ) : (
        <p className="mt-2 text-[14px] text-slate">{empty}</p>
      )}
    </>
  );
}

/** Adım değiştiğinde sayfa başına değil, hesaplayıcının başına kaydırır. */
export function useWizard(page: string, key: string) {
  const [step, setStep] = useState(1);
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  function go(next: number) {
    setStep(next);
    trackEvent("click", page, `${key}_step_${next}`);
    requestAnimationFrame(() => {
      const top = (el?.getBoundingClientRect().top ?? 0) + window.scrollY - 88;
      window.scrollTo({ top, behavior: "smooth" });
    });
  }
  return { step, go, ref: setEl };
}
