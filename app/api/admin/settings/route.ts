import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { revalidateSite } from "@/lib/admin-crud";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { data, error } = await adminClient().from("site_settings").select("*").eq("id", 1).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json();
  delete body.id;
  body.updated_at = new Date().toISOString();
  const { data, error } = await adminClient()
    .from("site_settings")
    .update(body)
    .eq("id", 1)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateSite();
  return NextResponse.json(data);
}
