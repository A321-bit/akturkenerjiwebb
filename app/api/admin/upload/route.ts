import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await adminClient()
    .storage.from("media")
    .upload(path, buffer, { contentType: file.type || "image/jpeg", upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = adminClient().storage.from("media").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
