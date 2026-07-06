import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getAllPosts } from "@/lib/blog";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import CoverMedia from "@/components/CoverMedia";

export const metadata: Metadata = buildMetadata({
  title: "Blog",
  description:
    "Güneş enerjisi sistemleri hakkında teknik rehberler, sektör bilgileri ve sıkça sorulan sorular.",
  path: "/blog",
  keywords: ["güneş enerjisi rehberi", "GES blog", "solar enerji makaleleri"],
});

const jsonLd = {
  "@context": "https://schema.org",
  ...breadcrumbJsonLd([
    { name: "Anasayfa", path: "/" },
    { name: "Blog", path: "/blog" },
  ]),
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Blog</p>
      <h1 className="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Güneş enerjisi hakkında bilmeniz gerekenler
      </h1>
      <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-slate">
        Sistem boyutlandırmadan mevzuat süreçlerine, sektörle ilgili merak
        edilen konuları düzenli olarak paylaşıyoruz.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col rounded-2xl border border-line bg-paper-raised p-4 transition-colors hover:border-sun/60 hover:shadow-[0_20px_44px_-24px_rgba(11,20,32,0.45)]"
          >
            <CoverMedia alt={post.title} label={post.category} aspect="aspect-[16/11]" iconSize={40} />
            <div className="flex items-center justify-between pt-4">
              <span className="font-mono-data text-[11px] uppercase tracking-[0.14em] text-brand">
                {post.category}
              </span>
              <span className="font-mono-data text-[11px] text-slate-soft">{post.readingTime}</span>
            </div>
            <h2 className="mt-3 font-display text-[17px] font-semibold leading-snug">
              {post.title}
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-slate">{post.description}</p>
            <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[12.5px] text-slate-soft">
              <time>{formatDate(post.date)}</time>
              <span className="flex items-center gap-1.5 font-semibold text-ink">
                Detayları gör
                <ArrowUpRight
                  size={15}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
