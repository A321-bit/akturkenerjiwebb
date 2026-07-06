import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  readingTime: string;
};

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  const posts = files.map((file) => {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    const words = content.split(/\s+/).length;
    const readingTime = `${Math.max(1, Math.round(words / 200))} dk okuma`;
    return {
      slug,
      title: data.title as string,
      description: data.description as string,
      date: data.date as string,
      category: data.category as string,
      readingTime,
    };
  });
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostContent(slug: string) {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const words = content.split(/\s+/).length;
  const readingTime = `${Math.max(1, Math.round(words / 200))} dk okuma`;
  return {
    meta: {
      slug,
      title: data.title as string,
      description: data.description as string,
      date: data.date as string,
      category: data.category as string,
      readingTime,
    },
    content,
  };
}
