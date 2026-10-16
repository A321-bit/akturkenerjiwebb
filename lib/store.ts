// Mağaza (akturkenerji.com/magaza) veri tipleri ve yardımcıları. Veriler
// admin panelden yönetilen Supabase tablolarından gelir (lib/store-data.ts).

export type StoreCategory = {
  id: number;
  slug: string;
  name: string;
  short: string;
  /** Kısa açıklama (meta açıklama ve uzun yazı yokken sayfa altında). */
  intro: string;
  /** Ürünlerin altında gösterilen uzun SEO yazısı (markdown). */
  content?: string;
  image?: string;
  /** Sol menüdeki ikon anahtarı (components/store/category-icons.ts). */
  icon: string;
  seoTitle?: string;
  seoDescription?: string;
};

export type StoreProduct = {
  id: number;
  slug: string;
  category: string;
  name: string;
  power: string;
  /** İndirimli satış fiyatı (KDV dahil). */
  price?: number;
  /** Liste fiyatı; satış fiyatından yüksekse üstü çizili gösterilir. */
  listPrice?: number;
  installIncluded: boolean;
  image?: string;
  /** Ürün sayfası galerisi (ana görselden sonra). */
  gallery: string[];
  /** Paket içeriği maddeleri. */
  contents: string[];
  /** Öne çıkan ürün ("Çok Tercih Edilen Paketler"). */
  featured?: boolean;
  /** Ürün sayfasındaki "Ürün Açıklaması": SEO makalesi (markdown). */
  content?: string;
  /** Teknik datasheet PDF bağlantısı (varsa "Datasheet İndir" gösterilir). */
  datasheet?: string;
  seoTitle?: string;
  seoDescription?: string;
  /** Onaylı müşteri yorumlarından hesaplanır (lib/reviews.ts → withRatings). */
  rating?: { avg: number; count: number };
};

export type StoreSlide = {
  image: string;
  eyebrow?: string;
  title: string;
  text?: string;
  cta?: { label: string; href: string };
};

export type StoreTextItem = { title: string; text: string };

export type StoreSettings = {
  pricesUpdated: string;
  /** Fiyat notu; "{tarih}" yerine pricesUpdated yazılır. */
  priceNote: string;
  featuredTitle: string;
  featuredSubtitle: string;
  brandsTitle: string;
  brands: { name: string; logo: string }[];
  faqs: { q: string; a: string }[];
  trustItems: StoreTextItem[];
  orderSteps: StoreTextItem[];
  aboutTitle: string;
  aboutContent: string;
  footerText: string;
};

/** İstemci bileşenlerine (kart, raf, katalog) giden hafif ürün: uzun yazı ve sayfa alanları çıkarılır. */
export function cardProduct(p: StoreProduct): StoreProduct {
  return { ...p, content: undefined, contents: [], gallery: [], datasheet: undefined, seoTitle: undefined, seoDescription: undefined };
}

/** İstemci bileşenlerine giden hafif kategori: uzun SEO yazısı çıkarılır. */
export function cardCategory(c: StoreCategory): StoreCategory {
  return { ...c, content: undefined, seoTitle: undefined, seoDescription: undefined };
}

export function discountPercent(p: StoreProduct): number | null {
  if (!p.price || !p.listPrice || p.listPrice <= p.price) return null;
  return Math.round(((p.listPrice - p.price) / p.listPrice) * 100);
}

export function formatTL(n: number): string {
  return n.toLocaleString("tr-TR") + " TL";
}

export function priceNoteText(s: StoreSettings): string {
  return s.priceNote.replace("{tarih}", s.pricesUpdated);
}
