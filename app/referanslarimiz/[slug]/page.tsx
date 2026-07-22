import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Zap, Calendar } from "lucide-react";
import { getReferences, getReferenceBySlug, getSiteSettings, whatsappLink, SITE_URL } from "@/lib/data";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import CoverMedia from "@/components/CoverMedia";
import MediaCarousel from "@/components/MediaCarousel";
import QuoteModal from "@/components/QuoteModal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const reference = await getReferenceBySlug(slug);
  if (!reference) return {};
  return buildMetadata({
    title: reference.title,
    description: reference.description ?? reference.summary,
    path: `/referanslarimiz/${reference.slug}`,
    keywords: [reference.title, reference.category, reference.location, "güneş enerjisi sistemi", "GES"],
  });
}

export default async function ReferenceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const reference = await getReferenceBySlug(slug);
  if (!reference) notFound();
  const site = await getSiteSettings();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Project",
        name: reference.title,
        description: reference.description ?? reference.summary,
        locationCreated: reference.location,
        dateCreated: reference.year,
      },
      breadcrumbJsonLd([
        { name: "Anasayfa", path: "/" },
        { name: "Referanslarımız", path: "/referanslarimiz" },
        { name: reference.title, path: `/referanslarimiz/${reference.slug}` },
      ]),
    ],
  };

  const allReferences = await getReferences();
  const others = allReferences.filter((r) => r.slug !== reference.slug).slice(0, 3);

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

      <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-sun/40 bg-sun/10 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-[16px] font-semibold leading-snug text-ink">
          Sizde çatınızdan bedava elektrik üretmek için şimdi ücretsiz teklif alın.
        </p>
        <QuoteModal
          defaultPurpose={reference.category}
          className="shrink-0"
          whatsappNumber={site.contact.whatsappNumber}
        />
      </div>

      <CoverMedia
        src={reference.image}
        alt={reference.title}
        label={reference.category}
        aspect="aspect-[16/9]"
        iconSize={72}
        className="mt-8"
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-line bg-paper-raised">
          <h2 className="border-b border-line px-6 py-3.5 font-mono-data text-[11px] uppercase tracking-[0.14em] text-brand">
            Teknik Detaylar
          </h2>
          <table className="w-full text-[14px]">
            <tbody>
              <tr className="border-b border-line">
                <th className="w-1/3 px-6 py-3 text-left font-medium text-slate-soft">Kategori</th>
                <td className="px-6 py-3 font-semibold text-ink">{reference.category}</td>
              </tr>
              <tr className="border-b border-line">
                <th className="px-6 py-3 text-left font-medium text-slate-soft">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-brand" /> Konum
                  </span>
                </th>
                <td className="px-6 py-3 font-semibold text-ink">{reference.location}</td>
              </tr>
              {reference.address && (
                <tr className="border-b border-line">
                  <th className="px-6 py-3 text-left font-medium text-slate-soft">Açık Adres</th>
                  <td className="px-6 py-3 font-semibold text-ink">{reference.address}</td>
                </tr>
              )}
              <tr className="border-b border-line">
                <th className="px-6 py-3 text-left font-medium text-slate-soft">
                  <span className="flex items-center gap-1.5">
                    <Zap size={13} className="text-brand" /> Kurulu Güç
                  </span>
                </th>
                <td className="px-6 py-3 font-semibold text-ink">{reference.capacity}</td>
              </tr>
              <tr>
                <th className="px-6 py-3 text-left font-medium text-slate-soft">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-brand" /> Kurulum Yılı
                  </span>
                </th>
                <td className="px-6 py-3 font-semibold text-ink">{reference.year}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-paper-raised">
          <iframe
            title={`${reference.title} konumu`}
            src={`https://www.google.com/maps?q=${encodeURIComponent(
              reference.address || reference.location
            )}&output=embed`}
            className="h-full min-h-[220px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      {((reference.gallery && reference.gallery.length > 0) || reference.video) && (
        <div className="mt-10">
          <h2 className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
            Saha ve Drone Görüntüleri
          </h2>
          <div className="mt-4">
            <MediaCarousel
              images={reference.gallery ?? []}
              videoUrl={reference.video}
              title={reference.title}
            />
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={whatsappLink(
            site.contact.whatsappNumber,
            `Merhaba, "${reference.title}" projesi gibi bir sistem hakkında bilgi almak istiyorum.\n\nSayfa: ${SITE_URL}/referanslarimiz/${reference.slug}`
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[14.5px] font-semibold text-paper transition-colors hover:bg-sun hover:text-ink"
        >
          WhatsApp&apos;tan Sor
        </a>
        <QuoteModal
          label="Ücretsiz Keşif Talep Et"
          variant="sun"
          redirectTo="iletisim"
          defaultPurpose={reference.category}
          whatsappNumber={site.contact.whatsappNumber}
        />
      </div>

      <div className="mt-16">
        <h2 className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
          Diğer referanslar
        </h2>
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
