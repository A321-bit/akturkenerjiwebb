import { NextResponse } from "next/server";
import { z } from "zod";
import { adminClient } from "@/lib/data";
import { nextCaption, publishNow, unscheduleFacebook, type SocialPost } from "@/lib/social";
import { requireAdmin } from "@/lib/admin-guard";

// Tek gönderi: metin, zaman, platform ve onay düzenleme; yeniden üretme ve hemen paylaşma; silme.
// Facebook'a zamanlanmış gönderi değişirse Meta'daki kopyası değişmez (admin uyarır).
const schema = z.object({
  caption: z.string().min(1).optional(),
  scheduled_at: z.string().optional(),
  approved: z.boolean().optional(),
  platforms: z.array(z.enum(["facebook", "instagram"])).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
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

const action = z.object({ action: z.enum(["metin", "foto", "paylas"]) });

/**
 * metin: sıradaki alternatif metin · foto: sıradaki görsel/yerleşim · paylas: onayla ve hemen yayınla.
 * Facebook'ta zamanlanmış bir gönderi yeniden üretilirse Meta'daki kopyası silinir;
 * onaylıysa bir sonraki çalıştırmada yeni hâliyle tekrar zamanlanır.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const parsed = action.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  try {
    if (parsed.data.action === "paylas") return NextResponse.json(await publishNow(Number(id)));
    const db = adminClient();
    const { data } = await db.from("social_posts").select("*").eq("id", id).single();
    if (!data) return NextResponse.json({ error: "Gönderi bulunamadı." }, { status: 404 });
    const post = data as SocialPost;
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.data.action === "metin") {
      const caption = await nextCaption(post);
      if (!caption) return NextResponse.json({ error: "Bu içerik artık yayında değil; metin üretilemedi." }, { status: 404 });
      patch.caption = caption;
    } else {
      patch.image_variant = (post.image_variant ?? 0) + 1;
    }
    await unscheduleFacebook(post);
    const { data: out, error } = await db.from("social_posts").update(patch).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const { error } = await adminClient().from("social_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
