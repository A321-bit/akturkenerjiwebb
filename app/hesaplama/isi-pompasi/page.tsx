import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/data";
import { getStoreProducts } from "@/lib/store-data";
import { kwOf, productHref } from "@/lib/store-details";
import HeatPumpCalculator from "@/components/hesaplama/HeatPumpCalculator";

// Onay sürecinde arama motorlarına kapalı; yayına alınınca robots satırı kaldırılır.
export const metadata: Metadata = {
  ...buildMetadata({
    title: "Isı Pompası Hesaplama: Kaç kW Gerekir, Ne Kadar Tasarruf Sağlar?",
    description:
      "Evinizin alanı, yalıtımı ve bulunduğunuz ilin saatlik sıcaklık verisiyle ısı pompası gücünü, yıllık ısınma giderini ve doğalgaza göre tasarrufu hesaplayın.",
    path: "/hesaplama/isi-pompasi",
  }),
  robots: { index: false, follow: false },
};

export default async function HeatPumpCalculatorPage() {
  const [products, site] = await Promise.all([getStoreProducts(), getSiteSettings()]);
  const pick = (category: string) =>
    products
      .filter((p) => p.category === category)
      .map((p) => ({ slug: p.slug, name: p.name, kw: kwOf(p), price: p.price ?? undefined, href: productHref(p) }))
      .filter((p) => !Number.isNaN(p.kw));
  // Havuz ısı pompaları bina ısıtmasında önerilmez.
  const devices = pick("isi-pompasi-urunleri").filter((p) => !/havuz/i.test(p.name));
  const solarPackages = pick("on-grid-paketler");

  return (
    <main className="bg-paper">
      <section className="border-b border-line bg-ink text-paper">
        <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
          <p className="font-mono-data text-[12px] uppercase tracking-[0.18em] text-sun">Isı pompası hesaplama</p>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-tight sm:text-[40px]">
            Evinize kaç kW ısı pompası gerekir, ısınma giderinizi ne kadar düşürür?
          </h1>
          <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-paper/75">
            Dört adımda öğrenin. Hesap; bulunduğunuz yerin saatlik sıcaklık verisi, binanızın yalıtımı, tesisatınızın su sıcaklığı ve güncel elektrik tarifesiyle yapılır; bugünkü yakıtınızla karşılaştırılır.
          </p>
        </div>
      </section>
      <div className="px-5 py-10 sm:px-8 sm:py-14">
        <HeatPumpCalculator devices={devices} solarPackages={solarPackages} contact={{ phone: site.contact.phoneDisplay, whatsapp: site.contact.whatsappNumber }} />
      </div>
    </main>
  );
}
