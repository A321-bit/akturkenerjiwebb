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
      "Evinizdeki cihazları seçin; günlük tüketiminizi, gereken panel gücünü, lityum batarya kapasitesini ve size uygun off grid paketi hemen görün.",
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
    <div className="flex flex-col gap-8">
      <section className="max-w-3xl">
        <nav aria-label="Sayfa yolu" className="text-[13px] text-slate-soft">
          <Link href="/magaza" className="hover:text-ink">Mağaza</Link>
          <span className="mx-1.5">/</span>
          <Link href="/magaza/off-grid-paketler" className="hover:text-ink">Off Grid Paketler</Link>
          <span className="mx-1.5">/</span>
          <span className="text-ink">Hesaplama</span>
        </nav>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Off grid paket hesaplama</h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-slate">
          Şebekesi olmayan bağ evi, yayla evi ya da çiftliğinizde kullanacağınız cihazları seçin, adetlerini ve günde kaç saat
          çalıştıklarını girin. Günlük tüketiminizi, gereken panel gücünü, lityum batarya kapasitesini ve size uygun off grid paketi
          anında görün; sonucu tek tuşla WhatsApp&apos;tan bize gönderin.
        </p>
      </section>

      <OffGridCalculator packages={packages} whatsappNumber={site.contact.whatsappNumber} />

      <p className="max-w-3xl text-[12.5px] leading-relaxed text-slate-soft">
        Hesap yaklaşık bir ön değerlendirmedir. Ankara için yıl boyu kullanımda günde ortalama 3, yaz aylarında 5,5 tepe güneş saati;
        %75 sistem verimi, tüketimin %60&apos;ının bataryadan karşılanması ve lityum bataryada %90 kullanılabilir kapasite varsayılmıştır.
        Kesin sistem; konum, panel yönü, gölge ve cihazlarınızın gerçek değerlerine göre uzmanımızla birlikte netleşir.
      </p>
    </div>
  );
}
