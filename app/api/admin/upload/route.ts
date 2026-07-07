import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";

// Dosya, bu route'a değil doğrudan tarayıcıdan Supabase Storage'a yüklenir
// (imzalı URL ile). Vercel'in serverless fonksiyonlarında ~4.5MB request body
// limiti var; drone/kamera fotoğrafları bunu kolayca aşıp "yükleme reddedildi"
// hatasına yol açıyordu. Bu route artık sadece küçük bir JSON isteğiyle imzalı
// yükleme URL'i üretiyor, büyük dosya asla bu fonksiyondan geçmiyor.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const filename = typeof body?.filename === "string" ? body.filename : "";
  const ext = filename.includes(".") ? filename.split(".").pop() : "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const client = adminClient();
  const { data, error } = await client.storage.from("media").createSignedUploadUrl(path);
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "İmzalı yükleme URL'i oluşturulamadı." },
      { status: 500 }
    );
  }

  const { data: pub } = client.storage.from("media").getPublicUrl(path);
  return NextResponse.json({ path: data.path, token: data.token, publicUrl: pub.publicUrl });
}
