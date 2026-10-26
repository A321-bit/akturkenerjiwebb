import { NextResponse } from "next/server";
import { z } from "zod";
import { adminClient } from "@/lib/data";
import { buildPlan } from "@/lib/social";
import { requireAdmin } from "@/lib/admin-guard";

// Plan oluştur: haftalık yuvalara göre başlangıçtan itibaren N aylık taslak gönderiler.
// replace: henüz Meta'ya gitmemiş gelecek gönderiler silinip plan yeniden kurulur.
const schema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  months: z.number().int().min(1).max(12),
  slots: z
    .array(z.object({ weekday: z.number().int().min(1).max(7), hour: z.union([z.literal(10), z.literal(19)]), type: z.enum(["urun", "kategori", "referans", "blog", "hizmet"]) }))
    .min(1),
  platforms: z.array(z.enum(["facebook", "instagram"])).min(1),
  replace: z.boolean().default(false),
});

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  const db = adminClient();
  if (parsed.data.replace) {
    await db
      .from("social_posts")
      .delete()
      .gte("scheduled_at", new Date().toISOString())
      .in("fb_status", ["bekliyor", "yok"])
      .in("ig_status", ["bekliyor", "yok"]);
  }
  const rows = await buildPlan(parsed.data);
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db.from("social_posts").insert(rows.slice(i, i + 500));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, created: rows.length });
}
