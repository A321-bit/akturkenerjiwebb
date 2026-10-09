import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "./data";

export function buildMetadata({
  title,
  description,
  path,
  keywords,
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  type?: "website" | "article";
}): Metadata {
  const url = `${SITE_URL}${path}`;
  // Layout'taki "%s | Aktürk Enerji" şablonu uzun başlıkları 60 karakterin
  // üstüne taşıyıp arama sonucunda kesilmelerine yol açıyordu; uzun başlıkta
  // marka eki eklenmez.
  const pageTitle: Metadata["title"] = title.length > 44 ? { absolute: title } : title;
  const images = [{ url: "/opengraph-image", width: 1200, height: 630, alt: SITE_NAME }];
  return {
    title: pageTitle,
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: {
      type,
      locale: "tr_TR",
      url,
      siteName: SITE_NAME,
      title,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((i) => i.url),
    },
  };
}

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
