import { getSiteSettings } from "@/lib/data";
import { getStoreCategories, getStoreProducts } from "@/lib/store-data";
import { buildListing } from "@/lib/listing";
import SahibindenListings, { type ListingItem } from "@/components/admin/store/SahibindenListings";

// Sahibinden.com ilan metinleri: her paket için başlık, açıklama ve fiyat hazır;
// kopyala-yapıştır ile ilan verilir.
export const dynamic = "force-dynamic";

// İlk ilan turu için seçilen paketler (listenin başında gösterilir).
const PICKS = [
  "10-2-kw-off-grid-gunes-paneli-paketi",
  "10-kw-on-grid-gunes-paneli-paketi",
  "15-kw-on-grid-gunes-paneli-paketi",
  "25-kw-on-grid-gunes-paneli-paketi",
  "15-kw-hibrit-15-kwh-lityum-paket",
  "20-kw-trifaze-hibrit-lityum-bataryali-paket",
  "3-kw-off-grid-gunes-paneli-paketi",
  "60-kw-trifaze-hibrit-lityum-bataryali-paket",
];

export default async function SahibindenPage() {
  const [site, products, categories] = await Promise.all([getSiteSettings(), getStoreProducts(), getStoreCategories()]);
  const items: ListingItem[] = products
    .map((p) => {
      const cat = categories.find((c) => c.slug === p.category);
      return cat ? { slug: p.slug, name: p.name, category: cat.name, pick: PICKS.indexOf(p.slug), ...buildListing(p, cat, site) } : null;
    })
    .filter((x): x is ListingItem => x !== null)
    .sort((a, b) => (a.pick < 0 ? 99 : a.pick) - (b.pick < 0 ? 99 : b.pick));
  return <SahibindenListings items={items} />;
}
