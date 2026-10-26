import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { daysAgo } from "@/lib/gsc";
import { requireAdmin } from "@/lib/admin-guard";

// Tek anahtar kelimenin günlük seyri (sıra, gösterim, tıklama).
export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const days = Math.min(480, Math.max(7, Number(url.searchParams.get("days")) || 90));
  const device = url.searchParams.get("device") || null;
  if (!q) return NextResponse.json({ error: "Sorgu yok." }, { status: 400 });
  const { data, error } = await adminClient().rpc("gsc_query_daily", {
    p_query: q,
    p_start: daysAgo(days),
    p_end: daysAgo(0),
    p_device: device,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
