import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { getGoogleReviews } from "@/lib/google-reviews";
import { STORE_CATEGORIES, STORE_PRODUCTS, STORE_SLIDES } from "@/lib/store";
import StoreCatalog from "@/components/store/StoreCatalog";
import { HowToOrder, TrustStrip } from "@/components/store/StoreSections";
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
  const [site, google] = await Promise.all([getSiteSettings(), getGoogleReviews()]);
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-6 sm:px-8 sm:py-8">
      <h1 className="sr-only">Aktürk Enerji Mağaza: Güneş Enerjisi Paketleri ve Ürünleri</h1>

      <section className="grid gap-4 lg:grid-cols-[270px_1fr] lg:items-stretch">
        <StoreSidebar />
        <StoreSlider slides={STORE_SLIDES} />
      </section>

      <TrustStrip google={google} />

      <section>
        <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">Tüm ürünler</h2>
        <div className="mt-4">
          <StoreCatalog
            products={STORE_PRODUCTS}
            categories={STORE_CATEGORIES}
            whatsappNumber={site.contact.whatsappNumber}
          />
        </div>
      </section>

      <HowToOrder />
    </div>
  );
}
