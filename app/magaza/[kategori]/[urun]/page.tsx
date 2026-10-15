import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, MessageCircle, Phone, Star } from "lucide-react";
import { getSiteSettings, whatsappLink, SITE_URL } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { getGoogleReviews } from "@/lib/google-reviews";
import { discountPercent, formatTL, STORE_CATEGORIES, STORE_PRODUCTS } from "@/lib/store";
import { productContents, productGallery, productHref, productSpecs } from "@/lib/store-details";
import ProductGallery from "@/components/store/ProductGallery";
import TrackedContactLink from "@/components/TrackedContactLink";
import MdxContent from "@/components/MdxContent";

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
      description: `${product.name}${product.price ? ` ${formatTL(product.price)}` : ""}. ${category.short}: paket içeriği, teknik özellikler, garanti ve WhatsApp'tan hızlı sipariş.`,
      path: productHref(product),
    }),
    robots: { index: false, follow: true },
  };
}

const SECTIONS = [
  { id: "urun-aciklamasi", label: "Ürün Açıklaması" },
  { id: "teknik-datasheet", label: "Teknik Datasheet" },
  { id: "yorumlar", label: "Yorumlar" },
];

export default async function ProductPage({ params }: { params: Promise<{ kategori: string; urun: string }> }) {
  const found = await find(params);
  if (!found) notFound();
  const { product, category } = found;
  const [site, google] = await Promise.all([getSiteSettings(), getGoogleReviews()]);

  const url = `${SITE_URL}${productHref(product)}`;
  const discount = discountPercent(product);
  const gallery = productGallery(product);
  const specs = productSpecs(product);
  const waHref = whatsappLink(
    site.contact.whatsappNumber,
    `Merhaba, *${product.name}* için sipariş vermek istiyorum.${product.price ? ` (Fiyat: ${formatTL(product.price)})` : ""}\n\nÜrün: ${url}`
  );

  // Makale henüz yazılmadıysa paket içeriğinden kısa bir açıklama üretilir.
  const description =
    product.content ??
    [
      category.intro,
      "",
      `**${product.name}** paketinin içeriği:`,
      "",
      ...productContents(product).map((c) => `- ${c}`),
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
        description: category.intro,
        category: category.name,
        brand: { "@type": "Brand", name: "Aktürk Enerji" },
        ...(product.price
          ? {
              offers: {
                "@type": "Offer",
                price: product.price,
                priceCurrency: "TRY",
                availability: "https://schema.org/InStock",
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
              <p className="text-[13px] font-medium text-slate">KDV Dahil</p>

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
                className="mt-2.5 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full border border-line px-5 text-[15px] font-semibold text-ink hover:border-ink"
              >
                <Phone size={17} /> Bizi Arayın: {site.contact.phoneDisplay}
              </TrackedContactLink>
            </div>
          </div>
        </section>
      </div>

      {/* Bölüm gezinmesi: tüm içerik sayfada (Google tamamını okur), sekmeler
          sadece ilgili bölüme kaydırır. */}
      <nav aria-label="Ürün bilgileri" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-[14.5px] font-semibold text-slate hover:border-sun hover:text-ink"
          >
            {s.label}
          </a>
        ))}
      </nav>

      <section id="urun-aciklamasi" className="scroll-mt-32">
        <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">Ürün Açıklaması</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-headings:font-display prose-headings:font-semibold prose-a:text-brand prose-p:text-slate prose-li:text-slate prose-table:text-[14px] prose-th:bg-paper-raised prose-th:px-3 prose-td:px-3">
          <MdxContent source={description} />
        </div>
      </section>

      <section id="teknik-datasheet" className="scroll-mt-32">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">Teknik Datasheet</h2>
          {product.datasheet && (
            <a
              href={product.datasheet}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[13.5px] font-semibold text-ink hover:border-ink"
            >
              <FileText size={16} /> Datasheet&apos;i indir (PDF)
            </a>
          )}
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-paper-raised">
          <table className="w-full text-[14.5px]">
            <tbody>
              {specs.map(([k, v]) => (
                <tr key={k} className="border-t border-line first:border-t-0 even:bg-paper">
                  <th scope="row" className="w-1/2 px-5 py-3 text-left font-medium text-slate">{k}</th>
                  <td className="px-5 py-3 font-semibold text-ink">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="yorumlar" className="scroll-mt-32">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">Yorumlar</h2>
          {google && (
            <a href={google.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[14px] text-slate hover:text-ink">
              <Star size={16} className="fill-sun text-sun" />
              <strong className="text-ink">{google.rating.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</strong>
              · Google&apos;da {google.count} yorum
            </a>
          )}
        </div>
        {google && google.reviews.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {google.reviews.slice(0, 4).map((r, i) => (
              <figure key={`${r.author}-${i}`} className="rounded-2xl border border-line bg-paper-raised p-5">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={14} className={n <= r.rating ? "fill-sun text-sun" : "fill-line text-line"} />
                  ))}
                </div>
                <blockquote className="mt-2 line-clamp-6 text-[14.5px] leading-relaxed text-ink">&ldquo;{r.text}&rdquo;</blockquote>
                <figcaption className="mt-3 text-[13px] text-slate">
                  <span className="font-semibold text-ink">{r.author}</span> · {r.relativeTime} · Google
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[14.5px] text-slate">Müşteri yorumlarımızı Google işletme sayfamızda okuyabilirsiniz.</p>
        )}
      </section>
    </div>
  );
}
