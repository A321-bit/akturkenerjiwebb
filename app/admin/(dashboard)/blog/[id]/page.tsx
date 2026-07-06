import { notFound } from "next/navigation";
import { adminClient } from "@/lib/data";
import BlogPostForm from "@/components/admin/BlogPostForm";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data } = await adminClient().from("blog_posts").select("*").eq("id", id).single();
  if (!data) notFound();

  return (
    <div>
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Blog</p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{data.title}</h1>
      <BlogPostForm
        initial={{
          id: data.id,
          slug: data.slug,
          title: data.title,
          description: data.description,
          category: data.category,
          content: data.content,
          published_at: data.published_at,
        }}
      />
    </div>
  );
}
