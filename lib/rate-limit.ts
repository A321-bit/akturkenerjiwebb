import { NextResponse } from "next/server";

// Herkese açık form uçları için basit IP başına sınır (sunucu örneği başına, bellek içi).
// Spam talep/e-posta ve depolama kötüye kullanımını yavaşlatır.
const buckets = new Map<string, number[]>();

export function rateLimit(req: Request, key: string, max: number, windowMs: number): NextResponse | null {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "?";
  const id = `${key}:${ip}`;
  const now = Date.now();
  const list = (buckets.get(id) || []).filter((t) => now - t < windowMs);
  list.push(now);
  buckets.set(id, list);
  if (buckets.size > 5000) for (const [k, v] of buckets) if (now - v[v.length - 1] > windowMs) buckets.delete(k);
  return list.length > max ? NextResponse.json({ error: "Çok fazla deneme yapıldı, biraz sonra tekrar deneyin." }, { status: 429 }) : null;
}
