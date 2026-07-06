import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check } from "lucide-react";
import { services, site, whatsappLink } from "@/lib/site-config";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import ServiceCard from "@/components/ServiceCard";
import CoverMedia from "@/components/CoverMedia";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) return {};
  return buildMetadata({
    title: service.title,
    description: service.summary,
    path: `/hizmetlerimiz/${service.slug}`,
    keywords: [service.title, service.eyebrow, "güneş enerjisi", "GES", site.city],
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: service.title,
        description: service.description,
        provider: { "@type": "LocalBusiness", name: site.name, url: site.url },
        areaServed: "TR",
        audience: service.audience,
      },
      breadcrumbJsonLd([
        { name: "Anasayfa", path: "/" },
        { name: "Hizmetlerimiz", path: "/hizmetlerimiz" },
        { name: service.title, path: `/hizmetlerimiz/${service.slug}` },
      ]),
    ],
  };

  const others = services.filter((s) => s.slug !== service.slug).slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
        {service.eyebrow}
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {service.title}
      </h1>
      <p className="mt-4 text-[16px] leading-relaxed text-slate">
        {service.description}
      </p>

      <CoverMedia
        src={service.image}
        alt={service.title}
        label={service.eyebrow}
        aspect="aspect-[16/9]"
        iconSize={72}
        className="mt-8"
      />

      <div className="mt-8 rounded-2xl border border-line bg-paper-raised p-6">
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

      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={whatsappLink(`Merhaba, "${service.title}" hakkında bilgi almak istiyorum.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[14.5px] font-semibold text-paper transition-colors hover:bg-sun hover:text-ink"
        >
          WhatsApp&apos;tan Sor
        </a>
        <Link
          href="/iletisim"
          className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-[14.5px] font-semibold text-ink hover:border-brand"
        >
          Ücretsiz Keşif Talep Et
          <ArrowUpRight size={16} />
        </Link>
      </div>

      <div className="mt-16">
        <h2 className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
          İlginizi çekebilir
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          {others.map((s) => (
            <ServiceCard key={s.slug} service={s} />
          ))}
        </div>
      </div>
    </div>
  );
}
