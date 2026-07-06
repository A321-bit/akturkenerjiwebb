import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowUpRight, MapPin, Zap, Calendar } from "lucide-react";
import { references, whatsappLink } from "@/lib/site-config";
import CoverMedia from "@/components/CoverMedia";

export function generateStaticParams() {
  return references.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const reference = references.find((r) => r.slug === slug);
  if (!reference) return {};
  return {
    title: `${reference.title} | Referanslarımız`,
    description: reference.summary,
    alternates: { canonical: `/referanslarimiz/${reference.slug}` },
  };
}

export default async function ReferenceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const reference = references.find((r) => r.slug === slug);
  if (!reference) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Project",
    name: reference.title,
    description: reference.summary,
    locationCreated: reference.location,
    dateCreated: reference.year,
  };

  const others = references.filter((r) => r.slug !== reference.slug).slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href="/referanslarimiz"
        className="text-[13.5px] font-medium text-slate hover:text-ink"
      >
        ← Tüm referanslar
      </Link>

      <p className="mt-5 font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
        {reference.category}
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {reference.title}
      </h1>
      <p className="mt-4 text-[16px] leading-relaxed text-slate">
        {reference.description ?? reference.summary}
      </p>

      <CoverMedia
        src={reference.image}
        alt={reference.title}
        label={reference.category}
        aspect="aspect-[16/9]"
        iconSize={72}
        className="mt-8"
      />

      <div className="mt-8 grid grid-cols-3 gap-3 rounded-2xl border border-line bg-paper-raised p-6">
        <div>
          <p className="flex items-center gap-1.5 font-mono-data text-[11px] uppercase tracking-[0.1em] text-slate-soft">
            <MapPin size={13} className="text-brand" /> Konum
          </p>
          <p className="mt-1.5 text-[14.5px] font-semibold text-ink">{reference.location}</p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 font-mono-data text-[11px] uppercase tracking-[0.1em] text-slate-soft">
            <Zap size={13} className="text-brand" /> Kurulu Güç
          </p>
          <p className="mt-1.5 text-[14.5px] font-semibold text-ink">{reference.capacity}</p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 font-mono-data text-[11px] uppercase tracking-[0.1em] text-slate-soft">
            <Calendar size={13} className="text-brand" /> Yıl
          </p>
          <p className="mt-1.5 text-[14.5px] font-semibold text-ink">{reference.year}</p>
        </div>
      </div>

      {reference.address && (
        <p className="mt-4 text-[13.5px] text-slate-soft">
          <span className="font-semibold text-ink">Açık adres:</span> {reference.address}
        </p>
      )}

      {reference.gallery && reference.gallery.length > 0 && (
        <div className="mt-10">
          <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
            Saha ve Drone Görüntüleri
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {reference.gallery.map((src) => (
              <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image src={src} alt={reference.title} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={whatsappLink(`Merhaba, "${reference.title}" projesi gibi bir sistem hakkında bilgi almak istiyorum.`)}
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
        <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
          Diğer referanslar
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          {others.map((r) => (
            <Link
              key={r.slug}
              href={`/referanslarimiz/${r.slug}`}
              className="group flex flex-col rounded-2xl border border-line bg-paper-raised p-4 hover:border-sun/60"
            >
              <CoverMedia src={r.image} alt={r.title} label={r.category} aspect="aspect-[16/11]" iconSize={32} />
              <p className="mt-3 font-mono-data text-[11px] uppercase tracking-[0.14em] text-brand">
                {r.category}
              </p>
              <h3 className="mt-1.5 font-display text-[15px] font-semibold leading-snug">
                {r.title}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
