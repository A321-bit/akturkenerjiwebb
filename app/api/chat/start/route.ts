import { NextResponse } from "next/server";
import { chatDb, signChat, transcript, type ChatMsg } from "@/lib/chat-session";
import { rateLimit } from "@/lib/rate-limit";

// Canlı destek: müşteri ad + telefonu girince kayıt açılır (admin → Talepler → Canlı Destek).
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limited = rateLimit(req, "chat-start", 5, 10 * 60e3);
  if (limited) return limited;
  let body: { name?: string; phone?: string; page?: string; messages?: ChatMsg[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  const name = (body.name || "").trim().slice(0, 80);
  const phone = (body.phone || "").trim().slice(0, 30);
  if (name.length < 2 || phone.replace(/\D/g, "").length < 10) {
    return NextResponse.json({ error: "Lütfen adınızı ve telefon numaranızı girin." }, { status: 400 });
  }
  const db = chatDb();
  if (!db) return NextResponse.json({ error: "Kayıt şu an yapılamıyor." }, { status: 503 });

  const messages = (body.messages || []).filter((m) => typeof m?.text === "string").map((m) => ({ role: m.role, text: m.text.slice(0, 1500) }));
  const { data, error } = await db
    .from("leads")
    .insert({
      need_type: "Canlı destek",
      bill_range: "Belirtilmedi",
      fullname: name,
      phone,
      source: "live_chat",
      form_page: (body.page || "").slice(0, 200) || null,
      notes: transcript(messages),
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[canlı destek] kayıt hatası", error);
    return NextResponse.json({ error: "Kayıt yapılamadı, lütfen tekrar deneyin." }, { status: 500 });
  }
  return NextResponse.json({ id: data.id, sig: signChat(data.id) });
}
