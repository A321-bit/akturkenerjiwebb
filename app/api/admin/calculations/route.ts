import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { requireAdmin } from "@/lib/admin-guard";

// Hesaplayıcı talepleri: listede gereken alanlar ve sonucun özet değerleri (aylık seri vb. hariç).
const COLUMNS =
  "id, created_at, type, fullname, phone, email, province, recommended_product, estimated_value, score, status, assigned_to, follow_up_at, notes, report_open_count, utm_source, utm_medium, utm_campaign, ad_click_id, referrer, landing_page, inputs, results->systemKw, results->panelCount, results->monthlyBillTl, results->annualSavingTl, results->paybackYears, results->coveragePct, results->annualKwh";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { data, error } = await adminClient().from("calculations").select(COLUMNS).order("created_at", { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
