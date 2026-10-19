import { NextResponse } from "next/server";
import { runSocial } from "@/lib/social";

// Admin "Şimdi çalıştır": görevi beklemeden hemen çalıştırır.
export const maxDuration = 60;

export async function POST() {
  try {
    return NextResponse.json({ ok: true, ...(await runSocial()) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
