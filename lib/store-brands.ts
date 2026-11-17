// Marka sayfaları (/magaza/marka/<slug>): ürün adı markayla başlayan aktif ürünler listelenir.
// Tanıtım metinleri yalnız doğrulanabilir bilgi içerir; ürün yelpazesi mağazadaki ürünlerden gelir.
import type { StoreProduct } from "./store";

export type StoreBrand = {
  slug: string;
  name: string;
  /** Ürün adının başı (büyük/küçük harf duyarsız). */
  prefix: string;
  title: string;
  description: string;
  intro: string;
};

export const STORE_BRANDS: StoreBrand[] = [
  {
    slug: "deye",
    name: "Deye",
    prefix: "Deye",
    title: "Deye İnverter ve Batarya Fiyatları",
    description: "Deye on grid, hibrit ve off grid inverter ile yüksek voltaj lityum batarya modelleri: güç, fiyat ve teknik datasheet tek sayfada.",
    intro:
      "Deye, on grid, hibrit ve off grid inverter ile enerji depolama bataryaları üreten bir üreticidir. Monofaze ve trifaze, düşük voltaj (LV) ve yüksek voltaj (HV) hibrit modeller konut ve ticari sistemlerde kullanılır. Aşağıda mağazamızdaki Deye ürünlerini güç sırasıyla, güncel fiyatları ve teknik datasheet bağlantılarıyla bulabilirsiniz.",
  },
  {
    slug: "tommatech",
    name: "TommaTech",
    prefix: "TommaTech",
    title: "TommaTech İnverter, Batarya ve Isı Pompası Fiyatları",
    description: "TommaTech on grid, hibrit ve off grid inverter, lityum batarya, ısı pompası ve araç şarj istasyonu modelleri; fiyat ve datasheet.",
    intro:
      "TommaTech; güneş paneli, on grid, hibrit ve off grid inverter, lityum batarya, ısı pompası ve elektrikli araç şarj istasyonu ürün grupları bulunan bir markadır. Aktürk Enerji, TommaTech yetkili satış bayisidir. Aşağıda mağazamızdaki TommaTech ürünlerini kategori kategori, güncel fiyatları ve teknik datasheet bağlantılarıyla bulabilirsiniz.",
  },
  {
    slug: "pylontech",
    name: "Pylontech",
    prefix: "Pylontech",
    title: "Pylontech Lityum Batarya Fiyatları",
    description: "Pylontech düşük ve yüksek voltaj LiFePO4 lityum batarya, modül, BMS ve batarya setleri: kapasite, fiyat ve teknik bilgi.",
    intro:
      "Pylontech, LiFePO4 (lityum demir fosfat) kimyasıyla düşük voltaj (LV) ve yüksek voltaj (HV) enerji depolama bataryaları üreten bir üreticidir. Modüler yapıdaki bataryalar paralel ya da seri bağlanarak kapasite artırılabilir. Aşağıda mağazamızdaki Pylontech batarya, modül ve BMS ürünlerini güncel fiyatlarıyla bulabilirsiniz.",
  },
  {
    slug: "exelon",
    name: "Exelon",
    prefix: "Exelon",
    title: "Exelon İnverter ve Lityum Akü Fiyatları",
    description: "Exelon off grid ve trifaze hibrit inverter ile LiFePO4 lityum akü ve duvar tipi batarya modelleri; güç, kapasite ve fiyat.",
    intro:
      "Exelon ürün grubunda off grid ve trifaze hibrit inverterler ile 12,8 V, 25,6 V ve 51,2 V LiFePO4 lityum akü ve duvar tipi bataryalar bulunur. Aşağıda mağazamızdaki Exelon ürünlerini güncel fiyatlarıyla bulabilirsiniz.",
  },
  {
    slug: "mexxsun",
    name: "Mexxsun",
    prefix: "Mexxsun",
    title: "Mexxsun İnverter ve Lityum Akü Fiyatları",
    description: "Mexxsun tam sinüs ve modifiye sinüs inverter, off grid ve on grid hibrit inverter, LiFePO4 lityum akü ve HV batarya fiyatları.",
    intro:
      "Mexxsun ürün grubunda tam sinüs ve modifiye sinüs inverterler, off grid ve on grid hibrit inverterler, LiFePO4 lityum aküler ve yüksek voltaj batarya sistemleri bulunur. Aşağıda mağazamızdaki Mexxsun ürünlerini güncel fiyatlarıyla bulabilirsiniz.",
  },
  {
    slug: "orbit",
    name: "Orbit",
    prefix: "Orbit",
    title: "Orbit Lityum Akü ve İnverter Fiyatları",
    description: "Orbit LiFePO4 lityum akü, HV batarya modülü, akü kabineti ve off grid inverter modelleri; kapasite ve fiyat.",
    intro:
      "Orbit ürün grubunda LiFePO4 lityum aküler, yüksek voltaj batarya modülleri, akü kabinetleri ve off grid inverterler bulunur. Aktürk Enerji, Orbit Enerji yetkili satış bayisidir. Aşağıda mağazamızdaki Orbit ürünlerini güncel fiyatlarıyla bulabilirsiniz.",
  },
  {
    slug: "srp",
    name: "SRP",
    prefix: "SRP",
    title: "SRP Hibrit ve Off Grid İnverter Fiyatları",
    description: "SRP monofaze ve trifaze hibrit inverter ile off grid inverter modelleri; güç ve fiyat.",
    intro: "SRP ürün grubunda monofaze ve trifaze hibrit inverterler ile off grid inverterler bulunur. Aşağıda mağazamızdaki SRP ürünlerini güncel fiyatlarıyla bulabilirsiniz.",
  },
  {
    slug: "ista-breeze",
    name: "İsta Breeze",
    prefix: "İsta Breeze",
    title: "İsta Breeze Rüzgar Türbini Fiyatları",
    description: "İsta Breeze rüzgar türbini, türbin setleri, şarj kontrol cihazı ve direk ekipmanları; güç ve fiyat.",
    intro:
      "İsta Breeze ürün grubunda küçük ölçekli rüzgar türbinleri, türbin ve şarj kontrol setleri, hibrit şarj kontrol cihazları ve direk ekipmanları bulunur. Aşağıda mağazamızdaki İsta Breeze ürünlerini güncel fiyatlarıyla bulabilirsiniz.",
  },
];

const lower = (s: string) => s.toLocaleLowerCase("tr");

export function brandProducts(brand: StoreBrand, products: StoreProduct[]): StoreProduct[] {
  const pre = lower(brand.prefix);
  return products.filter((p) => lower(p.name).startsWith(pre));
}

/** Kategorideki ürünlerde geçen markalar (kategori sayfasındaki marka bağlantıları için). */
export function brandsIn(products: StoreProduct[]): StoreBrand[] {
  return STORE_BRANDS.filter((b) => brandProducts(b, products).length > 0);
}

/** Hibrit inverter (off grid hibritler hariç). */
export function isHybridInverter(p: StoreProduct): boolean {
  const n = lower(p.name);
  return p.category === "inverter" && /hibrit|hybrid/.test(n) && !n.includes("off grid");
}
