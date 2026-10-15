import { cache } from "react";
import { supabasePublic } from "./supabase";
import type { StoreCategory, StoreProduct, StoreSettings, StoreSlide } from "./store";

// Mağaza verisi: admin panelden yönetilen store_* tabloları. Ziyaretçi
// yalnızca aktif (yayında) kayıtları görür (RLS). Hata olursa mağaza boş
// görünür ama sayfa çökmez.

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
  };
}

export const getStoreCategories = cache(async (): Promise<StoreCategory[]> => {
  const { data, error } = await supabasePublic.from("store_categories").select("*").order("sort_order").order("id");
  if (error || !data) return [];
  return (data as CategoryRow[]).map(mapCategory);
});

export const getStoreProducts = cache(async (): Promise<StoreProduct[]> => {
  const [{ data, error }, categories] = await Promise.all([
    supabasePublic.from("store_products").select("*").order("sort_order").order("id"),
    getStoreCategories(),
  ]);
  if (error || !data) return [];
  // Yayından kaldırılmış kategorideki ürünler de gizlenir.
  const live = new Set(categories.map((c) => c.slug));
  return (data as ProductRow[]).filter((r) => live.has(r.category)).map(mapProduct);
});

export const getStoreSlides = cache(async (): Promise<StoreSlide[]> => {
  const { data, error } = await supabasePublic.from("store_slides").select("*").order("sort_order").order("id");
  if (error || !data) return [];
  return (data as SlideRow[]).map((s) => ({
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

export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  const { data, error } = await supabasePublic.from("store_settings").select("*").eq("id", 1).single();
  if (error || !data) return EMPTY_SETTINGS;
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
