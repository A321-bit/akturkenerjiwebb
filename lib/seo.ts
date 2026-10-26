import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "./data";

export const TITLE_BRAND = "Aktürk Enerji";

// Sayfa başlıkları "Sayfa Başlığı | Aktürk Enerji" biçimindedir. Başlık zaten markayla
// bitiyorsa (ör. admin'den "... | Aktürk Enerji" girilmiş bir blog yazısı) marka ikinci kez
// eklenmez; ek, Google'ın gösterdiği ~65 karakteri aşacaksa hiç eklenmez (başlık kesilmesin).
export function brandTitle(title: string): string {
  const base = title.replace(/\s*[|\-–—]\s*Aktürk Enerji( Teknolojileri)?\s*$/i, "").trim();
  const full = `${base} | ${TITLE_BRAND}`;
  return full.length <= 65 ? full : base;
}

/** Meta açıklama en fazla 160 karakter; uzunsa cümle ya da kelime sınırından kısaltılır. */
export function metaDescription(text: string, max = 160): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sentence = cut.lastIndexOf(". ");
  if (sentence > max * 0.6) return cut.slice(0, sentence + 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:–-]$/, "") + "…";
}

export function buildMetadata({
  title,
  description,
  path,
  keywords,
  type = "website",
  image,
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  type?: "website" | "article";
  /** Sayfaya özel paylaşım görseli (ör. /social/urun/<slug>); yoksa sitenin genel görseli. */
  image?: string;
}): Metadata {
  const url = `${SITE_URL}${path}`;
  const pageTitle = brandTitle(title);
  description = metaDescription(description);
  const images = [{ url: image ?? "/opengraph-image", width: 1200, height: 630, alt: image ? pageTitle : SITE_NAME }];
  return {
    title: { absolute: pageTitle },
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: {
      type,
      locale: "tr_TR",
      url,
      siteName: SITE_NAME,
      title: pageTitle,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: images.map((i) => i.url),
    },
  };
}

export type SocialType = "urun" | "kategori" | "referans" | "blog" | "hizmet";

/** Sayfanın paylaşım görseli (Facebook / WhatsApp önizlemesi, app/social route'u üretir). */
export const ogImagePath = (type: SocialType, slug: string) => `/social/${type}/${encodeURIComponent(slug)}`;

export type BreadcrumbItem = { name: string; path: string };

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

// Admin panelinden markdown olarak girilen metni meta açıklama ve JSON-LD için düz metne çevirir.
export function stripMarkdown(text: string) {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+])\s+/gm, "")
    .replace(/(\*\*|__|\*|_)(.+?)\1/g, "$2")
    .replace(/\s+/g, " ")
    .trim();
}

// Önce Ankara, sonra Türkiye: firma Ankara merkezli ama Türkiye geneline de
// kurulum yapıyor. LocalBusiness ve Service şemalarında ortak kullanılır.
export const AREA_SERVED = [
  { "@type": "City", name: "Ankara" },
  { "@type": "Country", name: "Türkiye" },
];

const DAY_ORDER = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const DAY_SCHEMA = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Admin ayarlarındaki "Pazartesi–Cumartesi, 09:00–18:30" gibi metni
// schema.org openingHoursSpecification'a çevirir; anlaşılamazsa undefined
// döner ve şemaya hiç eklenmez (yanlış saat yazmaktansa hiç yazmamak).
export function openingHoursFromText(text: string) {
  const m = text.match(/^\s*(\p{L}+)\s*[–-]\s*(\p{L}+)\s*,\s*(\d{2}:\d{2})\s*[–-]\s*(\d{2}:\d{2})\s*$/u);
  if (!m) return undefined;
  const from = DAY_ORDER.indexOf(m[1]);
  const to = DAY_ORDER.indexOf(m[2]);
  if (from < 0 || to < from) return undefined;
  return {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: DAY_SCHEMA.slice(from, to + 1),
    opens: m[3],
    closes: m[4],
  };
}
