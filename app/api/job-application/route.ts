import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });

  const { fullname, address, phone, description, cvUrl } = body as {
    fullname?: string;
    address?: string;
    phone?: string;
    description?: string;
    cvUrl?: string;
  };

  if (!fullname || !phone) {
    return NextResponse.json({ error: "Zorunlu alanlar eksik." }, { status: 400 });
  }

  const { error } = await adminClient().from("job_applications").insert({
    fullname,
    address: address || null,
    phone,
    description: description || null,
    cv_url: cvUrl || null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
