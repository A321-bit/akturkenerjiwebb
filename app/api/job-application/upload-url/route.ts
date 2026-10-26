import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { rateLimit } from "@/lib/rate-limit";

// CV dosyası tarayıcıdan doğrudan Supabase Storage'a yüklenir (imzalı URL ile),
// aynı /api/admin/upload deseni — büyük dosyalar serverless fonksiyon body
// limitine takılmasın diye.
export async function POST(req: Request) {
  const limited = rateLimit(req, "cv-upload", 5, 10 * 60e3);
  if (limited) return limited;
  const body = await req.json().catch(() => null);
  const filename = typeof body?.filename === "string" ? body.filename : "";
  // Yalnız CV formatları: .html/.svg gibi dosyalar herkese açık depoda oltalama için kullanılabilir.
  const ext = (filename.includes(".") ? filename.split(".").pop() : "pdf")?.toLowerCase();
  if (!ext || !["pdf", "doc", "docx"].includes(ext)) {
    return NextResponse.json({ error: "Yalnızca PDF, DOC veya DOCX yükleyebilirsiniz." }, { status: 400 });
  }
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
