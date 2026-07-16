import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";

// CV dosyası tarayıcıdan doğrudan Supabase Storage'a yüklenir (imzalı URL ile),
// aynı /api/admin/upload deseni — büyük dosyalar serverless fonksiyon body
// limitine takılmasın diye.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const filename = typeof body?.filename === "string" ? body.filename : "";
  const ext = filename.includes(".") ? filename.split(".").pop() : "pdf";
  const path = `is-basvurulari/${crypto.randomUUID()}.${ext}`;

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
