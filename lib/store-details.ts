// Ürün sayfası yardımcıları.
import type { StoreProduct } from "./store";

export function productHref(p: Pick<StoreProduct, "category" | "slug">): string {
  return `/magaza/${p.category}/${p.slug}`;
}

const BRANDS = ["TommaTech", "Deye", "Mexxsun", "Exelon", "Alfa Solar", "Fixus"];

/** Şemadaki marka: adında ya da içeriğinde üretici markası geçen üründe o marka; Aktürk'ün kendi paketlerinde "Aktürk Enerji". */
export function productBrand(p: StoreProduct): string {
  const inName = BRANDS.find((b) => p.name.toLocaleLowerCase("tr").startsWith(b.toLocaleLowerCase("tr")));
  if (inName) return inName;
  const fromContents = BRANDS.find((b) => p.contents.some((c) => c.startsWith(`${b} marka`)));
  return fromContents ?? "Aktürk Enerji";
}

export function kwOf(p: StoreProduct): number {
  const n = parseFloat(p.power.replace(",", "."));
  return /mw/i.test(p.power) ? n * 1000 : n;
}

/** Ana görsel (büyük boy) + galeri görselleri, tekrarsız. */
export function productGallery(p: StoreProduct): string[] {
  const main = p.image?.replace(/-opt-800\.webp$/, "-opt.webp");
  return Array.from(new Set([main, ...p.gallery].filter((x): x is string => Boolean(x))));
}
