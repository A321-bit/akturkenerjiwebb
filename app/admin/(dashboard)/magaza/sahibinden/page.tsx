import { SITE_URL, getSiteSettings } from "@/lib/data";
import { getStoreCategories, getStoreProducts } from "@/lib/store-data";
import { buildListing, buildListingHtml } from "@/lib/listing";
import SahibindenListings, { type ListingItem } from "@/components/admin/store/SahibindenListings";

// Sahibinden.com ilan metinleri: her paket için başlık, açıklama ve fiyat hazır;
// kopyala-yapıştır ile ilan verilir.
export const dynamic = "force-dynamic";

// Kasım 2026 ilan turu: kış sezonu (bağ evi / şebekesiz, rüzgâr sezonu, kesinti yedeği). Listenin başında gösterilir.
const PICKS = [
  "3-kw-off-grid-gunes-paneli-paketi",
  "5-kw-off-grid-gunes-paneli-paketi",
  "1-2-kw-off-grid-gunes-paneli-paketi",
  "10-2-kw-off-grid-gunes-paneli-paketi",
  "2-kw-ruzgar-gunes-hibrit-paket-lityum-bataryali",
  "5-kw-ruzgar-gunes-hibrit-paket-lityum-bataryali",
  "5-kw-hibrit-5-kwh-lityum-paket",
  "10-kw-hibrit-10-kwh-lityum-paket",
  "12-kw-trifaze-off-grid-gunes-paneli-paketi",
  "5-5-hp-4-kw-tarimsal-sulama-paketi",
];

// Sahibinden aramasında aranan kelimelerle başlık (en çok 60 karakter); marka adı başlıkta yer kaplamasın.
const TITLES: Record<string, string> = {
  "3-kw-off-grid-gunes-paneli-paketi": "3 kW Off Grid Güneş Paneli Paketi Lityum Akülü Bağ Evi",
  "5-kw-off-grid-gunes-paneli-paketi": "5 kW Off Grid Güneş Enerjisi Paketi 10 kWh Lityum Bağ Evi",
  "1-2-kw-off-grid-gunes-paneli-paketi": "1,2 kW Off Grid Güneş Paneli Seti Lityum Akü Konteyner",
  "10-2-kw-off-grid-gunes-paneli-paketi": "10 kW Off Grid Güneş Paneli Paketi Müstakil Ev Çiftlik",
  "2-kw-ruzgar-gunes-hibrit-paket-lityum-bataryali": "Rüzgar Türbini + Güneş Paneli 2 kW Hibrit Paket Lityum",
  "5-kw-ruzgar-gunes-hibrit-paket-lityum-bataryali": "5 kW Rüzgar Türbini Güneş Paneli Hibrit Sistem Lityum",
  "5-kw-hibrit-5-kwh-lityum-paket": "5 kW Hibrit Güneş Paneli + 5 kWh Lityum Akü Kesinti Yedeği",
  "10-kw-hibrit-10-kwh-lityum-paket": "10 kW Trifaze Hibrit Güneş Enerjisi 12 kWh Lityum Batarya",
  "12-kw-trifaze-off-grid-gunes-paneli-paketi": "12 kW Trifaze Off Grid Güneş Paketi Çiftlik Ahır Pompa",
  "5-5-hp-4-kw-tarimsal-sulama-paketi": "Güneş Enerjili Tarımsal Sulama Paketi 5,5 HP Pompa Sürücü",
};

export default async function SahibindenPage() {
  const [site, products, categories] = await Promise.all([getSiteSettings(), getStoreProducts(), getStoreCategories()]);
  const items: ListingItem[] = products
    .map((p) => {
      const cat = categories.find((c) => c.slug === p.category);
      return cat ? { slug: p.slug, name: p.name, category: cat.name, pick: PICKS.indexOf(p.slug), ...buildListing(p, cat, site), ...(TITLES[p.slug] ? { title: TITLES[p.slug] } : {}), html: buildListingHtml(p, cat, site, SITE_URL) } : null;
    })
    .filter((x): x is ListingItem => x !== null)
    .sort((a, b) => (a.pick < 0 ? 99 : a.pick) - (b.pick < 0 ? 99 : b.pick));
  return <SahibindenListings items={items} />;
}
