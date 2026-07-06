import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ArrowLeft } from "lucide-react";
import { getBlogPostBySlug, SITE_URL, SITE_NAME } from "@/lib/data";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};
  return buildMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    keywords: [post.category, "güneş enerjisi", "GES", "Ankara"],
    type: "article",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.description,
        datePublished: post.publishedAt,
        dateModified: post.publishedAt,
        mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
        author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.svg` },
        },
      },
      breadcrumbJsonLd([
        { name: "Anasayfa", path: "/" },
        { name: "Blog", path: "/blog" },
        { name: post.title, path: `/blog/${post.slug}` },
      ]),
    ],
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-slate hover:text-ink"
      >
        <ArrowLeft size={15} /> Tüm yazılar
      </Link>

      <div className="mt-6 flex items-center gap-3 text-[12px] text-slate-soft">
        <span className="font-mono-data uppercase tracking-[0.1em] text-brand">
          {post.category}
        </span>
        <span>·</span>
        <time>{formatDate(post.publishedAt)}</time>
        <span>·</span>
        <span>{post.readingTime}</span>
      </div>

      <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
        {post.title}
      </h1>

      <div className="prose prose-neutral mt-8 max-w-none prose-headings:font-display prose-headings:font-semibold prose-a:text-brand prose-p:text-slate prose-li:text-slate prose-h2:mt-10 prose-h2:text-xl">
        <MDXRemote source={post.content} />
      </div>

      <div className="mt-14 rounded-2xl border border-line bg-paper-raised p-6">
        <p className="font-display text-[16px] font-semibold">
          Projeniz için ücretsiz keşif talep edin
        </p>
        <p className="mt-1.5 text-[14px] text-slate">
          Size özel sistem boyutu ve fiyat teklifi için bizimle iletişime geçin.
        </p>
        <Link
          href="/iletisim"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[13.5px] font-semibold text-paper hover:bg-sun hover:text-ink"
        >
          İletişime Geç
        </Link>
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
