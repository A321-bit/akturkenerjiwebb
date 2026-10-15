import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSiteSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { getGoogleReviews } from "@/lib/google-reviews";
import { STORE_CATEGORIES, STORE_PRODUCTS } from "@/lib/store";
import StoreCatalog from "@/components/store/StoreCatalog";
import { HowToOrder, TrustStrip } from "@/components/store/StoreSections";
import StoreSidebar from "@/components/store/StoreSidebar";
import MdxContent from "@/components/MdxContent";

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
    <div className="mx-auto grid max-w-6xl gap-8 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[270px_1fr] lg:items-start">
      <div className="lg:sticky lg:top-28">
        <StoreSidebar />
      </div>

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

        <StoreCatalog
          products={products}
          categories={STORE_CATEGORIES}
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
              <MdxContent source={category.content} />
            </div>
          ) : (
            <p className="mt-3 text-[15px] leading-relaxed text-slate">{category.intro}</p>
          )}
        </section>

        <TrustStrip google={google} />
        <HowToOrder />
      </div>
    </div>
  );
}
