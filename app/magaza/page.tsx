import type { Metadata } from "next";
import { getReferences, getSiteSettings } from "@/lib/data";
import { getGoogleReviews } from "@/lib/google-reviews";
import GoogleReviews from "@/components/GoogleReviews";
import ProductRail from "@/components/store/ProductRail";
import InstalledProjects from "@/components/store/InstalledProjects";
import StoreFaq from "@/components/store/StoreFaq";
import { buildMetadata } from "@/lib/seo";
import { cardCategory, cardProduct, priceNoteText } from "@/lib/store";
import { getStoreCategories, getStoreProducts, getStoreSettings, getStoreSlides } from "@/lib/store-data";
import CategoryShelf from "@/components/store/CategoryShelf";
import { withRatings } from "@/lib/reviews";
import { HowToOrder } from "@/components/store/StoreSections";
import StoreSlider from "@/components/store/StoreSlider";
import StoreSidebar from "@/components/store/StoreSidebar";
import CalculatorCta from "@/components/store/CalculatorCta";

// Mağaza şablon aşamasında; ürünler ve tasarım netleşene kadar Google'a kapalı.
export const metadata: Metadata = {
  ...buildMetadata({
    title: "Güneş Enerjisi Paketleri ve Ürünleri Mağazası",
    description:
      "On grid, off grid, hibrit lityum bataryalı ve öztüketim güneş paneli paketleri; güneş paneli, invertör ve lityum batarya. Fiyatlı paketler, WhatsApp'tan hızlı sipariş.",
    path: "/magaza",
  }),
  robots: { index: false, follow: true },
};

export default async function StorePage() {
  const [site, references, google, categories, allProducts, slides, store] = await Promise.all([
    getSiteSettings(),
    getReferences(),
    getGoogleReviews(),
    getStoreCategories(),
    getStoreProducts().then(withRatings).then((ps) => ps.map(cardProduct)),
    getStoreSlides(),
    getStoreSettings(),
  ]);
  const featured = allProducts.filter((p) => p.featured);

  return (
    <div className="flex flex-col gap-12">
      <h1 className="sr-only">Aktürk Enerji Mağaza: Güneş Enerjisi Paketleri ve Ürünleri</h1>

      {/* Klasik e-ticaret girişi: solda kategori menüsü, yanında slider. */}
      <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-stretch lg:gap-8">
        <StoreSidebar
          attached
          categories={categories.map((c) => ({
            slug: c.slug,
            name: c.name,
            icon: c.icon,
            count: allProducts.filter((p) => p.category === c.slug).length,
          }))}
        />
        {slides.length > 0 && (
          // Masaüstünde slider, yanındaki kategori menüsüyle aynı hizada biter.
          <div className="relative">
            <div className="lg:absolute lg:inset-x-0 lg:bottom-0 lg:top-6">
              <StoreSlider slides={slides} />
            </div>
          </div>
        )}
      </div>

      <CalculatorCta />

      {categories.map((c) => {
        const products = allProducts.filter((p) => p.category === c.slug);
        return products.length > 0 ? (
          <CategoryShelf key={c.slug} category={cardCategory(c)} products={products} whatsappNumber={site.contact.whatsappNumber} />
        ) : null;
      })}

      <ProductRail
        title={store.featuredTitle}
        subtitle={store.featuredSubtitle || undefined}
        products={featured}
        whatsappNumber={site.contact.whatsappNumber}
      />

      <InstalledProjects references={references} categories={categories} />

      {google && (
        <div className="-mx-5 -my-8 sm:-mx-8">
          <GoogleReviews data={google} />
        </div>
      )}

      <HowToOrder steps={store.orderSteps} note={priceNoteText(store)} />
      <StoreFaq faqs={store.faqs} />
    </div>
  );
}
