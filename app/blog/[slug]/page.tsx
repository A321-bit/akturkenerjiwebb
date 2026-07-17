import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ArrowLeft } from "lucide-react";
import { getBlogPostBySlug, getSiteSettings, SITE_URL, SITE_NAME } from "@/lib/data";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import QuoteModal from "@/components/QuoteModal";

function findMidArticleSplit(content: string): number | null {
  const positions: number[] = [];
  const headingRegex = /\n## /g;
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(content))) positions.push(match.index);
  if (positions.length < 2) return null;
  const mid = content.length / 2;
  return positions.reduce((best, p) =>
    Math.abs(p - mid) < Math.abs(best - mid) ? p : best
  );
}

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
  const [post, site] = await Promise.all([getBlogPostBySlug(slug), getSiteSettings()]);
  if (!post) notFound();

  const splitIndex = findMidArticleSplit(post.content);
  const firstHalf = splitIndex ? post.content.slice(0, splitIndex) : post.content;
  const secondHalf = splitIndex ? post.content.slice(splitIndex) : "";

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
          logo: { "@type": "ImageObject", url: `${SITE_URL}/logo-icon.png` },
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

      <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-sun/40 bg-sun/10 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-[15px] font-semibold leading-snug text-ink">
          Bu konuyla ilgili size özel bir fiyat teklifi ister misiniz?
        </p>
        <QuoteModal
          defaultPurpose={post.category}
          className="shrink-0"
          whatsappNumber={site.contact.whatsappNumber}
        />
      </div>

      <div className="prose prose-neutral mt-8 max-w-none prose-headings:font-display prose-headings:font-semibold prose-a:text-brand prose-p:text-slate prose-li:text-slate prose-h2:mt-10 prose-h2:text-xl">
        <MDXRemote source={firstHalf} />
      </div>

      {secondHalf && (
        <>
          <div className="not-prose mt-10 flex flex-col items-start gap-3 rounded-2xl border border-volt/30 bg-volt/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-[15px] font-semibold leading-snug text-ink">
                Daha Detaylı Bilgi Almak İçin Sizi Arayalım
              </p>
              <p className="mt-1 text-[13px] text-slate">
                Formu doldurun, size özel bilgiyi WhatsApp&apos;tan hemen paylaşalım.
              </p>
            </div>
            <QuoteModal
              label="Sizi Arayalım"
              variant="sun"
              defaultPurpose={post.category}
              className="shrink-0"
              whatsappNumber={site.contact.whatsappNumber}
            />
          </div>

          <div className="prose prose-neutral mt-8 max-w-none prose-headings:font-display prose-headings:font-semibold prose-a:text-brand prose-p:text-slate prose-li:text-slate prose-h2:mt-10 prose-h2:text-xl">
            <MDXRemote source={secondHalf} />
          </div>
        </>
      )}

      <div className="mt-14 rounded-2xl border border-line bg-paper-raised p-6">
        <p className="font-display text-[16px] font-semibold">
          Projeniz için ücretsiz keşif talep edin
        </p>
        <p className="mt-1.5 text-[14px] text-slate">
          Size özel sistem boyutu ve fiyat teklifi için bizimle iletişime geçin.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <QuoteModal defaultPurpose={post.category} whatsappNumber={site.contact.whatsappNumber} />
          <Link
            href="/iletisim"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[13.5px] font-semibold text-paper hover:bg-sun hover:text-ink"
          >
            İletişime Geç
          </Link>
        </div>
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
