import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { currentUser, requireAdmin } from "@/lib/admin-guard";
import { permsOf } from "@/lib/staff";
import { restoreCosts } from "@/lib/teklif/costs";
import { phoneKey } from "@/lib/crm";

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

  const user = await currentUser();
  // Maliyet yetkisi yoksa ekrandaki değer satış fiyatıdır; gerçek maliyet sunucuda geri konur.
  if (user && !permsOf(user).cost && Array.isArray(p.lines)) p.lines = await restoreCosts(p.lines);
  const staffId = user?.kind === "staff" ? user.id : null;

  // Müşteri kartı: telefondan bulunur ya da açılır; böylece aynı kişinin teklifleri tek kartta toplanır.
  const key = phoneKey(p.customer?.phone);
  let customerId: number | null = null;
  if (key) {
    const cust = adminClient().from("customers");
    const { data: found } = await cust.select("id, assigned_to").eq("phone_key", key).maybeSingle();
    const c = p.customer;
    const fields = { full_name: String(c.name || "İsimsiz").slice(0, 120), phone: String(c.phone).slice(0, 30), email: c.email || null, province: c.province || null, district: c.district || null, address: c.address || null, mahalle: c.mahalle || null, ada: c.ada || null, parsel: c.parsel || null, updated_at: new Date().toISOString() };
    if (found) {
      customerId = found.id;
      await cust.update({ ...fields, ...(found.assigned_to == null && staffId ? { assigned_to: staffId } : {}) }).eq("id", found.id);
    } else {
      const { data: made } = await cust.insert({ ...fields, phone_key: key, source: "teklif", assigned_to: staffId }).select("id").single();
      customerId = made?.id ?? null;
    }
  }
  const row = {
    proposal_no: p.proposalNo.slice(0, 40),
    status: String(p.status ?? "Taslak").slice(0, 30),
    customer_name: p.customer?.name?.slice(0, 120) ?? null,
    customer_phone: p.customer?.phone?.slice(0, 30) ?? null,
    province: p.customer?.province?.slice(0, 40) ?? null,
    calc_id: Number.isFinite(p.calcId) ? p.calcId : null,
    dc_kwp: Number.isFinite(body.dcKwp) ? body.dcKwp : null,
    total: Number.isFinite(body.total) ? body.total : null,
    customer_id: customerId,
    ...(staffId ? { assigned_to: staffId } : {}),
    data: { ...p, id: undefined },
    updated_at: new Date().toISOString(),
  };
  const db = adminClient().from("proposals");
  // Açılma takibi sunucuda tutulur; ekrandaki eski değer üzerine yazmasın.
  const { data: cur } = p.id ? await db.select("views:data->views, last:data->>lastViewAt, notified:data->>notifiedAt, tracking:data->tracking").eq("id", p.id).maybeSingle() : { data: null };
  if (cur) {
    const c = cur as { views?: number; last?: string; notified?: string; tracking?: unknown };
    row.data = { ...row.data, views: c.views ?? undefined, lastViewAt: c.last ?? undefined, notifiedAt: c.notified ?? undefined, tracking: c.tracking ?? undefined };
  }
  const { data, error } = p.id ? await db.update(row).eq("id", p.id).select("id").single() : await db.insert(row).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // İlk kayıt müşterinin geçmişine işlenir.
  if (!p.id && customerId) await adminClient().from("customer_activities").insert({ customer_id: customerId, proposal_id: data.id, staff_id: staffId, kind: "teklif", text: `${row.proposal_no} oluşturuldu` });
  return NextResponse.json({ id: data.id });
}
