import { Zap, BatteryCharging, Flame, Car, Sparkles } from "lucide-react";
import Reveal from "@/components/Reveal";
import SunGlow from "@/components/SunGlow";
import QuoteModal from "@/components/QuoteModal";

const pillars = [
  {
    icon: Zap,
    accent: "brand",
    tag: "25 kW'a kadar",
    title: "On-Grid Villa Paketleri",
    text: "Şebeke bağlantılı (on-grid) sistemlerde 25 kW'a kadar villa çatı GES kuruyoruz — mahsuplaşmayla faturanız büyük ölçüde sıfırlanır.",
  },
  {
    icon: BatteryCharging,
    accent: "sun",
    tag: "Mahsuplaşmasız da mümkün",
    title: "Hibrit Lityum Batarya",
    text: "İster şebekeye bağlı, ister mahsuplaşma sürecine hiç girmeden — hibrit lityum batarya sistemiyle enerjinizi kendi çatınızda depolarsınız.",
  },
  {
    icon: Flame,
    accent: "volt",
    tag: "Isınma + soğutma",
    title: "Isı Pompası Entegrasyonu",
    text: "Isı pompanızı güneş enerjisi sisteminize entegre ederek ısınma ve soğutma giderinizi de faturayla birlikte küçültüyoruz.",
  },
  {
    icon: Car,
    accent: "red",
    tag: "Akıllı programlama",
    title: "Elektrikli Araç Şarj İstasyonu",
    text: "Duvar tipi AC şarj cihazınızı sisteme entegre ediyoruz — aracınızı büyük ölçüde kendi ürettiğiniz güneşle şarj edersiniz.",
  },
];

const accentClasses: Record<string, { badge: string; ring: string }> = {
  brand: { badge: "bg-brand/10 text-brand", ring: "group-hover:border-brand/50" },
  sun: { badge: "bg-sun/15 text-sun", ring: "group-hover:border-sun/60" },
  volt: { badge: "bg-volt/10 text-volt", ring: "group-hover:border-volt/50" },
  red: { badge: "bg-red-600/10 text-red-600", ring: "group-hover:border-red-600/40" },
};

export default function VillaSystemShowcase() {
  return (
    <section className="relative overflow-hidden bg-ink text-paper">
      <div className="grid-texture absolute inset-0" />
      <SunGlow className="pointer-events-none absolute -left-24 -top-24 h-[420px] w-[420px] opacity-50" />
      <SunGlow className="pointer-events-none absolute -bottom-32 -right-16 h-[380px] w-[380px] opacity-40" />

      <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <Reveal>
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sun/40 bg-sun/10 px-4 py-1.5 text-[12.5px] font-semibold text-sun-soft">
              <Sparkles size={14} /> Villanıza özel
            </span>
            <h2 className="mt-4 font-display text-[1.9rem] font-semibold leading-tight tracking-tight sm:text-4xl">
              Tek çatı, tek sistem, dört çözüm
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-slate-soft">
              On-grid panel kurulumu, hibrit batarya, ısı pompası ve elektrikli
              araç şarjı — dört ayrı hizmet gibi görünse de aslında bunların
              hepsini <span className="font-semibold text-paper">tek bir entegre sistemde</span> kuruyoruz.
              Dilerseniz villanızı elektrik faturasından tamamen bağımsız hale getiriyoruz.
            </p>
          </div>
        </Reveal>

        <div className="relative mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            const accent = accentClasses[p.accent];
            return (
              <Reveal key={p.title} delay={i * 90}>
                <div
                  className={`group h-full rounded-2xl border border-line-dark bg-ink-soft/60 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1.5 ${accent.ring}`}
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 ${accent.badge}`}
                  >
                    <Icon size={22} />
                  </span>
                  <span className="mt-4 inline-block rounded-full bg-paper/10 px-2.5 py-1 font-mono-data text-[10.5px] uppercase tracking-[0.1em] text-slate-soft">
                    {p.tag}
                  </span>
                  <h3 className="mt-3 font-display text-[16px] font-semibold text-paper">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-soft">{p.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={360}>
          <div className="mt-10 flex items-center justify-center gap-4">
            <span className="hidden h-px flex-1 max-w-24 bg-line-dark sm:block" />
            <span className="shrink-0 rounded-full border border-sun/40 bg-sun/10 px-5 py-2 text-center font-mono-data text-[12px] font-semibold uppercase tracking-[0.1em] text-sun-soft">
              = Tamamen Bağımsız Villa Sistemi
            </span>
            <span className="hidden h-px flex-1 max-w-24 bg-line-dark sm:block" />
          </div>
        </Reveal>

        <Reveal delay={420}>
          <div className="mt-10 flex justify-center">
            <QuoteModal defaultPurpose="Villa Enerji Sistemi (On-Grid + Batarya + Isı Pompası + EV Şarj)" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
