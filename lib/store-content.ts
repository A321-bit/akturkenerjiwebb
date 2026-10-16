import { formatTL, type StoreProduct } from "./store";
import { kwOf, productHref } from "./store-details";

// Kategori ve ürün yazılarında (markdown) canlı fiyat etiketleri. Yazıda fiyat
// sabit yazılmaz; sayfa açıldığında mağazadaki güncel fiyat (kurla hesaplanan TL)
// basılır, fiyat değişince yazının güncellenmesi gerekmez.
//
//   {{fiyat-listesi}}          bu kategorideki bütün paketler (link + fiyat)
//   {{fiyat-listesi:5-25}}     yalnızca 5–25 kW arası paketler (aralık kW cinsinden; "30-" = 30 kW ve üstü)
//   {{fiyat:<ürün-slug>}}      tek bir paketin satış fiyatı, cümle içinde (ör. "330.000 TL")
//   {{liste-fiyat:<ürün-slug>}} tek bir paketin üstü çizili liste fiyatı

const EMPTY_LIST =
  "_Bu gruptaki ürünlerimizin fiyatları çok yakında burada olacak. Güncel fiyat için WhatsApp hattımızdan bize yazabilirsiniz._";

function listLine(p: StoreProduct): string {
  const price = p.price != null ? `${formatTL(p.price)} (KDV dahil)` : "fiyat için WhatsApp'tan sorun";
  return `- [${p.name}](${productHref(p)}) – ${price}`;
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
      return "\n" + (list.length ? list.map(listLine).join("\n") : EMPTY_LIST) + "\n";
    })
    .replace(/\{\{(fiyat|liste-fiyat):([a-z0-9-]+)\}\}/g, (m, kind: string, slug: string) => {
      const p = products.find((x) => x.slug === slug);
      const v = kind === "fiyat" ? p?.price : p?.listPrice;
      return v != null ? formatTL(v) : kind === "fiyat" ? "güncel fiyatı WhatsApp'tan sorabileceğiniz bir fiyat" : "";
    });
}
