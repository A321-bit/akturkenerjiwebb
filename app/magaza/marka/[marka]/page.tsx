import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL, getSiteSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { getGoogleReviews } from "@/lib/google-reviews";
import { cardCategory, cardProduct, priceNoteText } from "@/lib/store";
import { getStoreCategories, getStoreProducts, getStoreSettings } from "@/lib/store-data";
import { STORE_BRANDS, brandProducts } from "@/lib/store-brands";
import { kwOf, productHref } from "@/lib/store-details";
import StoreCatalog from "@/components/store/StoreCatalog";
import PriceTable from "@/components/store/PriceTable";
import { HowToOrder, TrustStrip } from "@/components/store/StoreSections";

// Marka sayfası: "Deye inverter fiyatları" gibi aramalar için markanın tüm ürünleri, güce göre fiyat listesi.
export const revalidate = 86400;

export function generateStaticParams() {
  return STORE_BRANDS.map((b) => ({ marka: b.slug }));
}

async function load(params: Promise<{ marka: string }>) {
  const { marka } = await params;
  const brand = STORE_BRANDS.find((b) => b.slug === marka);
  if (!brand) return null;
  const products = brandProducts(brand, await getStoreProducts());
  return { brand, products };
}

export async function generateMetadata({ params }: { params: Promise<{ marka: string }> }): Promise<Metadata> {
  const d = await load(params);
  if (!d) return {};
  return {
    ...buildMetadata({ title: d.brand.title, description: d.brand.description, path: `/magaza/marka/${d.brand.slug}` }),
    ...(d.products.length ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function StoreBrandPage({ params }: { params: Promise<{ marka: string }> }) {
  const d = await load(params);
  if (!d) notFound();
  const { brand, products } = d;
  const [site, google, categories, store] = await Promise.all([getSiteSettings(), getGoogleReviews(), getStoreCategories(), getStoreSettings()]);

  // Ürünler mağazadaki kategori sırasıyla gruplanır, grup içinde güce göre sıralanır.
  const groups = categories
    .map((c) => ({ category: c, items: products.filter((p) => p.category === c.slug).sort((a, b) => kwOf(a) - kwOf(b)) }))
    .filter((g) => g.items.length);

  const url = `${SITE_URL}/magaza/marka/${brand.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: brand.title,
        description: brand.description,
        inLanguage: "tr-TR",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@type": "Brand", name: brand.name },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: products.length,
          itemListElement: products.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}${productHref(p)}`, name: p.name })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Mağaza", item: `${SITE_URL}/magaza` },
          { "@type": "ListItem", position: 2, name: brand.name, item: url },
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
          {brand.name}
        </nav>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{brand.title}</h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-slate">{brand.intro}</p>
      </section>

      {products.length === 0 ? (
        <p className="text-[15px] text-slate">Bu markanın ürünleri yakında mağazada.</p>
      ) : (
        <>
          <section className="flex flex-col gap-8">
            {groups.map((g) => (
              <div key={g.category.slug}>
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                    {brand.name} {g.category.name} Fiyat Listesi
                  </h2>
                  <Link href={`/magaza/${g.category.slug}`} className="text-[13.5px] font-medium text-brand hover:text-ink">
                    Tüm {g.category.name.toLocaleLowerCase("tr")} →
                  </Link>
                </div>
                <PriceTable products={g.items} caption={`${brand.name} ${g.category.name} fiyat listesi`} />
              </div>
            ))}
            {store.pricesUpdated && <p className="text-[13px] text-slate-soft">{priceNoteText(store)}</p>}
          </section>

          <StoreCatalog
            products={products.map(cardProduct)}
            categories={categories.map(cardCategory)}
            whatsappNumber={site.contact.whatsappNumber}
            showCategoryFilter={false}
            narrow
          />
        </>
      )}

      <TrustStrip google={google} items={store.trustItems} />
      <HowToOrder steps={store.orderSteps} note={priceNoteText(store)} />
    </div>
  );
}
