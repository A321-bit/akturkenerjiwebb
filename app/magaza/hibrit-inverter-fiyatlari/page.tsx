import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { priceNoteText } from "@/lib/store";
import { getStoreProducts, getStoreSettings } from "@/lib/store-data";
import { brandsIn, isHybridInverter } from "@/lib/store-brands";
import { kwOf, productHref } from "@/lib/store-details";
import PriceTable from "@/components/store/PriceTable";

// "10 kw hibrit inverter fiyatları" gibi güç bazlı aramalar: mağazadaki hibrit inverterler güce göre gruplanır.
export const revalidate = 86400;

const PATH = "/magaza/hibrit-inverter-fiyatlari";

export const metadata: Metadata = buildMetadata({
  title: "Hibrit İnverter Fiyatları (5 kW – 125 kW)",
  description: "5, 8, 10, 12, 15, 20 ve 30 kW hibrit inverter fiyatları: Deye, TommaTech ve diğer markaların monofaze ve trifaze modelleri, güce göre tek listede.",
  path: PATH,
});

const fmtKw = (n: number) => n.toLocaleString("tr-TR");

export default async function HybridInverterPricesPage() {
  const [all, store] = await Promise.all([getStoreProducts(), getStoreSettings()]);
  const items = all.filter(isHybridInverter).sort((a, b) => kwOf(a) - kwOf(b) || (a.price ?? 0) - (b.price ?? 0));
  const powers = Array.from(new Set(items.map(kwOf))).filter((n) => n > 0);
  const brands = brandsIn(items);

  const url = `${SITE_URL}${PATH}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: "Hibrit İnverter Fiyatları",
        inLanguage: "tr-TR",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: items.length,
          itemListElement: items.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}${productHref(p)}`, name: p.name })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Mağaza", item: `${SITE_URL}/magaza` },
          { "@type": "ListItem", position: 2, name: "İnverter", item: `${SITE_URL}/magaza/inverter` },
          { "@type": "ListItem", position: 3, name: "Hibrit İnverter Fiyatları", item: url },
        ],
      },
    ],
  };

  return (
    <div className="flex min-w-0 flex-col gap-10">
      {items.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <section>
        <nav className="text-[13px] text-slate-soft">
          <Link href="/magaza" className="hover:text-ink">
            Mağaza
          </Link>
          <span className="mx-1.5">/</span>
          <Link href="/magaza/inverter" className="hover:text-ink">
            İnverter
          </Link>
          <span className="mx-1.5">/</span>
          Hibrit İnverter Fiyatları
        </nav>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Hibrit İnverter Fiyatları</h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-slate">
          Hibrit inverter, güneş panellerinden gelen enerjiyi hem evde kullanır hem bataryada depolar; şebekeye bağlı çalışır ve
          kesintide bataryadan beslemeye devam eder. Monofaze modeller tek fazlı abonelikler, trifaze modeller üç fazlı abonelikler
          içindir. LV (düşük voltaj) modeller 48–51,2 V bataryalarla, HV (yüksek voltaj) modeller yüksek voltaj batarya sistemleriyle
          çalışır. Aşağıda mağazamızdaki hibrit inverterleri güce göre, güncel fiyatlarıyla bulabilirsiniz.
        </p>
        {powers.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {powers.map((n) => (
              <a key={n} href={`#kw-${String(n).replace(".", "-")}`} className="rounded-full border border-line bg-paper-raised px-3 py-1.5 text-[13.5px] font-medium text-ink hover:border-ink">
                {fmtKw(n)} kW
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-8">
        {powers.map((n) => (
          <div key={n} id={`kw-${String(n).replace(".", "-")}`} className="scroll-mt-24">
            <h2 className="mb-3 font-display text-xl font-semibold tracking-tight sm:text-2xl">{fmtKw(n)} kW Hibrit İnverter Fiyatları</h2>
            <PriceTable products={items.filter((p) => kwOf(p) === n)} caption={`${fmtKw(n)} kW hibrit inverter fiyat listesi`} />
          </div>
        ))}
        {store.pricesUpdated && <p className="text-[13px] text-slate-soft">{priceNoteText(store)}</p>}
      </section>

      {brands.length > 0 && (
        <section className="rounded-2xl border border-line bg-paper-raised p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold tracking-tight">Markaya Göre İnverter ve Batarya Fiyatları</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {brands.map((b) => (
              <Link key={b.slug} href={`/magaza/marka/${b.slug}`} className="rounded-full border border-line px-3 py-1.5 text-[14px] font-medium text-ink hover:border-ink">
                {b.title}
              </Link>
            ))}
          </div>
          <p className="mt-4 text-[14px] text-slate">
            Hangi güçte inverter gerektiğinden emin değilseniz <Link href="/magaza/off-grid-hesaplama" className="font-medium text-brand">hesaplama aracını</Link> kullanabilir ya da bize yazabilirsiniz.
          </p>
        </section>
      )}
    </div>
  );
}
