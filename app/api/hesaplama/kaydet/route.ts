import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { adminClient } from "@/lib/data";
import { rateLimit } from "@/lib/rate-limit";

// Hesaplayıcı sonucunu, müşteri iletişim bilgisi ve KVKK onayıyla birlikte "calculations"
// tablosuna kaydeder; satış ekibi admin panelde hesaplamanın tüm ayrıntısını görür.
// Talep bildirimi (e-posta, talepler listesi) ayrıca /api/lead üzerinden gider.

const TYPES = new Set(["on_grid", "sulama", "isi_pompasi", "off_grid"]);
const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export async function POST(req: Request) {
  const limited = rateLimit(req, "hesaplama", 10, 10 * 60e3);
  if (limited) return limited;
  const body = await req.json().catch(() => null);
  if (!body || !TYPES.has(body.type)) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });

  const fullname = str(body.fullname, 120);
  const phone = str(body.phone, 30);
  if (!fullname || !phone || body.consent !== true) {
    return NextResponse.json({ error: "Ad, telefon ve KVKK onayı gerekli." }, { status: 400 });
  }
  // Sonuç ve girdiler sunucuya JSON olarak gelir; aşırı büyük gövde kabul edilmez.
  const inputs = typeof body.inputs === "object" && body.inputs ? body.inputs : {};
  const results = typeof body.results === "object" && body.results ? body.results : {};
  if (JSON.stringify(inputs).length + JSON.stringify(results).length > 20000) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const report_token = randomBytes(12).toString("base64url");
  const { error } = await adminClient()
    .from("calculations")
    .insert({
      type: body.type,
      fullname,
      phone,
      email: str(body.email, 120),
      province: str(body.province, 40),
      lat: num(body.lat),
      lng: num(body.lng),
      inputs,
      results,
      recommended_product: str(body.recommendedProduct, 200),
      estimated_value: num(body.estimatedValue),
      score: num(body.score),
      consent: true,
      report_token,
      utm_source: str(body.utmSource, 100),
      utm_medium: str(body.utmMedium, 100),
      utm_campaign: str(body.utmCampaign, 150),
      ad_click_id: str(body.adClickId, 300),
      referrer: str(body.referrer, 500),
      landing_page: str(body.landingPage, 300),
    });
  if (error) {
    console.error("[hesaplama/kaydet]", error.message);
    return NextResponse.json({ error: "Kaydedilemedi, lütfen tekrar deneyin." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, token: report_token });
}
