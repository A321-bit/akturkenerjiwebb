import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Resend } from "resend";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { adminClient, SITE_URL } from "@/lib/data";
import { SHARE_TOKEN } from "@/lib/teklif/share";

// Müşteri canlı teklifi açtı: sayaç artar, satış ekibine e-posta gider (en fazla 30 dakikada bir).
// Sayfa içinden birkaç saniye sonra çağrılır; WhatsApp bağlantı önizlemesi bunu tetiklemez.

const NOTIFY_GAP = 30 * 60e3;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);

export async function POST(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!SHARE_TOKEN.test(token)) return NextResponse.json({ ok: false }, { status: 404 });

  // Panele giriş yapmış kişinin kendi kontrolü sayılmaz.
  if (await verifySessionToken((await cookies()).get(ADMIN_COOKIE_NAME)?.value)) return NextResponse.json({ ok: true, skipped: true });

  const db = adminClient();
  const { data: row } = await db.from("proposals").select("id, proposal_no, data").eq("data->>shareToken", token).maybeSingle();
  if (!row) return NextResponse.json({ ok: false }, { status: 404 });

  const d = row.data as Record<string, unknown> & { views?: number; notifiedAt?: string; customer?: { name?: string; phone?: string } };
  const now = new Date();
  const views = (d.views ?? 0) + 1;
  const due = !d.notifiedAt || now.getTime() - new Date(d.notifiedAt).getTime() > NOTIFY_GAP;
  await db.from("proposals").update({ data: { ...d, views, lastViewAt: now.toISOString(), notifiedAt: due ? now.toISOString() : d.notifiedAt } }).eq("id", row.id);

  const apiKey = process.env.RESEND_API_KEY;
  if (due && apiKey) {
    const name = esc(d.customer?.name || "Müşteri");
    const phone = esc(d.customer?.phone || "");
    try {
      await new Resend(apiKey).emails.send({
        from: "Aktürk Enerji Teklif <onboarding@resend.dev>",
        to: process.env.LEAD_NOTIFY_EMAIL || "info@akturkenerji.com.tr",
        subject: `${d.customer?.name || "Müşteri"} teklifi şu an açtı`,
        html: `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#1c2430"><p><b>${name}</b> ${esc(row.proposal_no ?? "")} numaralı teklifi şu an inceliyor. Aramak için en doğru an.</p>${phone ? `<p>Telefon: <a href="tel:${phone}">${phone}</a></p>` : ""}<p>Toplam açılma: ${views}</p><p><a href="${SITE_URL}/admin/teklif-studyosu?id=${row.id}">Teklifi panelde aç</a></p></div>`,
      });
    } catch {
      // E-posta gitmese de sayaç işlenir.
    }
  }
  return NextResponse.json({ ok: true });
}
