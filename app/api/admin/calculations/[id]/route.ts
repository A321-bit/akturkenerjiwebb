import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { requireAdmin } from "@/lib/admin-guard";
import { CALC_STAGES } from "@/lib/calc-pipeline";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (body.status !== undefined) {
    if (!(CALC_STAGES as readonly string[]).includes(body.status)) return NextResponse.json({ error: "Geçersiz aşama." }, { status: 400 });
    update.status = body.status;
  }
  if (body.assignedTo !== undefined) update.assigned_to = typeof body.assignedTo === "string" && body.assignedTo.trim() ? body.assignedTo.trim().slice(0, 80) : null;
  if (body.notes !== undefined) update.notes = typeof body.notes === "string" ? body.notes.slice(0, 4000) : null;
  if (body.followUpAt !== undefined) {
    const d = body.followUpAt ? new Date(body.followUpAt) : null;
    if (d && Number.isNaN(d.getTime())) return NextResponse.json({ error: "Geçersiz tarih." }, { status: 400 });
    update.follow_up_at = d ? d.toISOString() : null;
  }
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "Güncellenecek alan yok." }, { status: 400 });

  const { error } = await adminClient().from("calculations").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const { error } = await adminClient().from("calculations").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
