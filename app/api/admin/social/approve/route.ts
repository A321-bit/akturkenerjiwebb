import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { requireAdmin } from "@/lib/admin-guard";

// Bütün taslak gönderileri onaylar (otomatik paylaşıma açar).
export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { data, error } = await adminClient().from("social_posts").update({ approved: true, updated_at: new Date().toISOString() }).eq("approved", false).select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, approved: data?.length ?? 0 });
}
