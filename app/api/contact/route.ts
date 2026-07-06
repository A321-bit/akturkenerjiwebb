import { NextResponse } from "next/server";

// [PLACEHOLDER] Şu anda form verileri sadece sunucu loguna yazılır.
// Gerçek bir e-posta/CRM entegrasyonu için örn. Resend, SendGrid ya da
// bir Google Sheets webhook'u buraya eklenebilir. Vercel ortam
// değişkenleri (Project Settings > Environment Variables) üzerinden
// API anahtarı eklenmesi önerilir.
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { name, phone, email, city, interest, message } = data;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Ad ve telefon zorunludur." },
        { status: 400 }
      );
    }

    // Şimdilik sunucu loguna yazıyoruz — Vercel dashboard'unda
    // Project > Logs sekmesinden görülebilir.
    console.log("[Yeni Teklif Talebi]", {
      name,
      phone,
      email,
      city,
      interest,
      message,
      receivedAt: new Date().toISOString(),
    });

    // Örnek e-posta entegrasyonu (Resend) için:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: "website@akturkenerji.com",
    //   to: "info@akturkenerji.com",
    //   subject: `Yeni teklif talebi — ${name}`,
    //   text: `${name} / ${phone} / ${email}\n${city}\n${interest}\n${message}`,
    // });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
