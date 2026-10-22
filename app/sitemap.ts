import type { MetadataRoute } from "next";
import { SITE_URL, getServices, getReferences, getBlogPosts } from "@/lib/data";
import { getStoreCategories, getStoreProducts } from "@/lib/store-data";
import { productHref } from "@/lib/store-details";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, references, posts, storeCategories, storeProducts] = await Promise.all([
    getServices(),
    getReferences(),
    getBlogPosts(),
    getStoreCategories(),
    getStoreProducts(),
  ]);

  // lastmod: Google yalnızca güvenilir lastmod değerini dikkate alır; her
  // istekte "şimdi" yazmak onu anlamsız kılıyordu. Kayıtların gerçek
  // güncellenme tarihi kullanılıyor; statik sayfalar en son içerik tarihini alır.
  const dates = [...services, ...references, ...posts]
    .map((x) => ("updatedAt" in x && x.updatedAt) || ("publishedAt" in x ? x.publishedAt : undefined))
    .filter((d): d is string => Boolean(d))
    .map((d) => new Date(d).getTime());
  const latest = new Date(dates.length ? Math.max(...dates) : Date.now());

  const staticRoutes = [
    "",
    "/hizmetlerimiz",
    "/referanslarimiz",
    "/hakkimizda",
    "/blog",
    "/iletisim",
  ].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: latest,
  }));

  const serviceRoutes = services.map((s) => ({
    url: `${SITE_URL}/hizmetlerimiz/${s.slug}`,
    lastModified: s.updatedAt ? new Date(s.updatedAt) : latest,
  }));

  const referenceRoutes = references.map((r) => ({
    url: `${SITE_URL}/referanslarimiz/${r.slug}`,
    lastModified: r.updatedAt ? new Date(r.updatedAt) : latest,
  }));

  const postRoutes = posts.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.updatedAt ?? p.publishedAt),
  }));

  // Mağaza: ürünü olmayan kategoriler ("çok yakında") ve mağaza referansları
  // (kurumsal referansların kopyası) Google'a kapalı olduğu için listelenmez.
  const storeRoutes = [
    "/magaza",
    "/magaza/hakkimizda",
    "/magaza/iletisim",
    "/magaza/teslimat-ve-iade",
    "/magaza/off-grid-hesaplama",
    ...storeCategories.filter((c) => storeProducts.some((p) => p.category === c.slug)).map((c) => `/magaza/${c.slug}`),
    ...storeProducts.map(productHref),
  ].map((route) => ({ url: `${SITE_URL}${route}` }));

  return [...staticRoutes, ...serviceRoutes, ...referenceRoutes, ...postRoutes, ...storeRoutes];
}
