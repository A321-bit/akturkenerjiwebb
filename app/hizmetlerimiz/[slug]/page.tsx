import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowUpRight, BadgeCheck, Check, ChevronDown, MessageCircle } from "lucide-react";
import {
  getServices,
  getServiceBySlug,
  getReferences,
  getSiteSettings,
  getBlogPosts,
  whatsappLink,
  SITE_URL,
  SITE_NAME,
} from "@/lib/data";
import { getServiceContent } from "@/lib/service-content";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import ServiceCard from "@/components/ServiceCard";
import CoverMedia from "@/components/CoverMedia";
import SunGlow from "@/components/SunGlow";
import Reveal from "@/components/Reveal";
import QuoteModal from "@/components/QuoteModal";
import PumpPowerCalculator from "@/components/PumpPowerCalculator";
import VillaSystemShowcase from "@/components/VillaSystemShowcase";

// Hobi Bahçesi ve Karavan Sistemleri hizmetleri Off-Grid hizmetinde birleştirildi;
// eski linkler/yer imleri 404 yerine yeni sayfaya yönlensin diye eşleme tutuyoruz.
const LEGACY_SLUG_REDIRECTS: Record<string, string> = {
  "hobi-bahcesi": "off-grid-sebekeden-bagimsiz",
  "karavan-sistemleri": "off-grid-sebekeden-bagimsiz",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return {};
  const content = getServiceContent(service);
  return buildMetadata({
    title: `${service.title} | Ankara`,
    description: service.summary,
    path: `/hizmetlerimiz/${service.slug}`,
    keywords: [
      service.title,
      service.eyebrow,
      ...(content.seoKeywords ?? []),
      "güneş enerjisi",
      "GES",
      "Ankara",
    ],
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (LEGACY_SLUG_REDIRECTS[slug]) {
    redirect(`/hizmetlerimiz/${LEGACY_SLUG_REDIRECTS[slug]}`);
  }
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const content = getServiceContent(service);
  const [site, allServices, allReferences, allPosts] = await Promise.all([
    getSiteSettings(),
    getServices(),
    getReferences(),
    getBlogPosts(),
  ]);

  const others = content.relatedServiceSlugs
    ? (content.relatedServiceSlugs
        .map((s) => allServices.find((svc) => svc.slug === s))
        .filter((s): s is NonNullable<typeof s> => Boolean(s)))
    : allServices.filter((s) => s.slug !== service.slug).slice(0, 3);

  const matchingRefs = allReferences.filter((r) =>
    content.referenceCategories.includes(r.category)
  );
  const references = (matchingRefs.length > 0 ? matchingRefs : allReferences).slice(0, 3);

  const relatedPosts = content.blogCategory
    ? allPosts.filter((p) => p.category === content.blogCategory).slice(0, 3)
    : [];

  const waHref = whatsappLink(
    site.contact.whatsappNumber,
    `Merhaba, "${service.title}" hakkında bilgi almak istiyorum.`
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: service.title,
        description: service.description,
        provider: { "@type": "LocalBusiness", name: SITE_NAME, url: SITE_URL },
        areaServed: "TR",
        audience: service.audience,
      },
      ...(content.faqs.length > 0
        ? [
            {
              "@type": "FAQPage",
              mainEntity: content.faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ]
        : []),
      breadcrumbJsonLd([
        { name: "Anasayfa", path: "/" },
        { name: "Hizmetlerimiz", path: "/hizmetlerimiz" },
        { name: service.title, path: `/hizmetlerimiz/${service.slug}` },
      ]),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO — acı nokta + vaat */}
      <section className="relative overflow-hidden bg-ink text-paper">
        <div className="grid-texture absolute inset-0" />
        <SunGlow className="pointer-events-none absolute -right-24 -top-28 h-[420px] w-[420px] opacity-60" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="animate-rise">
            <Link
              href="/hizmetlerimiz"
              className="text-[13px] font-medium text-slate-soft hover:text-paper"
            >
              ← Tüm hizmetler
            </Link>
            <p className="mt-5 font-mono-data text-[12px] uppercase tracking-[0.18em] text-sun-soft">
              {service.eyebrow} · {service.title}
            </p>
            {content.turnkeyInstall !== false && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-sun/40 bg-sun/10 px-4 py-1.5 text-[13px] font-semibold text-sun-soft">
                <BadgeCheck size={16} />
                Anahtar Teslim Kurulum Hizmeti
              </div>
            )}
            <h1 className="mt-4 font-display text-[2rem] font-semibold leading-[1.12] tracking-tight sm:text-4xl lg:text-[2.75rem]">
              {content.hero.headline}
            </h1>
            <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-slate-soft">
              {content.hero.sub}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <QuoteModal defaultPurpose={service.title} />
              {content.turnkeyInstall !== false && (
                <Link
                  href="/iletisim"
                  className="group inline-flex items-center gap-2 rounded-full bg-sun px-6 py-3.5 text-[15px] font-bold text-ink shadow-[0_10px_30px_-8px_rgba(238,162,58,0.6)] transition-transform hover:scale-[1.03] hover:bg-sun-soft"
                >
                  Ücretsiz Keşif Talep Et
                  <ArrowUpRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </Link>
              )}
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-line-dark px-5 py-3 text-[14.5px] font-semibold text-paper transition-colors hover:border-sun/60"
              >
                <MessageCircle size={16} className="text-sun-soft" />
                WhatsApp&apos;tan Sor
              </a>
            </div>
          </div>
          <CoverMedia
            src={service.image}
            alt={service.title}
            label={service.eyebrow}
            aspect="aspect-[4/3]"
            iconSize={72}
            className="shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]"
          />
        </div>
      </section>

      {service.slug === "villa-cati-ges" && <VillaSystemShowcase />}

      {/* FAYDA KARTLARI */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <Reveal>
          <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
            Neden {service.eyebrow}?
          </p>
          <h2 className="mt-2 max-w-xl font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Bu sistem size ne kazandırır?
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {content.benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <Reveal key={b.title} delay={i * 60}>
                <div className="h-full rounded-2xl border border-line bg-paper-raised p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <Icon size={21} />
                  </span>
                  <h3 className="mt-4 font-display text-[15.5px] font-semibold text-ink">
                    {b.title}
                  </h3>
                  {b.text && (
                    <p className="mt-2 text-[13.5px] leading-relaxed text-slate">{b.text}</p>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* REFERANSLAR — fayda kartlarının hemen altında, güven kanıtı erken gösterilsin */}
      <section className="border-y border-line bg-paper-raised">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <Reveal>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
                  Referanslarımız
                </p>
                <h2 className="mt-2 max-w-xl font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  Son Tamamlanan Projelerimiz
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
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {references.map((r, i) => (
              <Reveal key={r.slug} delay={i * 60}>
                <Link
                  href={`/referanslarimiz/${r.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-line bg-paper p-4 transition-transform duration-300 hover:-translate-y-1"
                >
                  <CoverMedia
                    src={r.image}
                    alt={r.title}
                    label={r.category}
                    aspect="aspect-[16/11]"
                    iconSize={40}
                  />
                  <div className="flex items-center justify-between pt-4">
                    <span className="font-mono-data text-[11px] uppercase tracking-[0.14em] text-brand">
                      {r.category}
                    </span>
                    <span className="font-mono-data text-[11px] text-slate-soft">{r.year}</span>
                  </div>
                  <h3 className="mt-3 font-display text-[16px] font-semibold leading-snug">
                    {r.title}
                  </h3>
                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[12.5px] text-slate-soft">
                    <span>{r.location}</span>
                    <span className="font-mono-data font-semibold text-ink">{r.capacity}</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* DETAY + KAPSAM */}
      <section className="border-y border-line bg-paper-raised">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <h2 className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
              Nasıl çalışıyoruz
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-slate">{service.description}</p>
          </div>
          <div className="h-fit rounded-2xl border border-line bg-paper p-6">
            <h2 className="font-mono-data text-[11px] uppercase tracking-[0.14em] text-brand">
              Bu hizmet kapsamında
            </h2>
            <ul className="mt-4 space-y-3">
              {service.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-[14.5px] text-ink">
                  <Check size={17} className="mt-0.5 shrink-0 text-volt" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* TABLO — geri ödeme / kapsam */}
      {content.table && (
        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <Reveal>
            <h2 className="max-w-xl font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {content.table.title}
            </h2>
          </Reveal>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-paper-raised">
            <table className="w-full min-w-[560px] text-left text-[14px]">
              <thead>
                <tr className="border-b border-line">
                  {content.table.columns.map((c) => (
                    <th
                      key={c}
                      className="px-5 py-3.5 font-mono-data text-[11px] uppercase tracking-[0.12em] text-brand"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {content.table.rows.map((row) => (
                  <tr key={row[0]} className="border-b border-line last:border-0">
                    <td className="px-5 py-3.5 font-semibold text-ink">{row[0]}</td>
                    <td className="px-5 py-3.5 font-mono-data text-slate">{row[1]}</td>
                    <td className="px-5 py-3.5 text-slate">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-slate-soft">
            {content.table.note}
          </p>
          {service.slug === "tarimsal-sulama" && (
            <PumpPowerCalculator whatsappNumber={site.contact.whatsappNumber} />
          )}
        </section>
      )}

      {/* SÜREÇ */}
      <section className="border-y border-line bg-paper-raised">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <Reveal>
            <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
              Süreç
            </p>
            <h2 className="mt-2 max-w-xl font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Bizimle çalışmak nasıl işliyor?
            </h2>
          </Reveal>

          {/* Mobil: dikey zaman çizelgesi */}
          <ol className="relative mt-10 space-y-7 border-l border-line pl-7 sm:hidden">
            {content.steps.map((s, i) => (
              <li key={s.title} className="relative">
                <span className="absolute -left-[38px] top-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-brand bg-paper font-mono-data text-[12px] font-semibold text-brand">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-[15.5px] font-semibold text-ink">{s.title}</h3>
                <p className="mt-1 text-[13.5px] leading-relaxed text-slate">{s.text}</p>
              </li>
            ))}
          </ol>

          {/* Tablet & masaüstü: yatay adımlar */}
          <div className="mt-10 hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-5">
            {content.steps.map((s, i) => (
              <div key={s.title} className="relative">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-brand bg-paper font-mono-data text-[13px] font-semibold text-brand">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3.5 font-display text-[15px] font-semibold text-ink">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SSS */}
      {content.faqs.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <Reveal>
            <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
              Sıkça Sorulan Sorular
            </p>
            <h2 className="mt-2 max-w-xl font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Aklınıza takılanlar
            </h2>
          </Reveal>
          <div className="mt-8 flex max-w-3xl flex-col gap-3">
            {content.faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl border border-line bg-paper-raised px-5 py-4"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-semibold text-ink">
                  {f.q}
                  <ChevronDown
                    size={18}
                    className="shrink-0 text-brand transition-transform group-open:rotate-180"
                  />
                </summary>
                <p className="mt-3 text-[14px] leading-relaxed text-slate">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* İLGİLİ YAZILAR */}
      {relatedPosts.length > 0 && (
        <section className="border-y border-line bg-paper-raised">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
            <Reveal>
              <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
                Blog
              </p>
              <h2 className="mt-2 max-w-xl font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                İlgili Yazılar
              </h2>
            </Reveal>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {relatedPosts.map((p, i) => (
                <Reveal key={p.slug} delay={i * 60}>
                  <Link
                    href={`/blog/${p.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-line bg-paper p-5 transition-transform duration-300 hover:-translate-y-1"
                  >
                    <span className="font-mono-data text-[11px] uppercase tracking-[0.14em] text-brand">
                      {p.category}
                    </span>
                    <h3 className="mt-2 font-display text-[15.5px] font-semibold leading-snug text-ink group-hover:text-brand">
                      {p.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-slate">
                      {p.description}
                    </p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* GÜVEN ŞERİDİ */}
      <section className="mx-auto max-w-6xl px-5 pt-16 sm:px-8">
        <div className="grid grid-cols-2 gap-6 rounded-2xl border border-line bg-paper-raised p-6 sm:grid-cols-3">
          {site.stats.map((s) => (
            <div key={s.label}>
              <p className="font-mono-data text-lg font-semibold text-ink sm:text-xl">{s.value}</p>
              <p className="mt-1 text-[12.5px] text-slate">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* KAPANIŞ CTA */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-12 text-paper sm:px-12 sm:py-14">
          <div className="grid-texture absolute inset-0" />
          <SunGlow className="pointer-events-none absolute -right-16 -top-28 h-[320px] w-[320px] opacity-50" />
          <div className="relative max-w-2xl">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {content.closing.title}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-soft">
              {content.closing.text}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <QuoteModal defaultPurpose={service.title} />
              {content.turnkeyInstall !== false && (
                <Link
                  href="/iletisim"
                  className="group inline-flex items-center gap-2 rounded-full bg-sun px-6 py-3.5 text-[15px] font-bold text-ink transition-transform hover:scale-[1.03] hover:bg-sun-soft"
                >
                  Ücretsiz Keşif Talep Et
                  <ArrowUpRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </Link>
              )}
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-line-dark px-5 py-3 text-[14.5px] font-semibold text-paper hover:border-sun/60"
              >
                <MessageCircle size={16} className="text-sun-soft" />
                WhatsApp&apos;tan Yazın
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* DİĞER HİZMETLER */}
      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <h2 className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
          İlginizi çekebilir
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          {others.map((s) => (
            <ServiceCard key={s.slug} service={s} />
          ))}
        </div>
      </section>
    </>
  );
}
