import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";

export async function GET() {
  const { data, error } = await adminClient()
    .from("potential_customers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.company_name) {
    return NextResponse.json({ error: "Firma adı zorunlu." }, { status: 400 });
  }

  const { company_name, contact_person, phone, district, category, note } = body as {
    company_name: string;
    contact_person?: string;
    phone?: string;
    district?: string;
    category?: string;
    note?: string;
  };

  const { data, error } = await adminClient()
    .from("potential_customers")
    .insert({
      company_name,
      contact_person: contact_person || null,
      phone: phone || null,
      district: district || null,
      category: category || null,
      note: note || null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
