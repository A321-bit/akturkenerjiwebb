import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL, getSiteSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { getGoogleReviews } from "@/lib/google-reviews";
import { cardCategory, cardProduct, priceNoteText } from "@/lib/store";
import { getStoreCategories, getStoreProducts, getStoreSettings } from "@/lib/store-data";
import StoreCatalog from "@/components/store/StoreCatalog";
import { withRatings } from "@/lib/reviews";
import { HowToOrder, TrustStrip } from "@/components/store/StoreSections";
import MdxContent from "@/components/MdxContent";
import CalculatorCta from "@/components/store/CalculatorCta";
import { renderStoreTokens } from "@/lib/store-content";
import { productHref } from "@/lib/store-details";

export async function generateStaticParams() {
  const categories = await getStoreCategories();
  return categories.map((c) => ({ kategori: c.slug }));
}

async function findCategory(params: Promise<{ kategori: string }>) {
  const { kategori } = await params;
  const categories = await getStoreCategories();
  return { categories, category: categories.find((x) => x.slug === kategori) };
}

export async function generateMetadata({ params }: { params: Promise<{ kategori: string }> }): Promise<Metadata> {
  const { category: c } = await findCategory(params);
  if (!c) return {};
  // Ürünü henüz olmayan kategori yalnızca "çok yakında" gösterir: Google'a kapalı.
  const hasProducts = (await getStoreProducts()).some((p) => p.category === c.slug);
  return {
    ...buildMetadata({
      title: c.seoTitle || `${c.name} ve Fiyatları`,
      description: c.seoDescription || c.intro,
      path: `/magaza/${c.slug}`,
    }),
    ...(hasProducts ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function StoreCategoryPage({ params }: { params: Promise<{ kategori: string }> }) {
  const { categories, category } = await findCategory(params);
  if (!category) notFound();
  const [site, google, all, store] = await Promise.all([
    getSiteSettings(),
    getGoogleReviews(),
    getStoreProducts(),
    getStoreSettings(),
  ]);
  const products = await withRatings(all.filter((p) => p.category === category.slug));

  const url = `${SITE_URL}/magaza/${category.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: category.name,
        description: category.seoDescription || category.intro,
        inLanguage: "tr-TR",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: products.length,
          itemListElement: products.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}${productHref(p)}`,
            name: p.name,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Mağaza", item: `${SITE_URL}/magaza` },
          { "@type": "ListItem", position: 2, name: category.name, item: url },
        ],
      },
    ],
  };

  return (
    <div className="flex min-w-0 flex-col gap-10">
        {products.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
        <section>
          <nav className="text-[13px] text-slate-soft">
            <Link href="/magaza" className="hover:text-ink">
              Mağaza
            </Link>
            <span className="mx-1.5">/</span>
            {category.name}
          </nav>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{category.name}</h1>
        </section>

        {category.slug === "off-grid-paketler" && (
          <CalculatorCta />
        )}

        <StoreCatalog
          products={products.map(cardProduct)}
          categories={categories.map(cardCategory)}
          whatsappNumber={site.contact.whatsappNumber}
          showCategoryFilter={false}
          narrow
        />

        {/* Kategori açıklaması ürünlerin altında: önce ürünler görünsün, uzun
            SEO yazısı (markdown) aşağıda okunsun. */}
        <section className="rounded-2xl border border-line bg-paper-raised p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{category.name} Hakkında</h2>
          {category.content ? (
            <div className="prose prose-neutral mt-4 max-w-none prose-headings:font-display prose-headings:font-semibold prose-a:text-brand prose-p:text-slate prose-li:text-slate prose-table:text-[14px]">
              <MdxContent source={renderStoreTokens(category.content, products)} />
            </div>
          ) : (
            <p className="mt-3 text-[15px] leading-relaxed text-slate">{category.intro}</p>
          )}
        </section>

        <TrustStrip google={google} items={store.trustItems} />
        <HowToOrder steps={store.orderSteps} note={priceNoteText(store)} />
    </div>
  );
}
