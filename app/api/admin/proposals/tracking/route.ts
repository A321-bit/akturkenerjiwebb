import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { currentUser, requireAdmin } from "@/lib/admin-guard";
import { permsOf } from "@/lib/staff";
import { STAGES, type Tracking } from "@/lib/teklif/tracking";

// Teklif ve proje takibi: tek listeden aşama, takip tarihi ve not.

const LIST = "id, customer_id, created_at, updated_at, proposal_no, customer_name, customer_phone, province, dc_kwp, total, views:data->views, last_view_at:data->>lastViewAt, token:data->>shareToken, currency:data->>priceCurrency, valid_days:data->validDays, tracking:data->tracking";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const user = await currentUser();
  let q = adminClient().from("proposals").select(LIST).order("updated_at", { ascending: false }).limit(500);
  if (user?.kind === "staff" && !permsOf(user).allCustomers) q = q.eq("assigned_to", user.id);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json().catch(() => null);
  if (!Number.isFinite(b?.id)) return NextResponse.json({ error: "Geçersiz kayıt." }, { status: 400 });
  const db = adminClient();
  const { data: row, error } = await db.from("proposals").select("data, customer_id, assigned_to").eq("id", b.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const user = await currentUser();
  if (user?.kind === "staff" && !permsOf(user).allCustomers && row.assigned_to !== user.id) return NextResponse.json({ error: "Bu teklif size atanmamış." }, { status: 403 });
  const d = row.data as { tracking?: Tracking };
  const cur: Tracking = d.tracking ?? { stage: "teklif", dates: {} };
  const next: Tracking = { ...cur };
  if (typeof b.stage === "string" && STAGES.some((s) => s.key === b.stage)) {
    next.stage = b.stage;
    next.dates = { ...cur.dates, [b.stage]: cur.dates?.[b.stage] ?? new Date().toISOString() };
  }
  if (typeof b.followUp === "string") next.followUp = b.followUp.slice(0, 10) || undefined;
  if (typeof b.note === "string") next.note = b.note.slice(0, 2000);
  if (typeof b.lostReason === "string") next.lostReason = b.lostReason.slice(0, 200);
  const { error: e2 } = await db.from("proposals").update({ data: { ...d, tracking: next }, updated_at: new Date().toISOString() }).eq("id", b.id);
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
  if (row.customer_id && next.stage !== cur.stage) {
    await db.from("customer_activities").insert({ customer_id: row.customer_id, proposal_id: b.id, kind: "asama", staff_id: user?.kind === "staff" ? user.id : null, text: STAGES.find((s) => s.key === next.stage)?.ad });
  }
  return NextResponse.json(next);
}
