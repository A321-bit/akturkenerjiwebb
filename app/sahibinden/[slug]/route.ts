import { renderSahibindenBanner } from "@/lib/sahibinden-banner";

// Sahibinden ilan açıklamasının sabit marka görseli (her ilanda aynı): /sahibinden/aktur-enerji.jpg
// (eski paket bazlı adresler de aynı görseli döner).
export async function GET() {
  const jpeg = await renderSahibindenBanner();
  return new Response(new Uint8Array(jpeg), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
