import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";

export async function GET() {
  const { data, error } = await adminClient()
    .from("job_applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
