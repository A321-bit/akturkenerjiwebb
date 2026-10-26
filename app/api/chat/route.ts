import { NextResponse } from "next/server";
import { getChatContext } from "@/lib/chat-context";
import { chatDb, transcript, verifyChat } from "@/lib/chat-session";

// Canlı destek: Gemini (Google AI Studio ücretsiz kota) ile cevap.
// Kişisel bilgi (ad/telefon) Gemini'ye gitmez; /api/chat/start ile açılan
// kayda burada yalnızca sohbet dökümü yazılır.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Msg = { role: "user" | "assistant"; text: string };

// Model yoğun/kotası dolu olduğunda sıradakine geçilir; her deneme süre sınırlı.
const MODELS = [...new Set([process.env.GEMINI_MODEL || "gemini-flash-latest", "gemini-flash-lite-latest", "gemini-2.5-flash"])];
const hits = new Map<string, number[]>();

function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 10 * 60e3);
  list.push(now);
  hits.set(ip, list);
  return list.length > 30;
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "Canlı destek şu an kullanılamıyor." }, { status: 503 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "?";
  if (limited(ip)) return NextResponse.json({ error: "Çok fazla mesaj gönderildi, biraz sonra tekrar deneyin." }, { status: 429 });

  let all: Msg[];
  let session: { id?: unknown; sig?: unknown } | undefined;
  try {
    const body = await req.json();
    session = body.session;
    all = (body.messages as Msg[])
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.text === "string")
      .map((m) => ({ role: m.role, text: m.text.slice(0, 1500) }));
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  const messages = all.slice(-12);
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const system = await getChatContext();
  const contents = messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.text }] }));
  let data: { candidates?: { content?: { parts?: { text?: string }[] } }[] } | null = null;
  let lastStatus = 0;
  for (const [i, model] of MODELS.entries()) {
    // Önce düşünme sınırlı denenir; model bu ayarı kabul etmezse (400) ayarsız tekrar denenir.
    for (const thinking of [true, false]) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          generationConfig: { temperature: 0.4, maxOutputTokens: 2048, ...(thinking ? { thinkingConfig: { thinkingBudget: 512 } } : {}) },
        }),
        signal: AbortSignal.timeout(i === 0 ? 22000 : 15000),
      }).catch(() => null);
      lastStatus = res?.status ?? 0;
      if (res?.ok) {
        data = await res.json();
        break;
      }
      console.error("[canlı destek] Gemini hatası", model, lastStatus, res && (await res.text()).slice(0, 300));
      if (lastStatus !== 400 || !thinking) break;
    }
    if (data) break;
  }

  if (!data) {
    return NextResponse.json({ error: "Şu an cevap veremiyorum. WhatsApp'tan yazarsanız hemen dönüş yapalım.", code: lastStatus }, { status: 502 });
  }
  const text: string =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("").trim() ||
    "Bunu uzmanımızın netleştirmesi daha doğru olur; uzmanımız size en kısa sürede dönüş yapacak.";

  // Kayıtlı sohbetse dökümü admin paneldeki kayda yaz.
  if (session && verifyChat(session.id, session.sig)) {
    await chatDb()?.from("leads").update({ notes: transcript([...all, { role: "assistant", text }]) }).eq("id", session.id).eq("source", "live_chat");
  }
  return NextResponse.json({ text });
}
