import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSiteSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { getGoogleReviews } from "@/lib/google-reviews";
import { STORE_CATEGORIES, STORE_PRODUCTS } from "@/lib/store";
import StoreCatalog from "@/components/store/StoreCatalog";
import { HowToOrder, TrustStrip } from "@/components/store/StoreSections";

export function generateStaticParams() {
  return STORE_CATEGORIES.map((c) => ({ kategori: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ kategori: string }> }): Promise<Metadata> {
  const { kategori } = await params;
  const c = STORE_CATEGORIES.find((x) => x.slug === kategori);
  if (!c) return {};
  return {
    ...buildMetadata({ title: `${c.name} ve Fiyatları`, description: c.intro, path: `/magaza/${c.slug}` }),
    robots: { index: false, follow: true },
  };
}

export default async function StoreCategoryPage({ params }: { params: Promise<{ kategori: string }> }) {
  const { kategori } = await params;
  const category = STORE_CATEGORIES.find((x) => x.slug === kategori);
  if (!category) notFound();
  const [site, google] = await Promise.all([getSiteSettings(), getGoogleReviews()]);
  const products = STORE_PRODUCTS.filter((p) => p.category === category.slug);

  return (
    <>
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-10 sm:px-8 sm:py-12">
        <section>
          <nav className="text-[13px] text-slate-soft">
            <Link href="/magaza" className="hover:text-ink">
              Mağaza
            </Link>
            <span className="mx-1.5">/</span>
            {category.name}
          </nav>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{category.name}</h1>
          <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-slate">{category.intro}</p>
        </section>

        <StoreCatalog
          products={products}
          categories={STORE_CATEGORIES}
          whatsappNumber={site.contact.whatsappNumber}
          showCategoryFilter={false}
        />

        <TrustStrip google={google} />
        <HowToOrder />
      </div>
    </>
  );
}
