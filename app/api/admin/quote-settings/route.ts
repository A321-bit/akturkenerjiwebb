import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { currentUser, requireAdmin } from "@/lib/admin-guard";
import { permsOf } from "@/lib/staff";

// Teklif Stüdyosu fiyat kuralları: okuma ve kaydetme (maliyetler içerdiği için yalnız admin).

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { data, error } = await adminClient().from("quote_settings").select("data").eq("id", 1).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const d = (data?.data ?? null) as { rules?: { maliyetUsd: number; marjPct: number }[] } | null;
  // Maliyet yetkisi yoksa kurallar satış fiyatıyla gider; maliyet ve kâr oranı tarayıcıya inmez.
  if (d?.rules && !permsOf(await currentUser()).cost) {
    return NextResponse.json({ ...d, rules: d.rules.map((r) => ({ ...r, maliyetUsd: r.maliyetUsd * (1 + r.marjPct / 100), marjPct: 0 })) });
  }
  return NextResponse.json(d);
}

export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const perms = permsOf(await currentUser());
  if (!perms.rules || !perms.cost) return NextResponse.json({ error: "Fiyat kurallarını değiştirme yetkiniz yok." }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.rules) || JSON.stringify(body).length > 200_000) return NextResponse.json({ error: "Geçersiz ayar." }, { status: 400 });
  const { error } = await adminClient().from("quote_settings").upsert({ id: 1, data: body, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
