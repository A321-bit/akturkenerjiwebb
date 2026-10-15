// Mağaza (akturkenerji.com/magaza) kategori ve ürün verisi.
// Şablon aşaması: ürünler şimdilik buradan geliyor, sonraki adımda admin
// panelden yönetilen veritabanı tablosuna taşınacak. Fiyatlar blogdaki
// "Müstakil Ev İçin Güneş Paneli Sistemleri" yazısında yayınlanan aralıklardır.

const IMG = "https://tzibyocqotqcowebswlq.supabase.co/storage/v1/object/public/media/blog/mustakil-ev-icin-gunes-paneli-sistemleri/";

export type StoreCategory = {
  slug: string;
  name: string;
  group: "Paketler";
  short: string;
  intro: string;
  image?: string;
};

export type StoreProduct = {
  slug: string;
  category: string;
  name: string;
  power: string;
  specs: string[];
  priceMin?: number;
  priceMax?: number;
  installIncluded: boolean;
  image?: string;
};

export const STORE_CATEGORIES: StoreCategory[] = [
  {
    slug: "on-grid-paketler",
    name: "On Grid Paketler",
    group: "Paketler",
    short: "Şebeke bağlantılı, mahsuplaşmalı sistemler",
    intro:
      "Ürettiğini önce evinizde kullanan, fazlasını şebekeye verip faturanızdan düşen şebeke bağlantılı güneş paneli paketleri. Proje, EDAŞ başvurusu ve kurulum dahil, anahtar teslim.",
    image: `${IMG}cankiri-atkaracalar-10-kw-on-grid-gunes-paneli-opt-800.webp`,
  },
  {
    slug: "off-grid-paketler",
    name: "Off Grid Paketler",
    group: "Paketler",
    short: "Şebekesiz bağ evi, hobi bahçesi, yazlık",
    intro:
      "Şebeke elektriği olmayan bağ evi, hobi bahçesi ve yazlıklar için lityum bataryalı, şebekeden bağımsız güneş enerjisi paketleri.",
    image: `${IMG}cankiri-hobi-bahcesi-off-grid-gunes-paneli-opt-800.webp`,
  },
  {
    slug: "hibrit-paketler",
    name: "Hibrit Lityum Bataryalı Paketler",
    group: "Paketler",
    short: "Şebeke + batarya, kesintide de elektrik",
    intro:
      "Şebekeye bağlı çalışan, fazla üretimi lityum bataryada depolayan ve elektrik kesintisinde evinizi bataryadan besleyen hibrit güneş paneli paketleri.",
    image: `${IMG}ankara-cayyolu-hibrit-inverter-lityum-batarya-opt-800.webp`,
  },
  {
    slug: "oztuketim-paketleri",
    name: "Öztüketim Paketleri",
    group: "Paketler",
    short: "Şebekeye vermeden gündüz faturasını düşürür",
    intro:
      "Şebekeye enerji vermeden, evin o anki tüketimi kadar üreten öztüketim modeli güneş paneli paketleri. Gündüz tüketimi yüksek evler için.",
    image: `${IMG}kecioren-sirkeli-oztuketim-hibrit-inverter-opt-800.webp`,
  },
  {
    slug: "tarimsal-sulama-paketleri",
    name: "Tarımsal Sulama Paketleri",
    group: "Paketler",
    short: "Güneşle çalışan sulama pompası sistemleri",
    intro:
      "Şebeke hattı olmayan tarla, bahçe ve seralarda dalgıç ya da yüzey pompalarını güneş enerjisiyle çalıştıran tarımsal sulama paketleri. Mazot ve elektrik faturası olmadan sulama.",
    image: `https://tzibyocqotqcowebswlq.supabase.co/storage/v1/object/public/media/services/tarimsal-sulama-opt.webp`,
  },
  {
    slug: "ruzgar-turbini-paketleri",
    name: "Rüzgar Türbini Paketleri",
    group: "Paketler",
    short: "Rüzgar + güneş hibrit enerji",
    intro:
      "Rüzgarı bol bölgelerde güneş panelleriyle birlikte çalışan, gece ve kışın da üretim yapan rüzgar türbini ve hibrit enerji paketleri.",
    image: `https://tzibyocqotqcowebswlq.supabase.co/storage/v1/object/public/media/services/ruzgar-hibrit-opt.webp`,
  },
  {
    slug: "elektrikli-arac-sarj-paketleri",
    name: "Elektrikli Araç Şarj İstasyonu Paketleri",
    group: "Paketler",
    short: "Aracınızı evde güneşten şarj edin",
    intro:
      "Ev ve iş yerleri için elektrikli araç şarj istasyonu paketleri; güneş enerjisi sistemiyle birlikte kurulduğunda aracınızı güneşten şarj edin.",
    image: `https://tzibyocqotqcowebswlq.supabase.co/storage/v1/object/public/media/services/4bae581c-6b41-4fe2-8f95-17b2d9e19abb-opt.webp`,
  },
];

const P = (
  category: string,
  slug: string,
  name: string,
  power: string,
  specs: string[],
  priceMin: number,
  priceMax: number,
  installIncluded: boolean,
  image: string
): StoreProduct => ({ category, slug, name, power, specs, priceMin, priceMax, installIncluded, image: `${IMG}${image}` });

export const STORE_PRODUCTS: StoreProduct[] = [
  P("on-grid-paketler", "5-kw-on-grid-gunes-paneli-paketi", "5 kW On Grid Güneş Paneli Paketi", "5 kW", ["On grid", "Mahsuplaşmalı"], 200000, 240000, true, "ankara-beytepe-mustakil-ev-15-kw-on-grid-gunes-paneli-opt-800.webp"),
  P("on-grid-paketler", "7-5-kw-on-grid-gunes-paneli-paketi", "7,5 kW On Grid Güneş Paneli Paketi", "7,5 kW", ["On grid", "Mahsuplaşmalı"], 270000, 310000, true, "kiremit-catiya-gunes-paneli-montaji-opt-800.webp"),
  P("on-grid-paketler", "10-kw-on-grid-gunes-paneli-paketi", "10 kW On Grid Güneş Paneli Paketi", "10 kW", ["On grid", "Mahsuplaşmalı"], 330000, 380000, true, "cankiri-atkaracalar-10-kw-on-grid-gunes-paneli-opt-800.webp"),
  P("on-grid-paketler", "15-kw-on-grid-gunes-paneli-paketi", "15 kW On Grid Güneş Paneli Paketi", "15 kW", ["On grid", "Trifaze"], 470000, 540000, true, "ankara-beytepe-mustakil-ev-15-kw-on-grid-gunes-paneli-opt-800.webp"),
  P("on-grid-paketler", "20-kw-on-grid-gunes-paneli-paketi", "20 kW On Grid Güneş Paneli Paketi", "20 kW", ["On grid", "Trifaze"], 600000, 700000, true, "on-grid-inverter-ve-ges-panosu-opt-800.webp"),
  P("off-grid-paketler", "3-kw-off-grid-gunes-paneli-paketi", "3 kW Off Grid Güneş Paneli Paketi", "3 kW", ["Off grid", "Bataryalı"], 65000, 75000, false, "cankiri-hobi-bahcesi-off-grid-gunes-paneli-opt-800.webp"),
  P("off-grid-paketler", "6-2-kw-off-grid-gunes-paneli-paketi", "6,2 kW Off Grid Güneş Paneli Paketi", "6,2 kW", ["Off grid", "Bataryalı"], 120000, 140000, false, "off-grid-inverter-ve-lityum-batarya-opt-800.webp"),
  P("off-grid-paketler", "10-2-kw-off-grid-gunes-paneli-paketi", "10,2 kW Off Grid Güneş Paneli Paketi", "10,2 kW", ["Off grid", "Bataryalı"], 210000, 235000, false, "cankiri-hobi-bahcesi-off-grid-gunes-paneli-opt-800.webp"),
  P("hibrit-paketler", "5-kw-hibrit-5-kwh-lityum-paket", "5 kW Hibrit Güneş Paneli + 5 kWh Lityum Batarya", "5 kW", ["Hibrit", "5 kWh lityum"], 300000, 360000, true, "ankara-cayyolu-hibrit-inverter-lityum-batarya-opt-800.webp"),
  P("hibrit-paketler", "10-kw-hibrit-10-kwh-lityum-paket", "10 kW Hibrit Güneş Paneli + 10 kWh Lityum Batarya", "10 kW", ["Hibrit", "10 kWh lityum"], 480000, 580000, true, "ankara-cayyolu-hibrit-inverter-lityum-batarya-opt-800.webp"),
  P("hibrit-paketler", "15-kw-hibrit-15-kwh-lityum-paket", "15 kW Hibrit Güneş Paneli + 15 kWh Lityum Batarya", "15 kW", ["Hibrit", "15 kWh lityum"], 680000, 800000, true, "kecioren-sirkeli-oztuketim-hibrit-inverter-opt-800.webp"),
  P("oztuketim-paketleri", "3-kw-oztuketim-gunes-paneli-sistemi", "3 kW Öztüketim Güneş Paneli Sistemi", "3 kW", ["Öztüketim", "Sıfır besleme"], 120000, 150000, true, "kecioren-sirkeli-oztuketim-hibrit-inverter-opt-800.webp"),
  P("oztuketim-paketleri", "5-kw-oztuketim-gunes-paneli-sistemi", "5 kW Öztüketim Güneş Paneli Sistemi", "5 kW", ["Öztüketim", "Sıfır besleme"], 180000, 220000, true, "kecioren-sirkeli-oztuketim-hibrit-inverter-opt-800.webp"),
  P("oztuketim-paketleri", "10-kw-oztuketim-gunes-paneli-sistemi", "10 kW Öztüketim Güneş Paneli Sistemi", "10 kW", ["Öztüketim", "Sıfır besleme"], 300000, 350000, true, "kecioren-sirkeli-oztuketim-hibrit-inverter-opt-800.webp"),
];

export const PRICES_UPDATED = "15.10.2026";

export function formatTL(n: number): string {
  return n.toLocaleString("tr-TR") + " TL";
}

export type StoreSlide = {
  image: string;
  eyebrow?: string;
  title: string;
  text?: string;
  cta?: { label: string; href: string };
};

// Mağaza ana sayfası slider'ı (ileride admin panelden yönetilecek).
export const STORE_SLIDES: StoreSlide[] = [
  {
    image: `${IMG}ankara-beytepe-mustakil-ev-15-kw-on-grid-gunes-paneli-opt.webp`,
    eyebrow: "On Grid Paketler",
    title: "Faturanızı güneşle sıfıra yaklaştırın",
    text: "5 kW'tan 20 kW'a şebeke bağlantılı paketler; proje, EDAŞ başvurusu ve kurulum dahil.",
    cta: { label: "Paketleri incele", href: "/magaza/on-grid-paketler" },
  },
  {
    image: `${IMG}ankara-cayyolu-hibrit-inverter-lityum-batarya-opt.webp`,
    eyebrow: "Hibrit Lityum Bataryalı",
    title: "Elektrik kesilse de eviniz çalışsın",
    text: "Fazla üretimi lityum bataryada depolayan, kesintide otomatik devreye giren hibrit sistemler.",
    cta: { label: "Hibrit paketler", href: "/magaza/hibrit-paketler" },
  },
  {
    image: `${IMG}cankiri-hobi-bahcesi-off-grid-gunes-paneli-opt.webp`,
    eyebrow: "Off Grid Paketler",
    title: "Şebekenin olmadığı yerde kendi elektriğiniz",
    text: "Bağ evi, hobi bahçesi ve yazlıklar için lityum bataryalı, şebekeden bağımsız paketler.",
    cta: { label: "Off grid paketler", href: "/magaza/off-grid-paketler" },
  },
  {
    image: `${IMG}kiremit-catiya-gunes-paneli-montaji-opt.webp`,
    eyebrow: "WhatsApp Sipariş Hattı",
    title: "Paketinizi tek mesajla sipariş edin",
    text: "Ürün kartındaki butona basın, uzmanımız sizi arayıp evinize uygunluğu birlikte kontrol etsin.",
    cta: { label: "Sipariş ve iletişim", href: "/magaza/iletisim" },
  },
];
