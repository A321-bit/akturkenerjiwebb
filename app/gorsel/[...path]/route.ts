// Supabase görselleri Vercel CDN üzerinden: /gorsel/<yol> → media kovası.
// Doğrudan rewrite önbelleğe alınmıyordu; Supabase "private, no-cache" ve çerez gönderiyor.
// Burada önbellek başlığını biz veriyoruz: her dosya Supabase'den bölge başına bir kez iner.
// Görsel adları değişmez (yeni görsel yeni adla yüklenir), bu yüzden süre uzun.
const MEDIA = "https://tzibyocqotqcowebswlq.supabase.co/storage/v1/object/public/media/";

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  if (!path.length || path.some((p) => p === ".." || p === ".")) return new Response("Bulunamadı", { status: 404 });

  const url = MEDIA + path.map(encodeURIComponent).join("/");
  // Supabase yoğunlukta geçici 429 (istek sınırı) ya da 5xx veriyor; artan aralıkla iki kez daha denenir.
  let upstream: Response | null = null;
  for (const wait of [0, 400, 1200]) {
    if (wait) await new Promise((r) => setTimeout(r, wait));
    upstream = await fetch(url, { cache: "no-store" }).catch(() => null);
    if (upstream?.ok || upstream?.status === 404 || upstream?.status === 400) break;
  }
  if (!upstream?.ok || !upstream.body) {
    const missing = upstream?.status === 404 || upstream?.status === 400;
    console.error("[gorsel]", upstream?.status ?? "fetch hatası", path.join("/"));
    // Olmayan dosya kısa süre saklanır; geçici hata hiç saklanmaz, sonraki ziyaretçi görseli alır.
    return new Response("Bulunamadı", {
      status: missing ? 404 : 502,
      headers: missing ? { "Cache-Control": "public, max-age=60", "Vercel-CDN-Cache-Control": "public, max-age=600" } : { "Cache-Control": "no-store" },
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
