import { formatTL, type StoreProduct } from "./store";
import { kwOf, productHref } from "./store-details";

// Kategori ve ürün yazılarında (markdown) canlı fiyat etiketleri. Yazıda fiyat
// sabit yazılmaz; sayfa açıldığında mağazadaki güncel fiyat (kurla hesaplanan TL)
// basılır, fiyat değişince yazının güncellenmesi gerekmez.
//
//   {{fiyat-listesi}}        bu kategorideki bütün paketler (link + fiyat)
//   {{fiyat-listesi:5-25}}   yalnızca 5–25 kW arası paketler (aralık kW cinsinden; "30-" = 30 kW ve üstü)
//   {{fiyat:<ürün-slug>}}    tek bir paketin fiyatı (ör. "330.000 TL")

function priceText(p: StoreProduct): string {
  return p.price != null ? `${formatTL(p.price)} (KDV dahil)` : "fiyat için WhatsApp'tan sorun";
}

function listLine(p: StoreProduct): string {
  return `- [${p.name}](${productHref(p)}) – ${priceText(p)}`;
}

export function renderStoreTokens(md: string, products: StoreProduct[]): string {
  return md
    .replace(/\{\{fiyat-listesi(?::(\d*(?:[.,]\d+)?)-(\d*(?:[.,]\d+)?))?\}\}/g, (_, min?: string, max?: string) => {
      const lo = min ? parseFloat(min.replace(",", ".")) : -Infinity;
      const hi = max ? parseFloat(max.replace(",", ".")) : Infinity;
      const list = products.filter((p) => {
        const kw = kwOf(p);
        return Number.isNaN(kw) ? min === undefined : kw >= lo && kw <= hi;
      });
      return list.length ? "\n" + list.map(listLine).join("\n") + "\n" : "";
    })
    .replace(/\{\{fiyat:([a-z0-9-]+)\}\}/g, (m, slug: string) => {
      const p = products.find((x) => x.slug === slug);
      return p ? priceText(p) : m;
    });
}
