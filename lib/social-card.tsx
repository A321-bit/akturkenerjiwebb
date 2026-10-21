import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { getBlogPostBySlug, getReferenceBySlug, getReferences, getServiceBySlug } from "./data";
import { formatTL, priceLabel } from "./store";
import { getStoreCategories, getStoreProducts } from "./store-data";

// Paylaşım görseli: Facebook/WhatsApp önizlemesi (og, 1200×630) ve Instagram
// gönderisi (sq, 1080×1080). Fotoğraf (ürün/kategoride çatı kurulumu) + başlık + marka şeridi;
// üründe isteğe bağlı fiyat. Çıktı JPEG (Instagram yalnızca JPEG kabul eder).

import type { SocialType } from "./seo";
export type { SocialType };
export type SocialFormat = "og" | "sq";

type Card = { title: string; eyebrow: string; images: string[]; price?: string; plain?: boolean };

/** Markdown içindeki görsel adresleri (blog / hizmet rehberi). */
const mdImages = (md?: string) => [...(md ?? "").matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)].map((m) => m[1]);
/** Boş ve tekrar eden görselleri ayıklar (aynı fotoğrafın -opt / -opt-800 boyutları tek sayılır). */
const list = (...xs: (string | undefined | null | string[])[]) => {
  const seen = new Set<string>();
  return xs.flat().filter((x): x is string => {
    const key = x?.replace(/-opt(-\d+)?\.webp$/, "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

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

// Ürün ve kategori kartlarında inverter/batarya fotoğrafı yerine kendi kurulumlarımızın
// çatı fotoğrafları kullanılır (referans kapakları; elle seçildi: panel net görünenler).
const ROOFTOP_REFS = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 29, 31, 33, 34, 35, 36, 37, 39, 40, 42, 46, 49, 50, 52, 53];
const OFFGRID_REFS = [28, 43, 44, 16, 24];
const OFFGRID_CATEGORIES = ["off-grid-paketler", "tarimsal-sulama-paketleri", "ruzgar-gunes-hibrit-sistemleri"];

/** Kategoriye uygun kurulum fotoğrafları; başlangıç noktası slug'a göre sabit (her ürün farklı fotoğrafla açılır). */
async function installPhotos(slug: string, category: string): Promise<string[]> {
  const ids = OFFGRID_CATEGORIES.includes(category) ? OFFGRID_REFS : ROOFTOP_REFS;
  const byId = new Map((await getReferences()).map((r) => [r.id, r.image]));
  const photos = ids.map((id) => byId.get(id)).filter((x): x is string => Boolean(x));
  const start = [...slug].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % Math.max(photos.length, 1);
  return [...photos.slice(start), ...photos.slice(0, start)];
}

async function cardData(type: SocialType, slug: string, withPrice: boolean): Promise<Card | null> {
  if (type === "urun") {
    const p = (await getStoreProducts()).find((x) => x.slug === slug);
    if (!p) return null;
    const cat = (await getStoreCategories()).find((c) => c.slug === p.category);
    return { title: p.name, eyebrow: cat?.name ?? "Mağaza", images: list(await installPhotos(p.slug, p.category)), price: withPrice && p.price != null ? priceLabel(p) : undefined };
  }
  if (type === "kategori") {
    const c = (await getStoreCategories()).find((x) => x.slug === slug);
    if (!c) return null;
    const inCat = (await getStoreProducts()).filter((p) => p.category === c.slug);
    const prices = inCat.filter((p) => p.price != null).map((p) => p.price!);
    return {
      title: c.name,
      eyebrow: "Aktürk Enerji Mağaza",
      images: list(await installPhotos(c.slug, c.slug)),
      price: withPrice && prices.length ? `${formatTL(Math.min(...prices))}'den başlayan` : undefined,
    };
  }
  if (type === "referans") {
    const r = await getReferenceBySlug(slug);
    if (!r) return null;
    return { title: r.title, eyebrow: [r.location, r.capacity].filter(Boolean).join(" · ") || "Referans", images: list(r.image, r.gallery) };
  }
  if (type === "blog") {
    const b = await getBlogPostBySlug(slug);
    if (!b) return null;
    // Blog kapakları kendi başlığını taşıyan tasarımlar: üstüne yazı eklenmez (görsel yoksa kart üretilir).
    return { title: b.title, eyebrow: b.category || "Blog", images: list(b.image, mdImages(b.content)), plain: Boolean(b.image) };
  }
  const s = await getServiceBySlug(slug);
  if (!s) return null;
  return { title: s.title, eyebrow: s.eyebrow || "Hizmetlerimiz", images: list(s.image, mdImages(s.guideContent)) };
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

/** variant: 0 = ilk görsel; sonrakiler görseller arasında döner, hepsi bitince yazı yerleşimi değişir. */
export async function renderSocialCard(type: SocialType, slug: string, format: SocialFormat, withPrice: boolean, variant = 0): Promise<Buffer | null> {
  const card = await cardData(type, slug, withPrice);
  if (!card) return null;
  const { width, height } = SIZES[format];
  const n = Math.max(card.images.length, 1);
  const top = Math.floor(variant / n) % 2 === 1; // ikinci turda başlık üstte
  const img = await photo(card.images[variant % n], width, height);
  // Blog kapağı kendi başlığını taşır; yalnızca kapak (variant 0) düz basılır.
  if (img && card.plain && variant === 0) {
    return sharp(Buffer.from(img.split(",")[1], "base64")).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  }
  const titleSize = format === "sq" ? (card.title.length > 48 ? 54 : 64) : card.title.length > 48 ? 46 : 56;

  const png = new ImageResponse(
    (
      <div style={{ width, height, display: "flex", position: "relative", background: "#0e1626", fontFamily: "Space Grotesk" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse (Satori) yalnızca düz img destekler */}
        {img && <img src={img} width={width} height={height} alt="" style={{ position: "absolute", top: 0, left: 0 }} />}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width,
            height,
            display: "flex",
            background: img
              ? top
                ? "linear-gradient(0deg, rgba(14,22,38,0) 0%, rgba(14,22,38,0.15) 35%, rgba(14,22,38,0.88) 72%, rgba(14,22,38,0.96) 100%)"
                : "linear-gradient(180deg, rgba(14,22,38,0) 0%, rgba(14,22,38,0.15) 35%, rgba(14,22,38,0.88) 72%, rgba(14,22,38,0.96) 100%)"
              : "linear-gradient(135deg, #0e1626 0%, #16223c 60%, #0e1626 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 56,
            right: 56,
            ...(top ? { top: 52 } : { bottom: 52 }),
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
