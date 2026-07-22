import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";

const VALID_STATUSES = ["Aranmadı", "Arandı", "Görüşülüyor", "Olumlu", "Olumsuz"];

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });

  const { status, note, company_name, contact_person, phone, district, category } = body as {
    status?: string;
    note?: string;
    company_name?: string;
    contact_person?: string;
    phone?: string;
    district?: string;
    category?: string;
  };
  const update: Record<string, unknown> = {};
  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
    }
    update.status = status;
    update.status_updated_at = new Date().toISOString();
  }
  if (note !== undefined) update.note = note;
  if (company_name !== undefined) update.company_name = company_name;
  if (contact_person !== undefined) update.contact_person = contact_person;
  if (phone !== undefined) update.phone = phone;
  if (district !== undefined) update.district = district;
  if (category !== undefined) update.category = category;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok." }, { status: 400 });
  }

  const { data, error } = await adminClient()
    .from("potential_customers")
    .update(update)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { error } = await adminClient().from("potential_customers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
