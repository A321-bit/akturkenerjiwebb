import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.path !== "string" || (body.type !== "pageview" && body.type !== "click")) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  // Vercel'in edge ağı bu başlıkları IP'ye göre otomatik ekler (üretimde çalışır,
  // yerel geliştirmede boş gelir) — ek bir servise ihtiyaç duymadan şehir/bölge bilgisi verir.
  const city = req.headers.get("x-vercel-ip-city");
  const region = req.headers.get("x-vercel-ip-country-region");
  const country = req.headers.get("x-vercel-ip-country");

  const { error } = await adminClient()
    .from("analytics_events")
    .insert({
      type: body.type,
      path: String(body.path).slice(0, 500),
      label: typeof body.label === "string" ? body.label.slice(0, 200) : null,
      city: city ? decodeURIComponent(city) : null,
      region: region ?? null,
      country: country ?? null,
      referrer: typeof body.referrer === "string" ? body.referrer.slice(0, 500) : null,
    });

  if (error) {
    console.error("[track] insert hatası:", error.message);
  }

  return NextResponse.json({ ok: true });
}
