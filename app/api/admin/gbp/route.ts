import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { adminClient } from "@/lib/data";
import { createPost, deletePost, deleteReply, disconnect, isConnected, listLocations, listPosts, listReviews, performance, replyReview, searchKeywords } from "@/lib/gbp";

// Admin panel Google İşletme sayfasının veri ucu. Yayınlama işlemleri (yanıt, gönderi)
// yalnızca oturum açmış adminin tıklamasıyla gelir.

const ACCOUNT = /^accounts\/\d+$/;
const LOCATION = /^locations\/\d+$/;
const REVIEW = /^accounts\/\d+\/locations\/\d+\/reviews\/[\w-]+$/;
const POST_NAME = /^accounts\/\d+\/locations\/\d+\/localPosts\/[\w-]+$/;

const plan = () => adminClient().from("gbp_scheduled_posts");

const fail = (e: unknown) => NextResponse.json({ error: e instanceof Error ? e.message : "Google API hatası" }, { status: 502 });

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const q = new URL(req.url).searchParams;
  const view = q.get("view") ?? "status";
  const account = q.get("account") ?? "";
  const location = q.get("location") ?? "";
  try {
    if (view === "status") {
      const conn = await isConnected();
      if (!conn) return NextResponse.json({ connected: false });
      return NextResponse.json({ connected: true, connectedAt: conn.connectedAt, locations: await listLocations() });
    }
    if (!LOCATION.test(location)) return NextResponse.json({ error: "Geçersiz işletme." }, { status: 400 });
    if (view === "planned") {
      const { data, error } = await adminClient().from("gbp_scheduled_posts").select("*").eq("location", location).order("scheduled_at");
      if (error) throw new Error(error.message);
      return NextResponse.json({ items: data });
    }
    if (view === "performance") {
      const [perf, keywords] = await Promise.all([performance(location), searchKeywords(location).catch(() => [])]);
      return NextResponse.json({ ...perf, keywords });
    }
    if (!ACCOUNT.test(account)) return NextResponse.json({ error: "Geçersiz hesap." }, { status: 400 });
    if (view === "reviews") return NextResponse.json(await listReviews(account, location));
    if (view === "posts") return NextResponse.json({ posts: await listPosts(account, location) });
    return NextResponse.json({ error: "Geçersiz görünüm." }, { status: 400 });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json().catch(() => null);
  if (!b?.action) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  try {
    switch (b.action) {
      case "reply": {
        const comment = text(b.comment, 4000);
        if (!REVIEW.test(b.review) || !comment) return NextResponse.json({ error: "Yanıt metni gerekli." }, { status: 400 });
        await replyReview(b.review, comment);
        break;
      }
      case "deleteReply":
        if (!REVIEW.test(b.review)) return NextResponse.json({ error: "Geçersiz yorum." }, { status: 400 });
        await deleteReply(b.review);
        break;
      case "post": {
        const summary = text(b.summary, 1500);
        if (!ACCOUNT.test(b.account) || !LOCATION.test(b.location) || !summary) return NextResponse.json({ error: "Gönderi metni gerekli." }, { status: 400 });
        const url = text(b.url, 500);
        const photoUrl = text(b.photoUrl, 500);
        if ([url, photoUrl].some((u) => u && !u.startsWith("https://"))) return NextResponse.json({ error: "Bağlantılar https:// ile başlamalı." }, { status: 400 });
        await createPost(b.account, b.location, { summary, url: url || undefined, photoUrl: photoUrl || undefined });
        break;
      }
      case "deletePost":
        if (!POST_NAME.test(b.post)) return NextResponse.json({ error: "Geçersiz gönderi." }, { status: 400 });
        await deletePost(b.post);
        break;
      case "planUpdate": {
        const summary = text(b.summary, 1500);
        const when = new Date(b.scheduledAt);
        const url = text(b.url, 500);
        if (!summary || Number.isNaN(when.getTime())) return NextResponse.json({ error: "Metin ve tarih gerekli." }, { status: 400 });
        if (url && !url.startsWith("https://")) return NextResponse.json({ error: "Bağlantı https:// ile başlamalı." }, { status: 400 });
        const { error } = await plan().update({ summary, url: url || null, scheduled_at: when.toISOString(), updated_at: new Date().toISOString() }).eq("id", b.id).eq("approved", false);
        if (error) throw new Error(error.message);
        break;
      }
      case "planApprove": {
        const { data: row, error } = await plan().select("*").eq("id", b.id).single();
        if (error) throw new Error(error.message);
        if (row.approved) break; // çift gönderimi önler
        if (new Date(row.scheduled_at).getTime() < Date.now() + 10 * 60e3) return NextResponse.json({ error: "Tarih geçmiş ya da çok yakın; tarihi güncelleyin." }, { status: 400 });
        try {
          const created = await createPost(row.account, row.location, { summary: row.summary, url: row.url ?? undefined, photoUrl: row.photo_url ?? undefined, scheduledTime: new Date(row.scheduled_at).toISOString() });
          await plan().update({ approved: true, status: created.state ?? "SCHEDULED", published_name: created.name, error: null, updated_at: new Date().toISOString() }).eq("id", b.id);
        } catch (e) {
          await plan().update({ error: e instanceof Error ? e.message : "Google hatası", updated_at: new Date().toISOString() }).eq("id", b.id);
          throw e;
        }
        break;
      }
      case "planRevoke": {
        const { data: row, error } = await plan().select("published_name").eq("id", b.id).single();
        if (error) throw new Error(error.message);
        if (row.published_name) await deletePost(row.published_name);
        await plan().update({ approved: false, status: "taslak", published_name: null, updated_at: new Date().toISOString() }).eq("id", b.id);
        break;
      }
      case "planDelete": {
        const { data: row, error } = await plan().select("published_name").eq("id", b.id).single();
        if (error) throw new Error(error.message);
        if (row.published_name) await deletePost(row.published_name);
        await plan().delete().eq("id", b.id);
        break;
      }
      case "disconnect":
        await disconnect();
        break;
      default:
        return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
