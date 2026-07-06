import type { MetadataRoute } from "next";
import { site, services } from "@/lib/site-config";
import { getAllPosts } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/hizmetlerimiz",
    "/referanslarimiz",
    "/hakkimizda",
    "/blog",
    "/iletisim",
  ].map((route) => ({
    url: `${site.url}${route}`,
    lastModified: new Date(),
  }));

  const serviceRoutes = services.map((s) => ({
    url: `${site.url}/hizmetlerimiz/${s.slug}`,
    lastModified: new Date(),
  }));

  const postRoutes = getAllPosts().map((p) => ({
    url: `${site.url}/blog/${p.slug}`,
    lastModified: new Date(p.date),
  }));

  return [...staticRoutes, ...serviceRoutes, ...postRoutes];
}
