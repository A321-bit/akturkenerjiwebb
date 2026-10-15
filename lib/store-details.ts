// Ürün sayfası yardımcıları.
import type { StoreProduct } from "./store";

export function productHref(p: Pick<StoreProduct, "category" | "slug">): string {
  return `/magaza/${p.category}/${p.slug}`;
}

export function kwOf(p: StoreProduct): number {
  return parseFloat(p.power.replace(",", "."));
}

/** Ana görsel (büyük boy) + galeri görselleri, tekrarsız. */
export function productGallery(p: StoreProduct): string[] {
  const main = p.image?.replace(/-opt-800\.webp$/, "-opt.webp");
  return Array.from(new Set([main, ...p.gallery].filter((x): x is string => Boolean(x))));
}
