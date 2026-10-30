import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { requireAdmin } from "@/lib/admin-guard";

// Teklif Stüdyosu fiyat kuralları: okuma ve kaydetme (maliyetler içerdiği için yalnız admin).

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { data, error } = await adminClient().from("quote_settings").select("data").eq("id", 1).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data?.data ?? null);
}

export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.rules) || JSON.stringify(body).length > 200_000) return NextResponse.json({ error: "Geçersiz ayar." }, { status: 400 });
  const { error } = await adminClient().from("quote_settings").upsert({ id: 1, data: body, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
