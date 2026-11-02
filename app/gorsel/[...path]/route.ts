// Supabase görselleri Vercel CDN üzerinden: /gorsel/<yol> → media kovası.
// Doğrudan rewrite önbelleğe alınmıyordu; Supabase "private, no-cache" ve çerez gönderiyor.
// Burada önbellek başlığını biz veriyoruz: her dosya Supabase'den bölge başına bir kez iner.
// Görsel adları değişmez (yeni görsel yeni adla yüklenir), bu yüzden süre uzun.
const MEDIA = "https://tzibyocqotqcowebswlq.supabase.co/storage/v1/object/public/media/";

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  if (!path.length || path.some((p) => p === ".." || p === ".")) return new Response("Bulunamadı", { status: 404 });

  const upstream = await fetch(MEDIA + path.map(encodeURIComponent).join("/"), { cache: "no-store" });
  if (!upstream.ok || !upstream.body) {
    // Kesinti ya da olmayan dosya kısa süre saklanır; aynı hatalı istek Supabase'e tekrar tekrar gitmez.
    return new Response("Bulunamadı", {
      status: upstream.status === 404 || upstream.status === 400 ? 404 : 502,
      headers: { "Cache-Control": "public, max-age=60", "Vercel-CDN-Cache-Control": "public, max-age=600" },
    });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "public, max-age=2592000",
      "Vercel-CDN-Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
