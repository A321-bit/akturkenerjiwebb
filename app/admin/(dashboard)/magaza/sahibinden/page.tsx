import { SITE_URL, getSiteSettings } from "@/lib/data";
import { getStoreCategories, getStoreProducts } from "@/lib/store-data";
import { buildListing, buildListingHtml } from "@/lib/listing";
import SahibindenListings, { type ListingItem } from "@/components/admin/store/SahibindenListings";

// Sahibinden.com ilan metinleri: her paket için başlık, açıklama ve fiyat hazır;
// kopyala-yapıştır ile ilan verilir.
export const dynamic = "force-dynamic";

// Kasım 2026 ilan turu (sahibinden taraması 18.11.2026): 2 on grid (rakip neredeyse yok), 3 hibrit (kış kesintileri),
// 3 off grid (bağ evi / konteyner / çiftlik), 2 rüzgâr + güneş (pazarda yalnız çıplak türbin var, paket yok).
// Fark: başlıkta gerçek panel kWp ve batarya kWh ("günlük 10 kW" gibi belirsiz başlıklara karşı şeffaf etiket).
const PICKS = [
  "3-kw-off-grid-gunes-paneli-paketi",
  "2-kw-ruzgar-gunes-hibrit-paket-lityum-bataryali",
  "10-kw-on-grid-gunes-paneli-paketi",
  "5-kw-hibrit-5-kwh-lityum-paket",
  "5-kw-off-grid-gunes-paneli-paketi",
  "5-kw-ruzgar-gunes-hibrit-paket-lityum-bataryali",
  "5-kw-on-grid-gunes-paneli-paketi",
  "10-kw-hibrit-10-kwh-lityum-paket",
  "12-kw-trifaze-off-grid-gunes-paneli-paketi",
  "15-kw-hibrit-15-kwh-lityum-paket",
];

// En çok 60 karakter. Kullanım yeri + tip + gerçek panel/batarya değerleri; marka adı başlıkta yer kaplamaz.
const TITLES: Record<string, string> = {
  "3-kw-off-grid-gunes-paneli-paketi": "Bağ Evi Off Grid 3 kW · 2,5 kWp Panel + 5,2 kWh Lityum Akü",
  "2-kw-ruzgar-gunes-hibrit-paket-lityum-bataryali": "Rüzgar Türbini + Güneş Paneli Hibrit 2 kW · 5 kWh Lityum",
  "10-kw-on-grid-gunes-paneli-paketi": "On Grid Çatı GES 10 kW · 10,2 kWp Panel + Montaj Seti",
  "5-kw-hibrit-5-kwh-lityum-paket": "Kesinti Yedekli 5 kW Hibrit GES · 5,6 kWp + 5 kWh Lityum",
  "5-kw-off-grid-gunes-paneli-paketi": "Konteyner ve Bağ Evi Off Grid 5 kW · 5 kWp + 10 kWh Lityum",
  "5-kw-ruzgar-gunes-hibrit-paket-lityum-bataryali": "Rüzgar + Güneş Hibrit 5 kW · 2 kW Türbin + 10 kWh Lityum",
  "5-kw-on-grid-gunes-paneli-paketi": "Müstakil Ev On Grid Çatı GES 5 kW · 5,6 kWp TOPCon Panel",
  "10-kw-hibrit-10-kwh-lityum-paket": "Villa 10 kW Trifaze Hibrit GES · 10,6 kWp + 12 kWh Lityum",
  "12-kw-trifaze-off-grid-gunes-paneli-paketi": "Süt Tankı Çiftlik Off Grid 12 kW Trifaze · 14 kWh Lityum",
  "15-kw-hibrit-15-kwh-lityum-paket": "Villa ve İşletme 15 kW Trifaze Hibrit · 15,4 kWp + 15,7 kWh",
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
