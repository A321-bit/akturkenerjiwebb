import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { currentUser, requireAdmin } from "@/lib/admin-guard";
import { permsOf } from "@/lib/staff";
import { phoneKey } from "@/lib/crm";

// Müşteri kartı: kimlik, teklifler, faaliyetler, talepler ve tahsilat. Düzenleme ve faaliyet ekleme.

/** Kartı görme yetkisi: tüm müşteriler yetkisi, kendine atanmış ya da atanmamış. */
async function canAccess(customerId: string) {
  const user = await currentUser();
  if (user?.kind !== "staff" || permsOf(user).allCustomers) return { ok: true, user };
  const { data } = await adminClient().from("customers").select("assigned_to").eq("id", customerId).maybeSingle();
  return { ok: !data || data.assigned_to == null || data.assigned_to === user.id, user };
}
const forbidden = () => NextResponse.json({ error: "Bu müşteri size atanmamış." }, { status: 403 });

const FIELDS = ["full_name", "company", "phone", "email", "province", "district", "address", "mahalle", "ada", "parsel", "source", "segment", "notes"] as const;

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!(await canAccess(id)).ok) return forbidden();
  const db = adminClient();
  const { data: customer, error } = await db.from("customers").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!customer) return NextResponse.json({ error: "Müşteri bulunamadı." }, { status: 404 });

  const [props, acts, leads, calcs, meta] = await Promise.all([
    db.from("proposals").select("id, created_at, updated_at, proposal_no, status, dc_kwp, total, assigned_to, currency:data->>priceCurrency, tracking:data->tracking, views:data->views, last_view_at:data->>lastViewAt, token:data->>shareToken, plan:data->paymentPlan").eq("customer_id", id).order("created_at", { ascending: false }),
    db.from("customer_activities").select("*").eq("customer_id", id).order("created_at", { ascending: false }).limit(200),
    db.from("leads").select("id, created_at, need_type, phone, source, notes").limit(5000),
    db.from("calculations").select("id, created_at, type, phone, recommended_product, estimated_value").limit(5000),
    db.from("meta_leads").select("id, created_time, form_name, campaign_name, phone").limit(5000),
  ]);
  const same = (p: unknown) => phoneKey(String(p ?? "")) === customer.phone_key;
  const ids = (props.data ?? []).map((p) => p.id);
  const { data: payments } = ids.length ? await db.from("project_payments").select("*").in("proposal_id", ids).order("due_at", { ascending: true, nullsFirst: false }) : { data: [] };
  return NextResponse.json({
    customer,
    proposals: props.data ?? [],
    activities: acts.data ?? [],
    payments: payments ?? [],
    requests: [
      ...(leads.data ?? []).filter((l) => same(l.phone)).map((l) => ({ kind: "Web formu", at: l.created_at, text: l.need_type ?? l.source ?? "", note: l.notes })),
      ...(calcs.data ?? []).filter((c) => same(c.phone)).map((c) => ({ kind: "Hesaplama", at: c.created_at, text: c.recommended_product ?? c.type ?? "", note: null })),
      ...(meta.data ?? []).filter((m) => same(m.phone)).map((m) => ({ kind: "Meta formu", at: m.created_time, text: m.campaign_name ?? m.form_name ?? "", note: null })),
    ].sort((a, b) => String(b.at).localeCompare(String(a.at))),
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const access = await canAccess(id);
  if (!access.ok) return forbidden();
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  // Sorumlu atamayı, tüm müşterileri gören kişi değiştirir.
  if ("assigned_to" in b && access.user?.kind === "staff" && !permsOf(access.user).allCustomers) delete b.assigned_to;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const f of FIELDS) if (typeof b[f] === "string") patch[f] = b[f].trim().slice(0, f === "notes" ? 2000 : 400) || null;
  if ("assigned_to" in b) patch.assigned_to = Number.isFinite(b.assigned_to) ? b.assigned_to : null;
  if (typeof b.phone === "string") {
    const key = phoneKey(b.phone);
    if (!key) return NextResponse.json({ error: "Telefon numarası 10 hane olmalı." }, { status: 400 });
    patch.phone_key = key;
  }
  if (typeof b.full_name === "string" && !b.full_name.trim()) return NextResponse.json({ error: "Ad soyad gerekli." }, { status: 400 });
  const { error } = await adminClient().from("customers").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: /phone_key/.test(error.message) ? "Bu numara başka bir müşteride kayıtlı." : error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const access = await canAccess(id);
  if (!access.ok) return forbidden();
  const b = await req.json().catch(() => null);
  if (typeof b?.kind !== "string") return NextResponse.json({ error: "Geçersiz faaliyet." }, { status: 400 });
  const { data, error } = await adminClient()
    .from("customer_activities")
    .insert({ customer_id: Number(id), kind: b.kind.slice(0, 30), text: typeof b.text === "string" ? b.text.slice(0, 2000) : null, due_at: b.due_at || null, staff_id: access.user?.kind === "staff" ? access.user.id : Number.isFinite(b.staff_id) ? b.staff_id : null, proposal_id: Number.isFinite(b.proposal_id) ? b.proposal_id : null })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
