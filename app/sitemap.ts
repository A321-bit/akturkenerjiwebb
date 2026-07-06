import type { MetadataRoute } from "next";
import { SITE_URL, getServices, getReferences, getBlogPosts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, references, posts] = await Promise.all([
    getServices(),
    getReferences(),
    getBlogPosts(),
  ]);

  const staticRoutes = [
    "",
    "/hizmetlerimiz",
    "/referanslarimiz",
    "/hakkimizda",
    "/blog",
    "/iletisim",
  ].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
  }));

  const serviceRoutes = services.map((s) => ({
    url: `${SITE_URL}/hizmetlerimiz/${s.slug}`,
    lastModified: new Date(),
  }));

  const referenceRoutes = references.map((r) => ({
    url: `${SITE_URL}/referanslarimiz/${r.slug}`,
    lastModified: new Date(),
  }));

  const postRoutes = posts.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.publishedAt),
  }));

  return [...staticRoutes, ...serviceRoutes, ...referenceRoutes, ...postRoutes];
}
