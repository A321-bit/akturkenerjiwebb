import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { STORE_CATEGORIES, STORE_PRODUCTS, STORE_SLIDES } from "@/lib/store";
import CategoryShelf from "@/components/store/CategoryShelf";
import { HowToOrder } from "@/components/store/StoreSections";
import StoreSidebar from "@/components/store/StoreSidebar";
import StoreSlider from "@/components/store/StoreSlider";

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
  const site = await getSiteSettings();
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-6 sm:px-8 sm:py-8">
      <h1 className="sr-only">Aktürk Enerji Mağaza: Güneş Enerjisi Paketleri ve Ürünleri</h1>

      <section className="grid gap-4 lg:grid-cols-[270px_1fr] lg:items-stretch">
        <StoreSidebar />
        <StoreSlider slides={STORE_SLIDES} />
      </section>

      {STORE_CATEGORIES.map((c) => {
        const products = STORE_PRODUCTS.filter((p) => p.category === c.slug);
        return products.length > 0 ? (
          <CategoryShelf key={c.slug} category={c} products={products} whatsappNumber={site.contact.whatsappNumber} />
        ) : null;
      })}

      <HowToOrder />
    </div>
  );
}
