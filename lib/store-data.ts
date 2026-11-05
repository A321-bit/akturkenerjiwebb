import { cache } from "react";
import { unstable_cache } from "next/cache";
import { supabaseAdmin, supabasePublic } from "./supabase";
import type { StoreCategory, StoreProduct, StoreSettings, StoreSlide } from "./store";

// Mağaza verisi: admin panelden yönetilen store_* tabloları.
//
// Ürün, kategori ve ayar tablolarında alış maliyeti ve kâr marjı sütunları
// var; bu yüzden anon (tarayıcıdaki public anahtar) bu tablolara erişemez,
// burada sunucu tarafı anahtarla okunur. Yalnızca aktif kayıtlar alınır.
const storeDb = supabaseAdmin();

/** Admin bir ürün ya da kategori değiştirince paylaşılan liste önbelleği bu etiketle silinir. */
export const STORE_CACHE_TAG = "store-data";

// Ürün listesi her sayfada gerekir; makale metni (content) yalnızca kendi ürün sayfasında.
const PRODUCT_LIST_COLUMNS =
  "id,slug,category,name,power,price,list_price,install_included,image,gallery,contents,datasheet,featured,seo_title,seo_description,options";

type CategoryRow = {
  id: number;
  slug: string;
  name: string;
  short: string;
  intro: string;
  content: string | null;
  image: string | null;
  icon: string;
  seo_title: string | null;
  seo_description: string | null;
};

type ProductRow = {
  id: number;
  slug: string;
  category: string;
  name: string;
  power: string;
  price: number | null;
  list_price: number | null;
  install_included: boolean;
  image: string | null;
  gallery: string[] | null;
  contents: string[] | null;
  content: string | null;
  datasheet: string | null;
  featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  options: { label?: string; price?: number | null; list_price?: number | null }[] | null;
};

type SlideRow = {
  image: string;
  eyebrow: string | null;
  title: string;
  text: string | null;
  cta_label: string | null;
  cta_href: string | null;
};

const opt = <T,>(v: T | null | undefined): T | undefined => (v === null || v === "" ? undefined : v);

export function mapCategory(r: CategoryRow): StoreCategory {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    short: r.short,
    intro: r.intro,
    content: opt(r.content),
    image: opt(r.image),
    icon: r.icon,
    seoTitle: opt(r.seo_title),
    seoDescription: opt(r.seo_description),
  };
}

export function mapProduct(r: ProductRow): StoreProduct {
  return {
    id: r.id,
    slug: r.slug,
    category: r.category,
    name: r.name,
    power: r.power,
    price: opt(r.price),
    listPrice: opt(r.list_price),
    installIncluded: r.install_included,
    image: opt(r.image),
    gallery: r.gallery ?? [],
    contents: r.contents ?? [],
    featured: r.featured,
    content: opt(r.content),
    datasheet: opt(r.datasheet),
    seoTitle: opt(r.seo_title),
    seoDescription: opt(r.seo_description),
    // Yalnızca satış bilgisi: seçeneğin alış maliyeti ziyaretçiye gitmez.
    options: (r.options ?? [])
      .filter((o) => o.label)
      .map((o) => ({ label: String(o.label), price: opt(o.price ?? null), listPrice: opt(o.list_price ?? null) })),
  };
}

// Listeler sayfalar arasında paylaşılır: her sayfa üretiminde veritabanından yeniden inmez.
// Hata önbelleğe alınmaz ve fırlatılır; böylece Vercel sayfanın son sağlam halini sunmaya
// devam eder. Boş liste dönseydi veritabanı kesintisinde boş sayfa ve boş feed saklanırdı.
const fetchCategories = unstable_cache(
  async () => {
    const { data, error } = await storeDb.from("store_categories").select("*").eq("active", true).order("sort_order").order("id");
    if (error || !data) throw new Error(`store_categories okunamadı: ${error?.message}`);
    return data as CategoryRow[];
  },
  ["store-categories"],
  { tags: [STORE_CACHE_TAG], revalidate: 86400 },
);

const fetchProducts = unstable_cache(
  async () => {
    const { data, error } = await storeDb.from("store_products").select(PRODUCT_LIST_COLUMNS).eq("active", true).order("sort_order").order("id");
    if (error || !data) throw new Error(`store_products okunamadı: ${error?.message}`);
    return data as unknown as ProductRow[];
  },
  ["store-products"],
  { tags: [STORE_CACHE_TAG], revalidate: 86400 },
);

export const getStoreCategories = cache(async (): Promise<StoreCategory[]> => (await fetchCategories()).map(mapCategory));

export const getStoreProducts = cache(async (): Promise<StoreProduct[]> => {
  const [rows, categories] = await Promise.all([fetchProducts(), getStoreCategories()]);
  // Yayından kaldırılmış kategorideki ürünler de gizlenir.
  const live = new Set(categories.map((c) => c.slug));
  return rows.filter((r) => live.has(r.category)).map(mapProduct);
});

/** Ürün sayfasının makale metni; listelerde taşınmaz. */
const fetchProductContent = unstable_cache(
  async (slug: string) => {
    const { data, error } = await storeDb.from("store_products").select("content").eq("slug", slug).maybeSingle();
    if (error) throw new Error(`Ürün yazısı okunamadı: ${error.message}`);
    return (data as { content: string | null } | null)?.content ?? null;
  },
  ["store-product-content-v2"],
  { tags: [STORE_CACHE_TAG], revalidate: 86400 },
);

export const getStoreProductContent = cache(async (slug: string): Promise<string | undefined> => opt(await fetchProductContent(slug)));

const fetchProductsBySlugs = unstable_cache(
  async (slugs: string[]) => {
    const { data, error } = await storeDb.from("store_products").select(PRODUCT_LIST_COLUMNS).in("slug", slugs);
    if (error || !data) throw new Error(`store_products okunamadı: ${error?.message}`);
    return data as unknown as ProductRow[];
  },
  ["store-products-by-slugs"],
  { tags: [STORE_CACHE_TAG], revalidate: 86400 },
);

/** Slug ile ürünler, pasif olanlar dahil (ör. satışa kapalı tekli paneller "Paketi Tamamla"da fiyat kaynağıdır). */
export const getProductsBySlugs = cache(async (slugs: string[]): Promise<StoreProduct[]> => {
  if (!slugs.length) return [];
  return (await fetchProductsBySlugs(slugs)).map(mapProduct);
});

const fetchSlides = unstable_cache(
  async () => {
    const { data, error } = await supabasePublic.from("store_slides").select("*").order("sort_order").order("id");
    if (error || !data) throw new Error(`store_slides okunamadı: ${error?.message}`);
    return data as SlideRow[];
  },
  ["store-slides"],
  { tags: [STORE_CACHE_TAG], revalidate: 86400 },
);

export const getStoreSlides = cache(async (): Promise<StoreSlide[]> => {
  return (await fetchSlides()).map((s) => ({
    image: s.image,
    eyebrow: opt(s.eyebrow),
    title: s.title,
    text: opt(s.text),
    cta: s.cta_label && s.cta_href ? { label: s.cta_label, href: s.cta_href } : undefined,
  }));
});

const EMPTY_SETTINGS: StoreSettings = {
  pricesUpdated: "",
  priceNote: "",
  featuredTitle: "Çok Tercih Edilen Paketler",
  featuredSubtitle: "",
  brandsTitle: "Yetkili Satış Bayiliklerimiz",
  brands: [],
  faqs: [],
  trustItems: [],
  orderSteps: [],
  aboutTitle: "",
  aboutContent: "",
  footerText: "",
};

const fetchStoreSettings = unstable_cache(
  async () => {
    const { data, error } = await storeDb.from("store_settings").select("*").eq("id", 1).single();
    if (error || !data) throw new Error(`store_settings okunamadı: ${error?.message}`);
    return data as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  },
  ["store-settings"],
  { tags: [STORE_CACHE_TAG], revalidate: 86400 },
);

export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  const data = await fetchStoreSettings();
  return {
    pricesUpdated: data.prices_updated ?? "",
    priceNote: data.price_note ?? "",
    featuredTitle: data.featured_title ?? EMPTY_SETTINGS.featuredTitle,
    featuredSubtitle: data.featured_subtitle ?? "",
    brandsTitle: data.brands_title ?? EMPTY_SETTINGS.brandsTitle,
    brands: data.brands ?? [],
    faqs: data.faqs ?? [],
    trustItems: data.trust_items ?? [],
    orderSteps: data.order_steps ?? [],
    aboutTitle: data.about_title ?? "",
    aboutContent: data.about_content ?? "",
    footerText: data.footer_text ?? "",
  };
});
