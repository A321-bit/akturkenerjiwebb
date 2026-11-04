import type { StoreProduct } from "./store";

// Blog yazısının konusuna göre gösterilecek mağaza kategorileri (öncelik sırasıyla).
// Önce yazının adresindeki anahtar kelimeye, yoksa blog kategorisine bakılır.
const BY_SLUG: [RegExp, string[]][] = [
  [/isi-pompasi/, ["isi-pompasi-urunleri", "hibrit-paketler", "on-grid-paketler"]],
  [/karavan|hobi-bahcesi|bag-evi/, ["off-grid-paketler", "lityum-batarya-ve-setleri", "solar-montaj-ekipmanlari"]],
  [/on-grid-off-grid-hibrit/, ["hibrit-paketler", "off-grid-paketler", "on-grid-paketler"]],
  [/batarya/, ["lityum-batarya-ve-setleri", "inverter-batarya-paketleri", "hibrit-paketler"]],
  [/kis-aylarinda/, ["hibrit-paketler", "ruzgar-gunes-hibrit-sistemleri", "on-grid-paketler"]],
  [/sarj/, ["elektrikli-arac-sarj-istasyonu"]],
  [/sulama/, ["tarimsal-sulama-paketleri"]],
  [/ruzgar/, ["ruzgar-gunes-hibrit-sistemleri", "ruzgar-turbini"]],
];

const BY_CATEGORY: Record<string, string[]> = {
  "Fiyat Rehberi": ["on-grid-paketler", "hibrit-paketler", "oztuketim-paketleri"],
  "Villa GES": ["on-grid-paketler", "hibrit-paketler", "oztuketim-paketleri"],
  "Ankara Rehberi": ["on-grid-paketler", "hibrit-paketler", "oztuketim-paketleri"],
  "Müteahhit GES": ["on-grid-paketler", "gunes-panelleri", "inverter"],
  "Fabrika GES": ["on-grid-paketler", "inverter", "ges-panosu"],
  "Mühendislik & Başvuru": ["on-grid-paketler", "ges-panosu", "hibrit-paketler"],
  "Batarya Depolama": ["lityum-batarya-ve-setleri", "inverter-batarya-paketleri", "hibrit-paketler"],
  "Off-Grid Sistemler": ["off-grid-paketler", "lityum-batarya-ve-setleri", "solar-montaj-ekipmanlari"],
  "Tarımsal Sulama": ["tarimsal-sulama-paketleri"],
  "Elektrikli Araç Şarjı": ["elektrikli-arac-sarj-istasyonu", "on-grid-paketler"],
  "Rüzgar & Hibrit": ["ruzgar-gunes-hibrit-sistemleri", "ruzgar-turbini", "hibrit-paketler"],
};

const DEFAULT = ["on-grid-paketler", "hibrit-paketler"];

/**
 * Yazıyla ilgili ürünler: kategoriler sırayla, her kategoride önce öne çıkan ve fiyatı
 * belli olanlar. `inline` yazının arasına reklam gibi giren kartlar (görselli ve fiyatlı,
 * farklı kategorilerden), `rail` yazının altındaki şerit.
 */
export function relatedProducts(post: { slug: string; category: string }, products: StoreProduct[], limit = 8) {
  const cats = BY_SLUG.find(([re]) => re.test(post.slug))?.[1] ?? BY_CATEGORY[post.category] ?? DEFAULT;
  const rank = (p: StoreProduct) => (p.featured ? 0 : 2) + (p.price != null ? 0 : 1);
  const perCat = cats.map((c) => products.filter((p) => p.category === c && p.image).sort((a, b) => rank(a) - rank(b)));

  // Kategoriler sırayla karıştırılır; böylece şeritte tek tip ürün dizilmez.
  const rail: StoreProduct[] = [];
  for (let i = 0; rail.length < limit && perCat.some((l) => l[i]); i++) {
    for (const list of perCat) if (list[i] && rail.length < limit) rail.push(list[i]);
  }
  const inline = perCat.map((l) => l.find((p) => p.price != null)).filter((p): p is StoreProduct => !!p).slice(0, 2);
  return { inline, rail };
}
