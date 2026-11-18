import { SITE_URL, adminClient, getSiteSettings } from "@/lib/data";
import { formatTL } from "@/lib/store";
import { getPricingSettings, usdToTl } from "@/lib/store-pricing";
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

/** Paket Oluştur'da sahibinden başlığı/açıklaması yazılmış paketler (listenin en başında). */
async function packageListings(products: Awaited<ReturnType<typeof getStoreProducts>>): Promise<ListingItem[]> {
  const db = adminClient();
  const [{ data }, pricing] = await Promise.all([
    db.from("product_packages").select("id, name, product_id, sale_usd, listing_title, listing_text").or("listing_title.not.is.null,listing_text.not.is.null").order("id"),
    getPricingSettings(db),
  ]);
  return ((data ?? []) as { id: number; name: string; product_id: number | null; sale_usd: number | null; listing_title: string | null; listing_text: string | null }[]).map((p, i) => {
    const linked = p.product_id ? products.find((x) => x.id === p.product_id) : undefined;
    const tl = linked?.price ?? (p.sale_usd != null ? usdToTl(Number(p.sale_usd), pricing) : null);
    const text = p.listing_text ?? "";
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const html = [
      `<p style="text-align:center"><img src="${SITE_URL}/akturk-enerji-sahibinden.jpg" alt="Aktürk Enerji" width="685" style="max-width:100%;height:auto" /></p>`,
      ...text.split("\n").map((l) => (l.trim() ? `<p><span style="font-family:'roboto',sans-serif;font-size:11pt">${esc(l)}</span></p>` : "<p>&nbsp;</p>")),
    ].join("");
    return { slug: `paket-${p.id}`, name: p.name, category: "Paket Oluştur", pick: i, title: p.listing_title ?? p.name, description: text, price: tl != null ? formatTL(tl) : "Satış fiyatı girilmemiş", html };
  });
}

export default async function SahibindenPage() {
  const [site, products, categories] = await Promise.all([getSiteSettings(), getStoreProducts(), getStoreCategories()]);
  const pkgItems = await packageListings(products);
  const items: ListingItem[] = products
    .map((p) => {
      const cat = categories.find((c) => c.slug === p.category);
      return cat ? { slug: p.slug, name: p.name, category: cat.name, pick: PICKS.indexOf(p.slug) < 0 ? -1 : 50 + PICKS.indexOf(p.slug), ...buildListing(p, cat, site), ...(TITLES[p.slug] ? { title: TITLES[p.slug] } : {}), html: buildListingHtml(p, cat, site, SITE_URL) } : null;
    })
    .filter((x): x is ListingItem => x !== null)
    .sort((a, b) => (a.pick < 0 ? 999 : a.pick) - (b.pick < 0 ? 999 : b.pick));
  return <SahibindenListings items={[...pkgItems, ...items]} />;
}
