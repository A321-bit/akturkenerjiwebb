import { NextResponse } from "next/server";
import { z } from "zod";
import { daysAgo, syncGsc } from "@/lib/gsc";

// Admin "Şimdi güncelle" (son günler) ve "Geçmişi yükle" (parça parça eski aylar).
export const maxDuration = 60;

const schema = z.union([
  z.object({ days: z.number().int().min(1).max(60) }),
  z.object({ start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
]);

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  const range = "days" in parsed.data ? { start: daysAgo(parsed.data.days), end: daysAgo(0) } : parsed.data;
  try {
    const result = await syncGsc(range.start, range.end);
    return NextResponse.json({ ok: true, ...range, ...result });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
