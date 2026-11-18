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

// En çok 60 karakter. Pazardaki alışkanlık: paket gücü = inverter gücü ("6.2 kW Solar Paket"); başlık bununla başlar.
// Rüzgâr paketlerinde güç, paket adındaki gibi (türbin + güneş) yazılır.
const TITLES: Record<string, string> = {
  "3-kw-off-grid-gunes-paneli-paketi": "3 kW Solar Paket Bağ Evi İçin Lityum Akülü Güneş Enerjisi",
  "2-kw-ruzgar-gunes-hibrit-paket-lityum-bataryali": "2 kW Rüzgar Türbini + Güneş Paneli Paket Gece Gündüz Üretim",
  "10-kw-on-grid-gunes-paneli-paketi": "10 kW On Grid Güneş Enerjisi Paketi Faturanızı Düşürün",
  "5-kw-hibrit-5-kwh-lityum-paket": "6 kW Hibrit Solar Paket Lityum Akülü Kesintide Elektrik Var",
  "5-kw-off-grid-gunes-paneli-paketi": "5 kW Solar Paket 10 kWh Lityum Akü Konteyner ve Bağ Evi",
  "5-kw-ruzgar-gunes-hibrit-paket-lityum-bataryali": "Rüzgar + Güneş 5 kW Hibrit Paket 2 kW Türbin 10 kWh Lityum",
  "5-kw-on-grid-gunes-paneli-paketi": "5 kW On Grid Solar Paket Müstakil Ev Çatı GES TOPCon Panel",
  "10-kw-hibrit-10-kwh-lityum-paket": "10 kW Trifaze Hibrit Solar Paket 12 kWh Lityum Batarya Villa",
  "12-kw-trifaze-off-grid-gunes-paneli-paketi": "12 kW Trifaze Solar Paket Çiftlik Ahır Süt Tankı Lityum Akü",
  "15-kw-hibrit-15-kwh-lityum-paket": "15 kW Trifaze Hibrit Güneş Enerjisi Paketi 15 kWh Lityum",
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
