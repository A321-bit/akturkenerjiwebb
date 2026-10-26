import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { syncMetaLeads } from "@/lib/meta-leads";
import { requireAdmin } from "@/lib/admin-guard";

// Admin "Meta Formları": liste (?sync=1 ise önce Meta'dan yeni başvurular çekilir).
// /api/admin altı proxy ile korunur.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  let sync: { forms: number; fetched: number } | { error: string } | null = null;
  if (new URL(req.url).searchParams.get("sync")) {
    sync = await syncMetaLeads().catch((e) => ({ error: e instanceof Error ? e.message : String(e) }));
  }
  const { data, error } = await adminClient().from("meta_leads").select("*").order("created_time", { ascending: false }).limit(1000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sync, leads: data });
}
