import { NextResponse } from "next/server";
import { z } from "zod";
import { adminClient } from "@/lib/data";

// Tek gönderi: metin, zaman, platform ve onay düzenleme; silme.
// Facebook'a zamanlanmış gönderi değişirse Meta'daki kopyası değişmez (admin uyarır).
const schema = z.object({
  caption: z.string().min(1).optional(),
  scheduled_at: z.string().optional(),
  approved: z.boolean().optional(),
  platforms: z.array(z.enum(["facebook", "instagram"])).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  const patch: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() };
  if (parsed.data.platforms) {
    const db = adminClient();
    const { data: cur } = await db.from("social_posts").select("fb_status, ig_status").eq("id", id).single();
    const has = (p: "facebook" | "instagram") => parsed.data.platforms!.includes(p);
    if (cur && ["bekliyor", "yok"].includes(cur.fb_status)) patch.fb_status = has("facebook") ? "bekliyor" : "yok";
    if (cur && ["bekliyor", "yok"].includes(cur.ig_status)) patch.ig_status = has("instagram") ? "bekliyor" : "yok";
  }
  const { data, error } = await adminClient().from("social_posts").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { error } = await adminClient().from("social_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
