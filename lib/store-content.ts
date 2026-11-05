import { formatTL, type StoreProduct } from "./store";
import { kwOf, productHref } from "./store-details";
import { SERVICE_AREA_NOTE, wattOf } from "./package-builder";

/**
 * Paketin panel gücü (kWp): paket içeriğindeki "16 × … 640Wp" satırlarından; seçenekli üründe ya da
 * içerikte panel satırı yoksa ürünün güç alanından (ör. "10 kW").
 */
function kwpOf(p: StoreProduct): number {
  if (!p.options.length) {
    let w = 0;
    for (const c of p.contents) {
      const m = c.match(/^(\d+)\s*[×x]\s*(.+)$/i);
      if (m) w += Number(m[1]) * wattOf(m[2]);
    }
    if (w > 0) return w / 1000;
  }
  const kw = kwOf(p);
  return Number.isFinite(kw) ? kw : 0;
}

// Kategori ve ürün yazılarında (markdown) canlı fiyat etiketleri. Yazıda fiyat
// sabit yazılmaz; sayfa açıldığında mağazadaki güncel fiyat (kurla hesaplanan TL)
// basılır, fiyat değişince yazının güncellenmesi gerekmez.
//
//   {{fiyat-listesi}}          bu kategorideki bütün paketler (link + fiyat)
//   {{fiyat-listesi:5-25}}     yalnızca 5–25 kW arası paketler (aralık kW cinsinden; "30-" = 30 kW ve üstü)
//   {{fiyat-listesi:on-grid-paketler:5-25}}  yalnızca o kategoriden (blog yazılarında; orada tüm ürünler gelir)
//   {{fiyat:<ürün-slug>}}      tek bir paketin satış fiyatı, cümle içinde (ör. "330.000 TL")
//   {{liste-fiyat:<ürün-slug>}} tek bir paketin üstü çizili liste fiyatı
//   {{kw-fiyat:<ürün-slug>}}   kWp başına fiyat (güncel TL fiyat ÷ panel gücü), cümle içinde
//   {{paket-icerigi:<ürün-slug>}} "… Paket İçerisinde Kullanılan Malzemeler" başlığı + paketin malzeme listesi

const EMPTY_LIST =
  "_Bu gruptaki ürünlerimizin fiyatları çok yakında burada olacak. Güncel fiyat için WhatsApp hattımızdan bize yazabilirsiniz._";

function listLine(p: StoreProduct): string {
  const price = p.price != null ? `${formatTL(p.price)} (KDV dahil)` : "fiyat için WhatsApp'tan sorun";
  return `- [${p.name}](${productHref(p)}) – ${price}`;
}

export function renderStoreTokens(md: string, products: StoreProduct[]): string {
  return md
    .replace(/\{\{fiyat-listesi(?::([a-z][a-z0-9-]*))?(?::(\d*(?:[.,]\d+)?)-(\d*(?:[.,]\d+)?))?\}\}/g, (_, cat?: string, min?: string, max?: string) => {
      const lo = min ? parseFloat(min.replace(",", ".")) : -Infinity;
      const hi = max ? parseFloat(max.replace(",", ".")) : Infinity;
      const list = products.filter((p) => {
        if (cat && p.category !== cat) return false;
        const kw = kwOf(p);
        return Number.isNaN(kw) ? min === undefined : kw >= lo && kw <= hi;
      });
      return "\n" + (list.length ? list.map(listLine).join("\n") : EMPTY_LIST) + "\n";
    })
    // Paketin yönetim panelindeki malzeme listesi (fiyatsız); hizmet bölgesi notu listenin altında paragraf.
    .replace(/\{\{paket-icerigi:([a-z0-9-]+)\}\}/g, (_, slug: string) => {
      const p = products.find((x) => x.slug === slug);
      if (!p?.contents.length) return "";
      const items = p.contents.filter((c) => c !== SERVICE_AREA_NOTE);
      const note = p.contents.includes(SERVICE_AREA_NOTE) ? `\n\n${SERVICE_AREA_NOTE}` : "";
      return `### ${p.name.replace(/\s+Paketi$/, "")} Paket İçerisinde Kullanılan Malzemeler\n\n${items.map((c) => `- ${c}`).join("\n")}${note}`;
    })
    // kWp başına fiyat: güncel TL fiyat ÷ paketin panel gücü (kWp); fiyat ya da kur değişince kendiliğinden güncellenir.
    .replace(/\{\{kw-fiyat:([a-z0-9-]+)\}\}/g, (_, slug: string) => {
      const p = products.find((x) => x.slug === slug);
      const kwp = p ? kwpOf(p) : 0;
      return p?.price && kwp > 0 ? formatTL(Math.round(p.price / kwp / 10) * 10) : "";
    })
    .replace(/\{\{(fiyat|liste-fiyat):([a-z0-9-]+)\}\}/g, (m, kind: string, slug: string) => {
      const p = products.find((x) => x.slug === slug);
      const v = kind === "fiyat" ? p?.price : p?.listPrice;
      return v != null ? formatTL(v) : kind === "fiyat" ? "güncel fiyatı WhatsApp'tan sorabileceğiniz bir fiyat" : "";
    });
}
