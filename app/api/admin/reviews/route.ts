import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";

// Admin: tüm ürün yorumları (önce onay bekleyenler).
export async function GET() {
  const { data, error } = await adminClient()
    .from("product_reviews")
    .select("*")
    .order("approved", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
