import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarClock, Check, MessageCircle, Phone, ShieldCheck, Wrench } from "lucide-react";
import { getSiteSettings, whatsappLink, SITE_URL } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { getGoogleReviews } from "@/lib/google-reviews";
import { discountPercent, formatTL, PRICES_UPDATED, STORE_CATEGORIES, STORE_PRODUCTS } from "@/lib/store";
import { productContents, productGallery, productHref, productSpecs } from "@/lib/store-details";
import ProductGallery from "@/components/store/ProductGallery";
import ProductRail from "@/components/store/ProductRail";
import StoreFaq from "@/components/store/StoreFaq";
import TrackedContactLink from "@/components/TrackedContactLink";
import { GoogleRatingBadge } from "@/components/GoogleReviews";
import { HowToOrder } from "@/components/store/StoreSections";

export function generateStaticParams() {
  return STORE_PRODUCTS.map((p) => ({ kategori: p.category, urun: p.slug }));
}

async function find(params: Promise<{ kategori: string; urun: string }>) {
  const { kategori, urun } = await params;
  const product = STORE_PRODUCTS.find((p) => p.slug === urun && p.category === kategori);
  const category = STORE_CATEGORIES.find((c) => c.slug === kategori);
  return product && category ? { product, category } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ kategori: string; urun: string }> }): Promise<Metadata> {
  const found = await find(params);
  if (!found) return {};
  const { product, category } = found;
  return {
    ...buildMetadata({
      title: `${product.name} Fiyatı`,
      description: `${product.name}: ${product.price ? formatTL(product.price) : ""} ${category.short.toLocaleLowerCase("tr-TR")}. Paket içeriği, teknik özellikler ve WhatsApp'tan hızlı sipariş.`,
      path: productHref(product),
    }),
    robots: { index: false, follow: true },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ kategori: string; urun: string }> }) {
  const found = await find(params);
  if (!found) notFound();
  const { product, category } = found;
  const [site, google] = await Promise.all([getSiteSettings(), getGoogleReviews()]);

  const discount = discountPercent(product);
  const gallery = productGallery(product);
  const contents = productContents(product);
  const specs = productSpecs(product);
  const similar = STORE_PRODUCTS.filter((p) => p.category === product.category && p.slug !== product.slug);
  const waHref = whatsappLink(
    site.contact.whatsappNumber,
    `Merhaba, *${product.name}* için sipariş vermek istiyorum.${product.price ? ` (Fiyat: ${formatTL(product.price)})` : ""}\n\nÜrün: ${SITE_URL}${productHref(product)}`
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: gallery,
    description: category.intro,
    brand: { "@type": "Brand", name: "Aktürk Enerji" },
    ...(product.price
      ? {
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: "TRY",
            availability: "https://schema.org/InStock",
            url: `${SITE_URL}${productHref(product)}`,
          },
        }
      : {}),
  };

  const policies = [
    {
      icon: Wrench,
      title: product.installIncluded ? "Kurulum dahil" : "Kurulumsuz paket",
      text: product.installIncluded
        ? "Proje, EDAŞ başvurusu, montaj ve devreye alma fiyata dahil."
        : "Kurulum ve kullanım konusunda destek veriyoruz.",
    },
    { icon: ShieldCheck, title: "Üretici garantili", text: "Garanti süreleri siparişte yazılı bildirilir." },
    { icon: CalendarClock, title: "Montaj 1–3 gün", text: "Şebeke bağlantılı sistemlerde EDAŞ süreci ayrıca sürer." },
    { icon: BadgeCheck, title: "Kendi ekibimizle", text: "2016'dan beri Ankara'da 650+ villa referansı." },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-5 py-6 sm:px-8 sm:py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-[13px] text-slate-soft">
        <Link href="/magaza" className="hover:text-ink">Mağaza</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/magaza/${category.slug}`} className="hover:text-ink">{category.name}</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <section className="-mt-6 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <ProductGallery images={gallery} alt={product.name} badge={discount != null ? `%${discount}` : undefined} />

        <div className="flex flex-col">
          <Link href={`/magaza/${category.slug}`} className="font-mono-data text-[12px] uppercase tracking-[0.14em] text-brand hover:text-ink">
            {category.name}
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold leading-tight tracking-tight sm:text-[2rem]">{product.name}</h1>
          {google && (
            <div className="mt-3">
              <GoogleRatingBadge data={google} tone="light" />
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-line bg-paper-raised p-5">
            {discount != null && product.listPrice != null && (
              <div className="flex items-center gap-2">
                <span className="text-[15px] text-slate-soft line-through">{formatTL(product.listPrice)}</span>
                <span className="rounded-full bg-[#e8562a] px-2.5 py-0.5 text-[12.5px] font-bold text-white">%{discount} indirim</span>
              </div>
            )}
            <p className="mt-1 font-display text-[2rem] font-bold leading-tight tracking-tight text-ink">
              {product.price != null ? formatTL(product.price) : "Fiyat için sorun"}
            </p>
            <p className="text-[12.5px] text-slate-soft">KDV dahil · Fiyatlar {PRICES_UPDATED} itibarıyla geçerlidir</p>

            <ul className="mt-4 flex flex-col gap-1.5">
              {contents.slice(0, 3).map((c) => (
                <li key={c} className="flex items-start gap-2 text-[14px] text-slate">
                  <Check size={16} className="mt-0.5 shrink-0 text-volt" /> {c}
                </li>
              ))}
            </ul>

            <TrackedContactLink
              method="whatsapp"
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 text-[16px] font-bold text-white transition-transform hover:scale-[1.02]"
            >
              <MessageCircle size={19} fill="currentColor" />
              WhatsApp&apos;tan Sipariş Ver
            </TrackedContactLink>
            <TrackedContactLink
              method="call"
              href={site.contact.phoneHref}
              className="mt-2.5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-line px-5 text-[14.5px] font-semibold text-ink hover:border-ink"
            >
              <Phone size={16} /> Uzmanımızı arayın: {site.contact.phoneDisplay}
            </TrackedContactLink>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {policies.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-start gap-2.5 rounded-xl border border-line bg-paper-raised p-3">
                <Icon size={18} className="mt-0.5 shrink-0 text-brand" />
                <span>
                  <span className="block text-[13.5px] font-semibold text-ink">{title}</span>
                  <span className="block text-[12px] leading-snug text-slate">{text}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-paper-raised p-6">
          <h2 className="font-display text-xl font-semibold tracking-tight">Paket içeriği</h2>
          <ul className="mt-4 flex flex-col gap-2.5">
            {contents.map((c) => (
              <li key={c} className="flex items-start gap-2.5 text-[14.5px] text-slate">
                <Check size={17} className="mt-0.5 shrink-0 text-volt" /> {c}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-line bg-paper-raised p-6">
          <h2 className="font-display text-xl font-semibold tracking-tight">Teknik özellikler</h2>
          <table className="mt-4 w-full text-[14px]">
            <tbody>
              {specs.map(([k, v]) => (
                <tr key={k} className="border-t border-line first:border-t-0">
                  <th className="py-2.5 pr-4 text-left font-medium text-slate">{k}</th>
                  <td className="py-2.5 text-right font-semibold text-ink">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-paper-raised p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold tracking-tight">Ürün açıklaması</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-slate">{category.intro}</p>
        <p className="mt-3 text-[15px] leading-relaxed text-slate">
          Kesin sistem gücü, panel yerleşimi ve malzeme listesi; çatınızın ve tüketiminizin incelendiği keşif sonrası
          netleşir. Sipariş öncesi uzmanımız sizi arayarak sistemin evinize uygunluğunu birlikte kontrol eder.
        </p>
      </section>

      <ProductRail title="Benzer paketler" products={similar} whatsappNumber={site.contact.whatsappNumber} />

      <HowToOrder />
      <StoreFaq />
    </div>
  );
}
