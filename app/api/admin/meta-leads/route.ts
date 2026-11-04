import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { syncMetaLeads } from "@/lib/meta-leads";
import { requireAdmin } from "@/lib/admin-guard";

// Admin "Meta Formları": liste (?sync=1 ise önce Meta'dan yeni başvurular çekilir).
// ?sync=quick&since=ISO: ekranın 2 dakikalık otomatik kontrolü; Meta'dan yalnız son 6 saati çeker
// ve yalnız `since` sonrası gelenleri döner (her kontrolde bütün liste indirilmez).
// /api/admin altı proxy ile korunur.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const params = new URL(req.url).searchParams;
  const quick = params.get("sync") === "quick";
  let sync: { forms: number; fetched: number; fresh: number } | { error: string } | null = null;
  if (params.get("sync")) {
    sync = await syncMetaLeads(quick ? { sinceHours: 6 } : {}).catch((e) => ({ error: e instanceof Error ? e.message : String(e) }));
  }
  let query = adminClient().from("meta_leads").select("*").order("created_time", { ascending: false }).limit(1000);
  const since = params.get("since");
  if (quick && since) query = query.gt("created_time", since);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sync, leads: data });
}
