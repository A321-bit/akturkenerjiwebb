import { renderSocialCard, type SocialFormat, type SocialType } from "@/lib/social-card";

// /social/<tür>/<slug>            → 1200×630 önizleme (og:image)
// /social/<tür>/<slug>?f=sq       → 1080×1080 Instagram görseli
// &fiyat=1                        → üründe/kategoride fiyat rozeti
// &v=2                            → görsel/yerleşim varyantı (admin "Fotoğrafı değiştir")
const TYPES: SocialType[] = ["urun", "kategori", "referans", "blog", "hizmet"];

export async function GET(req: Request, ctx: { params: Promise<{ type: string; slug: string }> }) {
  const { type, slug } = await ctx.params;
  if (!TYPES.includes(type as SocialType)) return new Response("Bulunamadı", { status: 404 });
  const url = new URL(req.url);
  const format: SocialFormat = url.searchParams.get("f") === "sq" ? "sq" : "og";
  const jpeg = await renderSocialCard(
    type as SocialType,
    decodeURIComponent(slug),
    format,
    url.searchParams.get("fiyat") === "1",
    Math.max(0, Number(url.searchParams.get("v")) || 0),
  );
  if (!jpeg) return new Response("Bulunamadı", { status: 404 });
  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
