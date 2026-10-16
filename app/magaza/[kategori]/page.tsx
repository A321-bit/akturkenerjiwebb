import type { Metadata } from "next";
import Link from "next/link";
import { Calculator } from "lucide-react";
import { notFound } from "next/navigation";
import { getSiteSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { getGoogleReviews } from "@/lib/google-reviews";
import { cardCategory, cardProduct, priceNoteText } from "@/lib/store";
import { getStoreCategories, getStoreProducts, getStoreSettings } from "@/lib/store-data";
import StoreCatalog from "@/components/store/StoreCatalog";
import { withRatings } from "@/lib/reviews";
import { HowToOrder, TrustStrip } from "@/components/store/StoreSections";
import MdxContent from "@/components/MdxContent";
import { renderStoreTokens } from "@/lib/store-content";

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
  return {
    ...buildMetadata({
      title: c.seoTitle || `${c.name} ve Fiyatları`,
      description: c.seoDescription || c.intro,
      path: `/magaza/${c.slug}`,
    }),
    robots: { index: false, follow: true },
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

  return (
    <div className="flex min-w-0 flex-col gap-10">
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
          <Link
            href="/magaza/off-grid-hesaplama"
            className="group flex items-center gap-4 rounded-2xl border border-sun/50 bg-sun/10 p-4 transition-colors hover:border-sun sm:p-5"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-sun">
              <Calculator size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[16px] font-semibold text-ink">Hangi paket size yeter? Ücretsiz hesaplayın</span>
              <span className="block text-[13.5px] text-slate">Cihazlarınızı seçin; günlük tüketiminizi, panel ve batarya ihtiyacınızı ve uygun paketi hemen görün.</span>
            </span>
            <span className="hidden rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-paper group-hover:bg-sun group-hover:text-ink sm:block">
              Hesapla
            </span>
          </Link>
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
