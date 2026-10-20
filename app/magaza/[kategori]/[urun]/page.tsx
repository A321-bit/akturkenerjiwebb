import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileText, MessageCircle } from "lucide-react";
import { getSiteSettings, whatsappLink, SITE_URL } from "@/lib/data";
import { buildMetadata, ogImagePath } from "@/lib/seo";
import { getApprovedReviews, withRatings } from "@/lib/reviews";
import { cardProduct, discountPercent, priceLabel } from "@/lib/store";
import { getStoreCategories, getStoreProducts } from "@/lib/store-data";
import { kwOf, productBrand, productGallery, productHref } from "@/lib/store-details";
import ProductGallery from "@/components/store/ProductGallery";
import TrackedContactLink from "@/components/TrackedContactLink";
import MdxContent from "@/components/MdxContent";
import { renderStoreTokens } from "@/lib/store-content";
import ProductTabs from "@/components/store/ProductTabs";
import ProductRail from "@/components/store/ProductRail";
import ReviewForm from "@/components/store/ReviewForm";
import Stars from "@/components/store/Stars";
import ProductBuyBox from "@/components/store/ProductBuyBox";
import PackageCompleter from "@/components/store/PackageCompleter";
import { PACKAGE_COMPLETE_CATEGORIES, packageCompleteData } from "@/lib/package-complete-data";

export async function generateStaticParams() {
  const products = await getStoreProducts();
  return products.map((p) => ({ kategori: p.category, urun: p.slug }));
}

async function find(params: Promise<{ kategori: string; urun: string }>) {
  const { kategori, urun } = await params;
  const [products, categories] = await Promise.all([getStoreProducts(), getStoreCategories()]);
  const product = products.find((p) => p.slug === urun && p.category === kategori);
  const category = categories.find((c) => c.slug === kategori);
  return product && category ? { product, category, products } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ kategori: string; urun: string }> }): Promise<Metadata> {
  const found = await find(params);
  if (!found) return {};
  const { product, category } = found;
  return {
    ...buildMetadata({
      title: product.seoTitle || `${product.name} Fiyatı`,
      description: product.seoDescription || `${product.name}${product.price ? ` ${priceLabel(product)}` : ""}. ${category.short}: paket içeriği, teknik özellikler, garanti ve WhatsApp'tan hızlı sipariş.`,
      path: productHref(product),
      image: ogImagePath("urun", product.slug),
    }),
  };
}

const fmtRating = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export default async function ProductPage({ params }: { params: Promise<{ kategori: string; urun: string }> }) {
  const found = await find(params);
  if (!found) notFound();
  const { product, category, products } = found;
  const [site, reviews, others, completeData] = await Promise.all([
    getSiteSettings(),
    getApprovedReviews(product.slug),
    withRatings(products.filter((p) => p.slug !== product.slug)),
    PACKAGE_COMPLETE_CATEGORIES.has(product.category) ? packageCompleteData(product) : Promise.resolve(null),
  ]);

  const rating = reviews.length
    ? { avg: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length, count: reviews.length }
    : null;

  // Benzer ürünler: önce aynı kategori, ardından gücü en yakın diğer paketler.
  const kw = kwOf(product) || 0;
  const powerGap = (p: (typeof others)[number]) => Math.abs((kwOf(p) || 0) - kw);
  const similar = [
    ...others.filter((p) => p.category === product.category),
    ...others.filter((p) => p.category !== product.category).sort((a, b) => powerGap(a) - powerGap(b)),
  ].slice(0, 8);

  const url = `${SITE_URL}${productHref(product)}`;
  const discount = discountPercent(product);
  const optionPrices = product.options.map((o) => o.price).filter((n): n is number => n != null);
  const gallery = productGallery(product);
  const datasheetWaHref = whatsappLink(
    site.contact.whatsappNumber,
    `Merhaba, *${product.name}* paketinin teknik datasheet dosyasını alabilir miyim?\n\nÜrün: ${url}`
  );

  // Makale henüz yazılmadıysa paket içeriğinden kısa bir açıklama üretilir.
  const description =
    product.content ??
    [
      category.intro,
      "",
      `**${product.name}** paketinin içeriği:`,
      "",
      ...product.contents.map((c) => `- ${c}`),
      "",
      "Kesin sistem gücü, panel yerleşimi ve malzeme listesi çatınızın ve tüketiminizin incelendiği keşif sonrası netleşir.",
    ].join("\n");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name,
        image: gallery,
        description: product.seoDescription || category.intro,
        sku: product.slug,
        category: category.name,
        brand: { "@type": "Brand", name: productBrand(product) },
        // Puan yalnızca gerçek, onaylı yorum varsa eklenir.
        ...(rating
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: Number(rating.avg.toFixed(1)),
                reviewCount: rating.count,
                bestRating: 5,
                worstRating: 1,
              },
              review: reviews.slice(0, 5).map((r) => ({
                "@type": "Review",
                author: { "@type": "Person", name: r.name },
                datePublished: r.created_at.slice(0, 10),
                reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
                reviewBody: r.comment,
              })),
            }
          : {}),
        ...(optionPrices.length > 1
          ? {
              offers: {
                "@type": "AggregateOffer",
                lowPrice: Math.min(...optionPrices),
                highPrice: Math.max(...optionPrices),
                offerCount: optionPrices.length,
                priceCurrency: "TRY",
                availability: "https://schema.org/InStock",
                url,
                seller: { "@type": "Organization", name: site.name },
              },
            }
          : product.price
          ? {
              offers: {
                "@type": "Offer",
                price: product.price,
                priceCurrency: "TRY",
                availability: "https://schema.org/InStock",
                itemCondition: "https://schema.org/NewCondition",
                url,
                seller: { "@type": "Organization", name: site.name },
              },
            }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Mağaza", item: `${SITE_URL}/magaza` },
          { "@type": "ListItem", position: 2, name: category.name, item: `${SITE_URL}/magaza/${category.slug}` },
          { "@type": "ListItem", position: 3, name: product.name, item: url },
        ],
      },
    ],
  };

  return (
    <div className="flex flex-col gap-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div>
        <nav aria-label="Sayfa yolu" className="text-[13px] text-slate-soft">
          <Link href="/magaza" className="hover:text-ink">Mağaza</Link>
          <span className="mx-1.5">/</span>
          <Link href={`/magaza/${category.slug}`} className="hover:text-ink">{category.name}</Link>
          <span className="mx-1.5">/</span>
          <span className="text-ink">{product.name}</span>
        </nav>

        <section className="mt-4 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          <ProductGallery images={gallery} alt={product.name} badge={discount != null ? `%${discount}` : undefined} />

          <div className="flex flex-col">
            <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight sm:text-[2rem]">{product.name}</h1>
            <a href="#yorumlar" className="mt-2 flex flex-wrap items-center gap-2 text-[13.5px] text-slate hover:text-ink">
              <Stars value={rating?.avg ?? 0} size={16} />
              {rating ? (
                <span>
                  <strong className="text-ink">{fmtRating(rating.avg)}</strong> · {rating.count} değerlendirme
                </span>
              ) : (
                <span>Henüz değerlendirme yok · İlk yorumu siz yazın</span>
              )}
            </a>

            <ProductBuyBox
              name={product.name}
              url={url}
              price={product.price}
              listPrice={product.listPrice}
              options={product.options}
              whatsappNumber={site.contact.whatsappNumber}
              phoneHref={site.contact.phoneHref}
              phoneDisplay={site.contact.phoneDisplay}
            />
          </div>
        </section>
      </div>

      {completeData && (
        <PackageCompleter
          baseName={product.name}
          basePrice={product.price}
          inverterKw={kw}
          url={url}
          data={completeData}
          whatsappNumber={site.contact.whatsappNumber}
        />
      )}

      <ProductTabs
        tabs={[
          { id: "urun-aciklamasi", label: "Ürün Açıklaması" },
          { id: "teknik-datasheet", label: "Teknik Datasheet" },
          { id: "yorumlar", label: `Yorumlar (${reviews.length})` },
        ]}
        panels={[
          <div
            key="aciklama"
            className="prose prose-neutral max-w-none prose-headings:font-display prose-headings:font-semibold prose-a:text-brand prose-p:text-slate prose-li:text-slate prose-table:text-[14px] prose-th:bg-paper-raised prose-th:px-3 prose-td:px-3"
          >
            <MdxContent source={renderStoreTokens(description, products.filter((p) => p.category === product.category))} />
          </div>,

          <div key="datasheet" className="flex flex-col items-start gap-4 rounded-2xl border border-line bg-paper-raised p-6 sm:flex-row sm:items-center">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <FileText size={28} />
            </span>
            <div className="flex-1">
              <p className="font-display text-[17px] font-semibold text-ink">{product.name} Teknik Datasheet</p>
              <p className="mt-1 text-[14px] text-slate">
                {product.datasheet
                  ? "Paketteki panel, invertör ve batarya bileşenlerinin teknik özellikleri (PDF)."
                  : "Bu paketin datasheet dosyası hazırlanıyor. Hemen ihtiyacınız varsa WhatsApp'tan isteyebilirsiniz."}
              </p>
            </div>
            {product.datasheet ? (
              <a
                href={product.datasheet}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-ink px-5 text-[14.5px] font-semibold text-paper hover:bg-sun hover:text-ink"
              >
                <Download size={17} /> Datasheet İndir (PDF)
              </a>
            ) : (
              <TrackedContactLink
                method="whatsapp"
                label="store_whatsapp_datasheet"
                href={datasheetWaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-line px-5 text-[14.5px] font-semibold text-ink hover:border-ink"
              >
                <MessageCircle size={17} /> WhatsApp&apos;tan İste
              </TrackedContactLink>
            )}
          </div>,

          <div key="yorumlar" className="flex flex-col gap-6">
            {rating ? (
              <div className="flex items-center gap-4 rounded-2xl border border-line bg-paper-raised p-5">
                <p className="font-display text-[2.4rem] font-bold leading-none text-ink">{fmtRating(rating.avg)}</p>
                <div>
                  <Stars value={rating.avg} size={20} />
                  <p className="mt-1 text-[13.5px] text-slate">{rating.count} değerlendirme</p>
                </div>
              </div>
            ) : (
              <p className="text-[14.5px] text-slate">Bu paket için henüz yorum yapılmamış. İlk değerlendirmeyi siz yazın.</p>
            )}

            {reviews.length > 0 && (
              <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-paper-raised">
                {reviews.map((r) => (
                  <li key={r.id} className="p-5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Stars value={r.rating} size={14} />
                      <span className="text-[14px] font-semibold text-ink">{r.name}</span>
                      {r.city && <span className="text-[13px] text-slate">· {r.city}</span>}
                      <span className="text-[12.5px] text-slate-soft">· {new Date(r.created_at).toLocaleDateString("tr-TR")}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-[14.5px] leading-relaxed text-ink">{r.comment}</p>
                  </li>
                ))}
              </ul>
            )}

            <ReviewForm productSlug={product.slug} />
          </div>,
        ]}
      />

      <ProductRail
        title="Benzer Ürünler"
        subtitle="İlginizi çekebilecek diğer paketler"
        products={similar.map(cardProduct)}
        whatsappNumber={site.contact.whatsappNumber}
      />
    </div>
  );
}
