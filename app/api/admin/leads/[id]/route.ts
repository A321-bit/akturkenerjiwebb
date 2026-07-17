import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";

const VALID_STATUSES = ["Yeni", "Arandı", "Ulaşılamadı", "Olumsuz", "Olumlu"];

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });

  const { status, notes } = body as { status?: string; notes?: string };
  const update: Record<string, unknown> = {};
  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
    }
    update.status = status;
    update.status_updated_at = new Date().toISOString();
  }
  if (notes !== undefined) update.notes = notes;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok." }, { status: 400 });
  }

  const { data, error } = await adminClient()
    .from("leads")
    .update(update)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { error } = await adminClient().from("leads").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
