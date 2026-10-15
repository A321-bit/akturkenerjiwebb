import { NextResponse } from "next/server";
import { z } from "zod";
import { adminClient } from "@/lib/data";
import { STORE_PRODUCTS } from "@/lib/store";

// Müşteri ürün yorumu. Yorum onaysız kaydedilir; admin panelden onaylanınca
// sitede görünür. "website" alanı botlar için tuzak (gerçek kullanıcı görmez).
const schema = z.object({
  productSlug: z.string().min(1).max(200),
  name: z.string().trim().min(2, "Adınızı yazın.").max(60),
  city: z.string().trim().max(40).optional().default(""),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10, "Yorumunuz en az 10 karakter olmalı.").max(1500),
  website: z.string().max(0).optional().default(""),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz bilgi." }, { status: 400 });
  }
  const d = parsed.data;
  if (!STORE_PRODUCTS.some((p) => p.slug === d.productSlug)) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  const { error } = await adminClient().from("product_reviews").insert({
    product_slug: d.productSlug,
    name: d.name,
    city: d.city || null,
    rating: d.rating,
    comment: d.comment,
    approved: false,
  });
  if (error) {
    console.error("[review] insert hatası:", error.message);
    return NextResponse.json({ error: "Yorumunuz şu an kaydedilemedi, lütfen daha sonra tekrar deneyin." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
