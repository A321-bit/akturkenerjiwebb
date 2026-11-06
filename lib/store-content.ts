import { formatTL, type StoreProduct } from "./store";
import { kwOf, productHref } from "./store-details";
import { parseContentLine, SERVICE_AREA_NOTE, wattOf } from "./package-builder";

/**
 * Paketin panel gücü (kWp): paket içeriğindeki "16 × … 640Wp" satırlarından; seçenekli üründe ya da
 * içerikte panel satırı yoksa ürünün güç alanından (ör. "10 kW").
 */
function kwpOf(p: StoreProduct): number {
  if (!p.options.length) {
    let w = 0;
    for (const c of p.contents) {
      const x = parseContentLine(c);
      if (x?.unit === "Adet") w += Number(x.qty.replace(",", ".")) * wattOf(x.name);
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
//   {{panel-adet:<slug>}} "16" · {{panel-gucu:<slug>}} "640 W" · {{kwp:<slug>}} "10,24 kWp" · {{inverter:<slug>}} inverter adı
//                              (hepsi paketin içerik listesinden; paket değişince yazı da değişir)
//   {{batarya-kwh:<slug>}} "15,7 kWh" · {{batarya-adet:<slug>}} "3" · {{batarya:<slug>}} batarya modülü adı
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
      // Malzemeler (miktarlı) tablo, hizmetler (miktarsız) liste: arama motorları ve yapay zekâ
      // aramaları yapılandırılmış tablo ve listeleri doğrudan alıntılayabiliyor.
      const cell = (s: string) => s.replace(/\|/g, "/");
      const rows: string[] = [];
      const services: string[] = [];
      for (const c of p.contents) {
        if (c === SERVICE_AREA_NOTE) continue;
        const x = parseContentLine(c);
        if (x) rows.push(`| ${cell(x.name)} | ${x.qty} ${x.unit} |`);
        else services.push(`- ${c}`);
      }
      const title = p.name.replace(/\s+Paketi$/, "");
      return [
        `### ${title} Paket İçerisinde Kullanılan Malzemeler`,
        rows.length ? `| Malzeme | Miktar |\n| --- | --- |\n${rows.join("\n")}` : "",
        services.length ? `**Pakete dahil hizmetler**\n\n${services.join("\n")}` : "",
        p.contents.includes(SERVICE_AREA_NOTE) ? SERVICE_AREA_NOTE : "",
      ].filter(Boolean).join("\n\n");
    })
    // Paket içeriğinden canlı panel/inverter bilgisi: paket değişip ürüne bağlanınca yazı kendiliğinden güncellenir.
    .replace(/\{\{(panel-adet|panel-gucu|kwp|inverter):([a-z0-9-]+)\}\}/g, (_, kind: string, slug: string) => {
      const p = products.find((x) => x.slug === slug);
      if (!p) return "";
      const panels = p.contents.map(parseContentLine).filter((x): x is NonNullable<typeof x> => x?.unit === "Adet" && wattOf(x.name) > 0);
      const count = panels.reduce((t, x) => t + Number(x.qty), 0);
      if (kind === "panel-adet") return count ? String(count) : "";
      if (kind === "panel-gucu") return panels[0] ? `${wattOf(panels[0].name)} W` : "";
      if (kind === "kwp") {
        const kwp = kwpOf(p);
        return kwp ? `${kwp.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} kWp` : "";
      }
      const inv = p.contents.map((c) => parseContentLine(c)?.name ?? c).find((n) => /[iİ]nvert/i.test(n) && !/aksesuar/i.test(n));
      return inv ?? "";
    })
    // Batarya: içerikteki batarya satırlarından ("3 Adet LFP Batarya Modüler - 51.2V 102Ah" ya da "… 5 kWh").
    .replace(/\{\{(batarya-kwh|batarya-adet|batarya):([a-z0-9-]+)\}\}/g, (_, kind: string, slug: string) => {
      const p = products.find((x) => x.slug === slug);
      if (!p) return "";
      const bats = p.contents.map(parseContentLine).filter((x): x is NonNullable<typeof x> => x?.unit === "Adet" && /batarya|battery|lityum|lfp/i.test(x.name) && !/kablo|bms/i.test(x.name));
      if (!bats.length) return "";
      if (kind === "batarya") return bats[0].name;
      if (kind === "batarya-adet") return String(bats.reduce((t, x) => t + Number(x.qty), 0));
      const num = (s: string) => Number(s.replace(",", "."));
      const kwh = bats.reduce((t, x) => {
        const vah = x.name.match(/(\d+(?:[.,]\d+)?)\s*V\b.*?(\d+(?:[.,]\d+)?)\s*Ah/i);
        const k = x.name.match(/(\d+(?:[.,]\d+)?)\s*kWh/i);
        const per = vah ? (num(vah[1]) * num(vah[2])) / 1000 : k ? num(k[1]) : 0;
        return t + per * Number(x.qty);
      }, 0);
      return kwh ? `${kwh.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} kWh` : "";
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
