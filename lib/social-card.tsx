import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { getBlogPostBySlug, getReferenceBySlug, getServiceBySlug } from "./data";
import { formatTL, priceLabel } from "./store";
import { getStoreCategories, getStoreProducts } from "./store-data";

// Paylaşım görseli: Facebook/WhatsApp önizlemesi (og, 1200×630) ve Instagram
// gönderisi (sq, 1080×1080). İçeriğin kendi fotoğrafı + başlık + marka şeridi;
// üründe isteğe bağlı fiyat. Çıktı JPEG (Instagram yalnızca JPEG kabul eder).

import type { SocialType } from "./seo";
export type { SocialType };
export type SocialFormat = "og" | "sq";

type Card = { title: string; eyebrow: string; image?: string; price?: string; plain?: boolean };

// Space Grotesk (sitenin başlık yazı tipi); Türkçe harfler latin-ext dosyasında.
const FONT_DIR = join(process.cwd(), "node_modules/@fontsource/space-grotesk/files");
let fontsPromise: Promise<{ name: string; data: Buffer; weight: 500 | 700; style: "normal" }[]> | null = null;
export function fonts() {
  fontsPromise ??= Promise.all(
    (["latin", "latin-ext"] as const).flatMap((subset) =>
      ([500, 700] as const).map(async (weight) => ({
        name: "Space Grotesk",
        data: await readFile(join(FONT_DIR, `space-grotesk-${subset}-${weight}-normal.woff`)),
        weight,
        style: "normal" as const,
      })),
    ),
  );
  return fontsPromise;
}

const SIZES: Record<SocialFormat, { width: number; height: number }> = {
  og: { width: 1200, height: 630 },
  sq: { width: 1080, height: 1080 },
};

async function cardData(type: SocialType, slug: string, withPrice: boolean): Promise<Card | null> {
  if (type === "urun") {
    const p = (await getStoreProducts()).find((x) => x.slug === slug);
    if (!p) return null;
    const cat = (await getStoreCategories()).find((c) => c.slug === p.category);
    return { title: p.name, eyebrow: cat?.name ?? "Mağaza", image: p.image, price: withPrice && p.price != null ? priceLabel(p) : undefined };
  }
  if (type === "kategori") {
    const c = (await getStoreCategories()).find((x) => x.slug === slug);
    if (!c) return null;
    const prices = (await getStoreProducts()).filter((p) => p.category === c.slug && p.price != null).map((p) => p.price!);
    return {
      title: c.name,
      eyebrow: "Aktürk Enerji Mağaza",
      image: c.image,
      price: withPrice && prices.length ? `${formatTL(Math.min(...prices))}'den başlayan` : undefined,
    };
  }
  if (type === "referans") {
    const r = await getReferenceBySlug(slug);
    if (!r) return null;
    return { title: r.title, eyebrow: [r.location, r.capacity].filter(Boolean).join(" · ") || "Referans", image: r.image };
  }
  if (type === "blog") {
    const b = await getBlogPostBySlug(slug);
    if (!b) return null;
    // Blog kapakları kendi başlığını taşıyan tasarımlar: üstüne yazı eklenmez (görsel yoksa kart üretilir).
    return { title: b.title, eyebrow: b.category || "Blog", image: b.image, plain: Boolean(b.image) };
  }
  const s = await getServiceBySlug(slug);
  if (!s) return null;
  return { title: s.title, eyebrow: s.eyebrow || "Hizmetlerimiz", image: s.image };
}

/** Kaynak görsel (çoğu WebP) → kart boyutuna kırpılmış JPEG data URL (Satori WebP okuyamaz). */
async function photo(url: string | undefined, width: number, height: number): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url.startsWith("http") ? url : `https://akturkenerji.com${url}`);
    if (!res.ok) return null;
    const buf = await sharp(Buffer.from(await res.arrayBuffer())).resize(width, height, { fit: "cover" }).jpeg({ quality: 85 }).toBuffer();
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function renderSocialCard(type: SocialType, slug: string, format: SocialFormat, withPrice: boolean): Promise<Buffer | null> {
  const card = await cardData(type, slug, withPrice);
  if (!card) return null;
  const { width, height } = SIZES[format];
  const img = await photo(card.image, width, height);
  if (img && card.plain) {
    return sharp(Buffer.from(img.split(",")[1], "base64")).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  }
  const titleSize = format === "sq" ? (card.title.length > 48 ? 54 : 64) : card.title.length > 48 ? 46 : 56;

  const png = new ImageResponse(
    (
      <div style={{ width, height, display: "flex", position: "relative", background: "#0e1626", fontFamily: "Space Grotesk" }}>
        {img && <img src={img} width={width} height={height} style={{ position: "absolute", top: 0, left: 0 }} />}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width,
            height,
            display: "flex",
            background: img
              ? "linear-gradient(180deg, rgba(14,22,38,0) 0%, rgba(14,22,38,0.15) 35%, rgba(14,22,38,0.88) 72%, rgba(14,22,38,0.96) 100%)"
              : "linear-gradient(135deg, #0e1626 0%, #16223c 60%, #0e1626 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 56,
            right: 56,
            bottom: 52,
            display: "flex",
            flexDirection: "column",
            color: "#f5f6f8",
          }}
        >
          <div style={{ display: "flex", fontSize: 26, fontWeight: 600, color: "#f5b700", letterSpacing: 0.5 }}>{card.eyebrow}</div>
          <div style={{ display: "flex", marginTop: 10, fontSize: titleSize, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1 }}>{card.title}</div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 26, gap: 18 }}>
            {card.price && (
              <div style={{ display: "flex", background: "#f5b700", color: "#0e1626", fontSize: 32, fontWeight: 700, padding: "8px 20px", borderRadius: 999 }}>
                {card.price}
              </div>
            )}
            <div style={{ display: "flex", fontSize: 26, fontWeight: 700 }}>
              <span style={{ color: "#f5f6f8" }}>AKTÜRK</span>
              <span style={{ color: "#5b8fe0", marginLeft: 6 }}>ENERJİ</span>
              <span style={{ color: "#aab2c0", marginLeft: 14, fontWeight: 500 }}>akturkenerji.com</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { width, height, fonts: await fonts() },
  );
  return sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
}
