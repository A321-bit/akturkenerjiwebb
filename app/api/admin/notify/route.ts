import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";

// Admin → yöneticiye e-posta (iş tamamlandı bildirimleri vb.). Alıcı her zaman
// LEAD_NOTIFY_EMAIL'dir; dışarıya e-posta atmak için kullanılamaz. /api/admin altı proxy ile korunur.
const schema = z.object({ subject: z.string().min(1).max(200), html: z.string().min(1).max(100_000) });

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "RESEND_API_KEY tanımlı değil." }, { status: 500 });
  const { error } = await new Resend(apiKey).emails.send({
    from: "Aktürk Enerji Admin <onboarding@resend.dev>",
    to: process.env.LEAD_NOTIFY_EMAIL || "info@akturkenerji.com.tr",
    subject: parsed.data.subject,
    html: parsed.data.html,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
