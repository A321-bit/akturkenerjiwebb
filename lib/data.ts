import { cache } from "react";
import { supabasePublic, supabaseAdmin } from "./supabase";

export const SITE_URL = "https://akturkenerji.com";
export const SITE_DOMAIN = "akturkenerji.com";
export const SITE_NAME = "Aktürk Enerji Teknolojileri";

export function whatsappLink(whatsappNumber: string, message: string) {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export type SiteSettings = {
  name: string;
  shortName: string;
  foundedYear: number;
  city: string;
  country: string;
  description: string;
  contact: {
    phoneDisplay: string;
    phoneHref: string;
    whatsappNumber: string;
    email: string;
    addressLine: string;
    mapsEmbedUrl: string;
    workingHours: string;
  };
  social: { instagram: string; linkedin: string; youtube: string; facebook: string };
  stats: { label: string; value: string }[];
};

export type Service = {
  id?: number;
  slug: string;
  eyebrow: string;
  title: string;
  summary: string;
  description: string;
  bullets: string[];
  audience: string;
  image?: string;
};

export type Reference = {
  id?: number;
  slug: string;
  title: string;
  category: string;
  location: string;
  address?: string;
  capacity: string;
  year: string;
  summary: string;
  description?: string;
  image?: string;
  gallery?: string[];
};

export type Testimonial = { id?: number; name: string; role: string; quote: string };

export type BlogPost = {
  id?: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  content: string;
  publishedAt: string;
  readingTime: string;
};

type SiteSettingsRow = {
  name: string;
  short_name: string;
  founded_year: number;
  city: string;
  country: string;
  description: string;
  phone_display: string;
  phone_href: string;
  whatsapp_number: string;
  email: string;
  address_line: string;
  maps_embed_url: string | null;
  working_hours: string;
  instagram: string | null;
  linkedin: string | null;
  youtube: string | null;
  facebook: string | null;
  stats: { label: string; value: string }[] | null;
};

function mapSiteSettings(row: SiteSettingsRow): SiteSettings {
  return {
    name: row.name,
    shortName: row.short_name,
    foundedYear: row.founded_year,
    city: row.city,
    country: row.country,
    description: row.description,
    contact: {
      phoneDisplay: row.phone_display,
      phoneHref: row.phone_href,
      whatsappNumber: row.whatsapp_number,
      email: row.email,
      addressLine: row.address_line,
      mapsEmbedUrl: row.maps_embed_url ?? "",
      workingHours: row.working_hours,
    },
    social: {
      instagram: row.instagram ?? "",
      linkedin: row.linkedin ?? "",
      youtube: row.youtube ?? "",
      facebook: row.facebook ?? "",
    },
    stats: row.stats ?? [],
  };
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const { data, error } = await supabasePublic
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error || !data) {
    throw new Error("site_settings okunamadı: " + (error?.message ?? "kayıt yok"));
  }
  return mapSiteSettings(data as SiteSettingsRow);
});

type ServiceRow = {
  id: number;
  slug: string;
  eyebrow: string;
  title: string;
  summary: string;
  description: string;
  bullets: string[] | null;
  audience: string;
  image: string | null;
};

function mapService(row: ServiceRow): Service {
  return {
    id: row.id,
    slug: row.slug,
    eyebrow: row.eyebrow,
    title: row.title,
    summary: row.summary,
    description: row.description,
    bullets: row.bullets ?? [],
    audience: row.audience,
    image: row.image ?? undefined,
  };
}

export const getServices = cache(async (): Promise<Service[]> => {
  const { data, error } = await supabasePublic.from("services").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  return (data as ServiceRow[]).map(mapService);
});

export const getServiceBySlug = cache(async (slug: string): Promise<Service | null> => {
  const { data } = await supabasePublic.from("services").select("*").eq("slug", slug).maybeSingle();
  return data ? mapService(data as ServiceRow) : null;
});

type ReferenceRow = {
  id: number;
  slug: string;
  title: string;
  category: string;
  location: string;
  address: string | null;
  capacity: string;
  year: string;
  summary: string;
  description: string | null;
  image: string | null;
  gallery: string[] | null;
};

function mapReference(row: ReferenceRow): Reference {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    location: row.location,
    address: row.address ?? undefined,
    capacity: row.capacity,
    year: row.year,
    summary: row.summary,
    description: row.description ?? undefined,
    image: row.image ?? undefined,
    gallery: row.gallery ?? [],
  };
}

export const getReferences = cache(async (): Promise<Reference[]> => {
  const { data, error } = await supabasePublic
    .from("project_references")
    .select("*")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data as ReferenceRow[]).map(mapReference);
});

export const getReferenceBySlug = cache(async (slug: string): Promise<Reference | null> => {
  const { data } = await supabasePublic
    .from("project_references")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data ? mapReference(data as ReferenceRow) : null;
});

export const getTestimonials = cache(async (): Promise<Testimonial[]> => {
  const { data, error } = await supabasePublic.from("testimonials").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  return data as Testimonial[];
});

type BlogPostRow = {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  content: string;
  published_at: string;
};

function readingTimeFor(content: string): string {
  const words = content.split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} dk okuma`;
}

function mapBlogPost(row: BlogPostRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    content: row.content,
    publishedAt: row.published_at,
    readingTime: readingTimeFor(row.content),
  };
}

export const getBlogPosts = cache(async (): Promise<BlogPost[]> => {
  const { data, error } = await supabasePublic
    .from("blog_posts")
    .select("*")
    .order("published_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as BlogPostRow[]).map(mapBlogPost);
});

export const getBlogPostBySlug = cache(async (slug: string): Promise<BlogPost | null> => {
  const { data } = await supabasePublic.from("blog_posts").select("*").eq("slug", slug).maybeSingle();
  return data ? mapBlogPost(data as BlogPostRow) : null;
});

// ── Admin (secret anahtar, sadece sunucu tarafı route'larda kullanılır) ──

export function adminClient() {
  return supabaseAdmin();
}
