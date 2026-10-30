import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/data";
import { getStoreProducts } from "@/lib/store-data";
import { productHref } from "@/lib/store-details";
import SulamaCalculator from "@/components/hesaplama/SulamaCalculator";

// Onay sürecinde arama motorlarına kapalı; yayına alınınca robots satırı kaldırılır.
export const metadata: Metadata = {
  ...buildMetadata({
    title: "Güneş Enerjili Sulama Hesaplama: Kaç HP Pompa, Kaç Panel Gerekir?",
    description:
      "Arazinizin büyüklüğü, ürününüz, sulama yönteminiz ve kuyu derinliğinize göre gereken pompa gücünü, güneş paneli sistemini ve mazot tasarrufunu hesaplayın.",
    path: "/hesaplama/tarimsal-sulama",
  }),
  robots: { index: false, follow: false },
};

export default async function SulamaCalculatorPage() {
  const [products, site] = await Promise.all([getStoreProducts(), getSiteSettings()]);
  // Paket gücü ürün adındaki pompa gücünden (kW) okunur; "power" alanı HP tutar.
  const packages = products
    .filter((p) => p.category === "tarimsal-sulama-paketleri")
    .map((p) => ({ slug: p.slug, name: p.name, kw: Number(p.name.match(/([\d,]+)\s*kW/i)?.[1]?.replace(",", ".")), price: p.price ?? undefined, href: productHref(p) }))
    .filter((p) => p.kw > 0);

  return (
    <main className="bg-paper">
      <section className="border-b border-line bg-ink text-paper">
        <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
          <p className="font-mono-data text-[12px] uppercase tracking-[0.18em] text-sun">Güneş enerjili sulama hesaplama</p>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-tight sm:text-[40px]">
            Kuyunuz için kaç HP pompa ve kaç panel gerekir, mazottan ne kadar kurtulursunuz?
          </h1>
          <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-paper/75">
            Dört adımda öğrenin. Hesap; ürününüzün su ihtiyacı, sulama yönteminiz, kuyu derinliğiniz ve arazinizin uydu tabanlı güneş verisiyle yapılır.
          </p>
        </div>
      </section>
      <div className="px-5 py-10 sm:px-8 sm:py-14">
        <SulamaCalculator packages={packages} contact={{ phone: site.contact.phoneDisplay, whatsapp: site.contact.whatsappNumber }} />
      </div>
    </main>
  );
}
