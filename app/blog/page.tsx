import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Güneş enerjisi sistemleri hakkında teknik rehberler, sektör bilgileri ve sıkça sorulan sorular.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-20">
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Blog</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Güneş enerjisi hakkında bilmeniz gerekenler
      </h1>
      <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-slate">
        Sistem boyutlandırmadan mevzuat süreçlerine, sektörle ilgili merak
        edilen konuları düzenli olarak paylaşıyoruz.
      </p>

      <div className="mt-12 divide-y divide-line border-t border-line">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col gap-2 py-7 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="flex items-center gap-3 text-[12px] text-slate-soft">
                <span className="font-mono-data uppercase tracking-[0.1em] text-brand">
                  {post.category}
                </span>
                <span>·</span>
                <time>{formatDate(post.date)}</time>
                <span>·</span>
                <span>{post.readingTime}</span>
              </div>
              <h2 className="mt-2 font-display text-[19px] font-semibold leading-snug text-ink group-hover:text-brand">
                {post.title}
              </h2>
              <p className="mt-1.5 max-w-xl text-[14px] leading-relaxed text-slate">
                {post.description}
              </p>
            </div>
            <ArrowUpRight
              size={18}
              className="mt-3 shrink-0 text-slate-soft transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand sm:mt-0"
            />
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
