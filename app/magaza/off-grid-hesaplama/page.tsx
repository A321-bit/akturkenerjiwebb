import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { getStoreProducts } from "@/lib/store-data";
import { kwOf, productHref } from "@/lib/store-details";
import OffGridCalculator from "@/components/store/OffGridCalculator";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Off Grid Paket Hesaplama: Bağ Evi İçin Kaç kW Güneş Paneli?",
    description:
      "Bağ eviniz, yayla eviniz ya da çiftliğiniz için kullanacağınız cihazları girin; size uygun off grid güneş enerjisi paketini ücretsiz hesaplayıp WhatsApp'tan iletelim.",
    path: "/magaza/off-grid-hesaplama",
  }),
  robots: { index: false, follow: true },
};

export default async function OffGridCalculatorPage() {
  const [site, products] = await Promise.all([getSiteSettings(), getStoreProducts()]);
  const packages = products
    .filter((p) => p.category === "off-grid-paketler")
    .map((p) => ({
      name: p.name,
      href: productHref(p),
      kw: kwOf(p),
      threePhase: /trifaze/i.test(p.name),
      price: p.price,
    }))
    .filter((p) => !Number.isNaN(p.kw));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <section className="max-w-3xl">
        <nav aria-label="Sayfa yolu" className="text-[13px] text-slate-soft">
          <Link href="/magaza" className="hover:text-ink">Mağaza</Link>
          <span className="mx-1.5">/</span>
          <Link href="/magaza/off-grid-paketler" className="hover:text-ink">Off Grid Paketler</Link>
          <span className="mx-1.5">/</span>
          <span className="text-ink">Hesaplama</span>
        </nav>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Bağ evinize kaç kW güneş paneli gerekir?</h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-slate">
          Şebekesi olmayan bağ evi, yayla evi ya da çiftliğinizde kullanacağınız cihazları ve günde kaç saat çalıştıklarını girin.
          Size uygun off grid güneş enerjisi paketini ücretsiz hesaplayıp sonucu WhatsApp&apos;tan iletelim.
        </p>
      </section>

      <OffGridCalculator packages={packages} whatsappNumber={site.contact.whatsappNumber} />

      <p className="text-[12.5px] leading-relaxed text-slate-soft">
        Hesap yaklaşık bir ön değerlendirmedir; kesin sistem konum, panel yönü, gölge ve cihazlarınızın gerçek değerlerine göre uzmanımızla
        birlikte netleşir.
      </p>
    </div>
  );
}
