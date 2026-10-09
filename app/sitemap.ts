import type { MetadataRoute } from "next";
import { SITE_URL, getServices, getReferences, getBlogPosts } from "@/lib/data";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, references, posts] = await Promise.all([
    getServices(),
    getReferences(),
    getBlogPosts(),
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

  return [...staticRoutes, ...serviceRoutes, ...referenceRoutes, ...postRoutes];
}
