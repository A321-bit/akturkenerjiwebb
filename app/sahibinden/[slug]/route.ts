import { getStoreProducts } from "@/lib/store-data";
import { renderSahibindenBanner } from "@/lib/sahibinden-banner";

// Sahibinden ilan açıklamasının açılış görseli: /sahibinden/<ürün-slug> (ya da /sahibinden/genel).
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const product = slug === "genel" ? null : ((await getStoreProducts()).find((p) => p.slug === slug) ?? null);
  if (slug !== "genel" && !product) return new Response("Bulunamadı", { status: 404 });
  const jpeg = await renderSahibindenBanner(product);
  return new Response(new Uint8Array(jpeg), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
