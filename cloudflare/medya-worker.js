// Cloudflare Worker: medya.akturkenerji.com
// Sitenin /gorsel yolu görseli buradan ister. Dosya R2'de (MEDYA bağlantısı) varsa oradan verilir;
// yoksa Supabase'den BİR KEZ indirilip R2'ye yazılır. Böylece Supabase veri çıkışı her dosya için
// bir defayla sınırlı kalır (R2 çıkışı ücretsizdir). Görsel adları değişmez: yeni görsel yeni adla yüklenir.
//
// Kurulum (Cloudflare panel): R2'de "akturk-medya" kovası → Workers'ta bu kod → Settings > Bindings:
// R2 bucket, değişken adı MEDYA → Settings > Domains: medya.akturkenerji.com.
const ORIGIN = "https://tzibyocqotqcowebswlq.supabase.co/storage/v1/object/public/media/";
const LONG = "public, max-age=31536000, immutable";

export default {
  async fetch(req, env, ctx) {
    if (req.method !== "GET" && req.method !== "HEAD") return new Response("Yöntem desteklenmiyor", { status: 405 });
    const url = new URL(req.url);
    const raw = url.pathname.slice(1);
    let key;
    try { key = decodeURIComponent(raw); } catch { return new Response("Bulunamadı", { status: 404 }); }
    if (!key || key.split("/").some((p) => p === ".." || p === ".")) return new Response("Bulunamadı", { status: 404 });

    const hit = await env.MEDYA.get(key);
    if (hit) {
      const h = new Headers();
      hit.writeHttpMetadata(h);
      h.set("etag", hit.httpEtag);
      h.set("Cache-Control", LONG);
      h.set("x-medya", "r2");
      return new Response(req.method === "HEAD" ? null : hit.body, { headers: h });
    }

    const up = await fetch(ORIGIN + raw);
    if (!up.ok) {
      const missing = up.status === 404 || up.status === 400;
      return new Response("Bulunamadı", { status: missing ? 404 : 502, headers: { "Cache-Control": missing ? "public, max-age=600" : "no-store" } });
    }
    const buf = await up.arrayBuffer();
    const type = up.headers.get("content-type") || "application/octet-stream";
    ctx.waitUntil(env.MEDYA.put(key, buf, { httpMetadata: { contentType: type } }));
    return new Response(req.method === "HEAD" ? null : buf, { headers: { "Content-Type": type, "Cache-Control": LONG, "x-medya": "supabase" } });
  },
};
