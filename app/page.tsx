import { Suspense } from "react";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck, CreditCard, Award } from "lucide-react";
import { getServices, getReferences, getTestimonials, getSiteSettings, whatsappLink } from "@/lib/data";
import SavingsCalculator from "@/components/SavingsCalculator";
import ServiceCard from "@/components/ServiceCard";
import Reveal from "@/components/Reveal";
import AnimatedCounter from "@/components/AnimatedCounter";
import SunGlow from "@/components/SunGlow";
import HowItWorks from "@/components/HowItWorks";
import CoverMedia from "@/components/CoverMedia";
import LeadForm from "@/components/LeadForm";
import VideosSection from "@/components/VideosSection";

export default async function Home() {
  const [services, references, testimonials, site] = await Promise.all([
    getServices(),
    getReferences(),
    getTestimonials(),
    getSiteSettings(),
  ]);
  const stats = site.stats;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink text-paper">
        <div className="grid-texture absolute inset-0" />
        <SunGlow className="pointer-events-none absolute -right-24 -top-24 h-[520px] w-[520px] opacity-70 lg:-right-10 lg:top-[-140px]" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div className="animate-rise">
            <p className="font-mono-data text-[13px] uppercase tracking-[0.18em] text-sun-soft">
              <span className="font-semibold text-sun">Aktürk Enerji</span> · {site.city} Merkezli ·{" "}
              {site.foundedYear}&apos;dan beri
            </p>
            <h1 className="mt-4 font-display text-[2.35rem] font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Çatınızdan araziye,
              <br />
              güneşi elektriğe
              <br />
              <span className="text-sun-soft">biz çeviriyoruz.</span>
            </h1>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-slate-soft">
              Villa, hobi bahçesi, tarımsal arazi ve toplu inşaat projeleri için
              keşiften mühendislik başvurusuna, kurulumdan garantiye kadar
              anahtar teslim güneş enerjisi sistemleri kuruyoruz.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#teklif-formu"
                className="group inline-flex items-center gap-2 rounded-full bg-sun px-6 py-3.5 text-[15px] font-bold text-ink shadow-[0_10px_30px_-8px_rgba(238,162,58,0.6)] transition-transform hover:scale-[1.03] hover:bg-sun-soft"
              >
                Ücretsiz Keşif & Teklif Al
                <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <Link
                href="/referanslarimiz"
                className="inline-flex items-center gap-2 rounded-full border border-line-dark px-5 py-3 text-[14.5px] font-semibold text-paper transition-colors hover:border-sun/60"
              >
                Referanslarımızı İnceleyin
              </Link>
            </div>

            <dl className="mt-12 grid grid-cols-2 gap-6 border-t border-line-dark pt-8 sm:grid-cols-3">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="text-[11.5px] text-slate-soft">{s.label}</dt>
                  <dd className="mt-1 font-mono-data text-[15px] font-semibold text-paper sm:text-base">
                    <AnimatedCounter value={s.value} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:pt-2">
            <SavingsCalculator whatsappNumber={site.contact.whatsappNumber} />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <Reveal>
        <HowItWorks />
      </Reveal>

      {/* ÖDEME / GARANTİ / STANDARTLAR */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <Reveal>
          <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
            Güvenle Yatırım Yapın
          </p>
          <h2 className="mt-2 max-w-xl font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Ödeme, garanti ve kalite güvencemiz
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            {
              icon: CreditCard,
              title: "Kredi Kartına Taksit İmkanı",
              text: "Anlaşmalı bankalarla kredi kartına taksit imkanı sunuyoruz; size uygun ödeme planını keşif sonrası birlikte netleştiriyoruz.",
            },
            {
              icon: ShieldCheck,
              title: "Uzun Yıllar Ürün Garantisi",
              text: "Kullandığımız panel ve invertörler 10+ yıla varan ürün garantisiyle geliyor; garanti süresi marka/modele göre değişebilir.",
            },
            {
              icon: Award,
              title: "Sertifikalı Ekipman",
              text: "Panel, invertör ve batarya seçimlerimizde uluslararası kalite ve güvenlik standartlarını gözeten, garantili markaları tercih ediyoruz.",
            },
          ].map((item, i) => (
            <Reveal key={item.title} delay={i * 60}>
              <div className="h-full rounded-2xl border border-line bg-paper-raised p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <item.icon size={21} />
                </span>
                <h3 className="mt-4 font-display text-[15.5px] font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-slate">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* E-TİCARET */}
      <section className="border-y border-line bg-paper-raised">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-5 py-8 text-center sm:flex-row sm:px-8 sm:text-left">
          <div>
            <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
              E-Ticaret
            </p>
            <h2 className="mt-1.5 font-display text-[19px] font-semibold tracking-tight sm:text-[21px]">
              Ürünlerimizi gunesdukkan.com üzerinden de satın alabilirsiniz
            </h2>
            <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-slate">
              Panel, invertör ve batarya gibi ürünlerimizi tek tek incelemek isterseniz kendi e-ticaret mağazamız Güneş Dükkan&apos;ı ziyaret edin.
            </p>
          </div>
          <a
            href="https://gunesdukkan.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[14.5px] font-semibold text-paper transition-colors hover:bg-sun hover:text-ink"
          >
            gunesdukkan.com&apos;u Ziyaret Edin
            <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <Reveal>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
                Hizmetlerimiz
              </p>
              <h2 className="mt-2 max-w-xl font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                Villadan tarım arazisine, solar sektörünün her ihtiyacı
              </h2>
            </div>
            <Link
              href="/hizmetlerimiz"
              className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink hover:text-brand"
            >
              Tüm hizmetler
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.slice(0, 6).map((s, i) => (
            <Reveal key={s.slug} delay={i * 60}>
              <ServiceCard service={s} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* REFERENCES PREVIEW */}
      <section className="border-y border-line bg-paper-raised">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <Reveal>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
                  Referanslarımız
                </p>
                <h2 className="mt-2 max-w-xl font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  Ankara ve çevresinde tamamladığımız projelerden
                </h2>
              </div>
              <Link
                href="/referanslarimiz"
                className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink hover:text-brand"
              >
                Tüm referanslar
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {references.slice(0, 3).map((r, i) => (
              <Reveal key={r.slug} delay={i * 60}>
                <Link
                  href={`/referanslarimiz/${r.slug}`}
                  className="group flex flex-col rounded-2xl border border-line bg-paper p-4 transition-transform duration-300 hover:-translate-y-1"
                >
                  <CoverMedia src={r.image} alt={r.title} label={r.category} aspect="aspect-[16/11]" iconSize={40} />
                  <div className="flex items-center justify-between pt-4">
                    <span className="font-mono-data text-[11px] uppercase tracking-[0.14em] text-brand">
                      {r.category}
                    </span>
                    <span className="font-mono-data text-[11px] text-slate-soft">{r.year}</span>
                  </div>
                  <h3 className="mt-3 font-display text-[17px] font-semibold leading-snug">
                    {r.title}
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-slate">{r.summary}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[12.5px] text-slate-soft">
                    <span>{r.location}</span>
                    <span className="font-mono-data font-semibold text-ink">{r.capacity}</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* VİDEOLAR */}
      <Suspense fallback={null}>
        <VideosSection />
      </Suspense>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <Reveal>
          <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
            Müşterilerimiz
          </p>
          <h2 className="mt-2 max-w-xl font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Kurulum sonrasında da yanınızdayız
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={`${t.name}-${i}`} delay={i * 60}>
              <figure className="rounded-2xl border border-line bg-paper-raised p-6">
                <blockquote className="text-[14.5px] leading-relaxed text-ink">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-4 border-t border-line pt-3 text-[13px] text-slate">
                  <span className="font-semibold text-ink">{t.name}</span>
                  <br />
                  {t.role}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* LEAD FORM */}
      <section id="teklif-formu" className="relative scroll-mt-20 overflow-hidden bg-ink text-paper">
        <div className="grid-texture absolute inset-0" />
        <SunGlow className="pointer-events-none absolute -left-20 -bottom-24 h-[400px] w-[400px] opacity-50" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Reveal>
            <div>
              <p className="font-mono-data text-[12px] uppercase tracking-[0.18em] text-sun-soft">
                Ücretsiz Keşif & Teklif
              </p>
              <h2 className="mt-3 max-w-lg font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                Projenizi konuşalım — 3 adımda teklifinizi alın
              </h2>
              <p className="mt-3 max-w-md text-[14.5px] text-slate-soft">
                İhtiyacınızı seçin, birkaç soruyu yanıtlayın; uzman mühendisimiz
                size özel sistem boyutu ve fiyat teklifiyle 15 dakika içinde dönüş yapsın.
              </p>
              <a
                href={whatsappLink(
                  site.contact.whatsappNumber,
                  "Merhaba, Aktürk Enerji'den güneş enerjisi sistemleri hakkında bilgi almak istiyorum."
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-line-dark px-5 py-3 text-[14.5px] font-semibold text-paper hover:border-sun/60"
              >
                Ya da WhatsApp&apos;tan Yaz
              </a>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <LeadForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
