import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { getSiteSettings, SITE_URL } from "@/lib/data";
import { getStoreProducts } from "@/lib/store-data";
import { kwOf, productHref } from "@/lib/store-details";
import { TARIFE_TARIHI } from "@/lib/elektrik-tarife";
import OnGridCalculator from "@/components/hesaplama/OnGridCalculator";

// Onay sürecinde arama motorlarına kapalı; yayına alınınca robots satırı kaldırılır.
export const metadata: Metadata = {
  ...buildMetadata({
    title: "Güneş Paneli Hesaplama: Kaç kW Gerekir, Ne Kadar Kazandırır?",
    description:
      "Faturanızı ve çatınızı girin; EPDK tarifesi ve bulunduğunuz ilin güneş verisiyle kaç kW güneş paneli gerektiğini, yıllık tasarrufu ve geri ödeme süresini hesaplayın.",
    path: "/hesaplama/on-grid",
  }),
  robots: { index: false, follow: false },
};

export default async function OnGridCalculatorPage() {
  const [products, site] = await Promise.all([getStoreProducts(), getSiteSettings()]);
  const packages = products
    .filter((p) => p.category === "on-grid-paketler")
    .map((p) => ({ slug: p.slug, name: p.name, kw: kwOf(p), price: p.price, href: productHref(p) }))
    .filter((p) => !Number.isNaN(p.kw));

  return (
    <main className="bg-paper">
      <section className="border-b border-line bg-ink text-paper">
        <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
          <p className="font-mono-data text-[12px] uppercase tracking-[0.18em] text-sun">Güneş enerjisi hesaplama</p>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-tight sm:text-[40px]">
            Çatınız size ne kadar elektrik üretir, faturanızı ne kadar düşürür?
          </h1>
          <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-paper/75">
            Dört adımda öğrenin. Hesap; EPDK {TARIFE_TARIHI} elektrik tarifesi, bulunduğunuz ilin uydu tabanlı güneş verisi ve mağazamızdaki güncel paket fiyatlarıyla yapılır.
          </p>
        </div>
      </section>
      <div className="px-5 py-10 sm:px-8 sm:py-14">
        <OnGridCalculator
          packages={packages}
          contact={{
            name: site.name,
            phone: site.contact.phoneDisplay,
            whatsapp: site.contact.whatsappNumber,
            email: site.contact.email,
            address: site.contact.addressLine,
            url: SITE_URL,
          }}
        />
      </div>
    </main>
  );
}
