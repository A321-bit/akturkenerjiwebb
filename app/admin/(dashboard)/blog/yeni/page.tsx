"use client";

import BlogPostForm from "@/components/admin/BlogPostForm";

export default function NewBlogPostPage() {
  return (
    <div>
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Blog</p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Yeni Yazı</h1>
      <BlogPostForm
        initial={{
          slug: "",
          title: "",
          description: "",
          category: "",
          content: "",
          published_at: new Date().toISOString().slice(0, 10),
        }}
      />
    </div>
  );
}
