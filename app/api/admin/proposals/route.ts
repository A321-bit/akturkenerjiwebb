import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { requireAdmin } from "@/lib/admin-guard";

// Teklif Stüdyosu kayıtları: liste (özet alanlar) ve kaydet (yeni ya da güncelle).

const LIST = "id, created_at, updated_at, proposal_no, status, customer_name, customer_phone, province, dc_kwp, total, views:data->views, last_view_at:data->>lastViewAt";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { data, error } = await adminClient().from("proposals").select(LIST).order("updated_at", { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => null);
  const p = body?.proposal;
  if (!p || typeof p.proposalNo !== "string") return NextResponse.json({ error: "Geçersiz teklif." }, { status: 400 });
  if (JSON.stringify(p).length > 4_000_000) return NextResponse.json({ error: "Teklif çok büyük." }, { status: 400 });

  const row = {
    proposal_no: p.proposalNo.slice(0, 40),
    status: String(p.status ?? "Taslak").slice(0, 30),
    customer_name: p.customer?.name?.slice(0, 120) ?? null,
    customer_phone: p.customer?.phone?.slice(0, 30) ?? null,
    province: p.customer?.province?.slice(0, 40) ?? null,
    calc_id: Number.isFinite(p.calcId) ? p.calcId : null,
    dc_kwp: Number.isFinite(body.dcKwp) ? body.dcKwp : null,
    total: Number.isFinite(body.total) ? body.total : null,
    data: { ...p, id: undefined },
    updated_at: new Date().toISOString(),
  };
  const db = adminClient().from("proposals");
  // Açılma takibi sunucuda tutulur; ekrandaki eski değer üzerine yazmasın.
  const { data: cur } = p.id ? await db.select("views:data->views, last:data->>lastViewAt, notified:data->>notifiedAt").eq("id", p.id).maybeSingle() : { data: null };
  if (cur) {
    const c = cur as { views?: number; last?: string; notified?: string };
    row.data = { ...row.data, views: c.views ?? undefined, lastViewAt: c.last ?? undefined, notifiedAt: c.notified ?? undefined };
  }
  const { data, error } = p.id ? await db.update(row).eq("id", p.id).select("id").single() : await db.insert(row).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
