import { NextResponse } from "next/server";
import { runSocial } from "@/lib/social";
import { requireAdmin } from "@/lib/admin-guard";

// Admin "Şimdi çalıştır": görevi beklemeden hemen çalıştırır.
export const maxDuration = 60;

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    return NextResponse.json({ ok: true, ...(await runSocial()) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
