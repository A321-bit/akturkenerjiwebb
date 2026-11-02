import { cache } from "react";
import { unstable_cache } from "next/cache";
import { SITE_CACHE_TAG } from "./data";
import { supabasePublic } from "./supabase";
import type { StoreProduct } from "./store";

// Mağaza ürün yorumları (product_reviews). Müşterinin yazdığı yorum önce
// admin onayına düşer (approved = false); sitede yalnızca onaylılar görünür.
// Tablo yoksa ya da hata olursa yorumsuz devam edilir, sayfa bozulmaz.

export type ProductReview = {
  id: number;
  product_slug: string;
  name: string;
  city: string | null;
  rating: number;
  comment: string;
  created_at: string;
};

export type RatingStats = { avg: number; count: number };

// Sayfalar arasında paylaşılır (lib/data.ts ile aynı etiket); yorum onaylanınca admin siler.
const fetchApprovedReviews = unstable_cache(
  async (slug: string) => {
    const { data, error } = await supabasePublic
      .from("product_reviews")
      .select("id, product_slug, name, city, rating, comment, created_at")
      .eq("product_slug", slug)
      .eq("approved", true)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as ProductReview[];
  },
  ["approved-reviews"],
  { tags: [SITE_CACHE_TAG], revalidate: 86400 },
);

const fetchRatings = unstable_cache(
  async () => {
    const { data, error } = await supabasePublic.from("product_reviews").select("product_slug, rating").eq("approved", true);
    if (error) throw new Error(error.message);
    return (data ?? []) as { product_slug: string; rating: number }[];
  },
  ["review-ratings"],
  { tags: [SITE_CACHE_TAG], revalidate: 86400 },
);

export const getApprovedReviews = cache(async (slug: string): Promise<ProductReview[]> => fetchApprovedReviews(slug).catch(() => []));

export const getRatingStats = cache(async (): Promise<Record<string, RatingStats>> => {
  const data = await fetchRatings().catch(() => null);
  if (!data) return {};
  const acc: Record<string, { sum: number; count: number }> = {};
  for (const r of data) {
    acc[r.product_slug] ??= { sum: 0, count: 0 };
    acc[r.product_slug].sum += r.rating;
    acc[r.product_slug].count += 1;
  }
  return Object.fromEntries(Object.entries(acc).map(([k, v]) => [k, { avg: v.sum / v.count, count: v.count }]));
});

/** Ürünlere onaylı yorumlardan hesaplanan puanı ekler (kartlarda yıldız için). */
export async function withRatings(products: StoreProduct[]): Promise<StoreProduct[]> {
  const stats = await getRatingStats();
  return products.map((p) => (stats[p.slug] ? { ...p, rating: stats[p.slug] } : p));
}
