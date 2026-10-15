import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { getGoogleReviews } from "@/lib/google-reviews";
import { STORE_CATEGORIES, STORE_PRODUCTS } from "@/lib/store";
import StoreCatalog from "@/components/store/StoreCatalog";
import { CategoryTiles, HowToOrder, StoreSubnav, TrustStrip } from "@/components/store/StoreSections";

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
  const packages = STORE_CATEGORIES.filter((c) => c.group === "Paketler");
  const parts = STORE_CATEGORIES.filter((c) => c.group === "Ürünler");

  return (
    <>
      <StoreSubnav />

      <section className="relative overflow-hidden bg-ink text-paper">
        <div className="grid-texture absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <p className="font-mono-data text-[12px] uppercase tracking-[0.18em] text-sun-soft">Aktürk Enerji Mağaza</p>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight sm:text-[2.6rem]">
            Güneş enerjisi paketleri ve ürünleri, fiyatlarıyla
          </h1>
          <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-slate-soft">
            On grid, off grid, hibrit ve öztüketim paketlerini karşılaştırın; beğendiğiniz paketi tek tuşla
            WhatsApp&apos;tan sipariş edin, uzmanımız sizi arasın.
          </p>
        </div>
      </section>

      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-5 py-10 sm:px-8 sm:py-14">
        <section>
          <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">Güneş paneli paketleri</h2>
          <div className="mt-4">
            <CategoryTiles categories={packages} />
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">Ürünler</h2>
          <div className="mt-4">
            <CategoryTiles categories={parts} />
          </div>
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
    </>
  );
}
