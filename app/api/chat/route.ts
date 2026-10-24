import { NextResponse } from "next/server";
import { getChatContext } from "@/lib/chat-context";

// Canlı destek: Gemini (Google AI Studio ücretsiz kota) ile cevap.
// Kişisel bilgi (ad/telefon) buraya gelmez; o, sohbet penceresindeki formdan
// doğrudan /api/lead'e gider.
export const dynamic = "force-dynamic";

type Msg = { role: "user" | "assistant"; text: string };

const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
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

  let messages: Msg[];
  try {
    messages = ((await req.json()).messages as Msg[])
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.text === "string")
      .slice(-12)
      .map((m) => ({ role: m.role, text: m.text.slice(0, 1500) }));
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: await getChatContext() }] },
      contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.text }] })),
      generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
    }),
  }).catch(() => null);

  if (!res?.ok) {
    console.error("[canlı destek] Gemini hatası", res?.status, res && (await res.text()).slice(0, 300));
    return NextResponse.json({ error: "Şu an cevap veremiyorum. WhatsApp'tan yazarsanız hemen dönüş yapalım." }, { status: 502 });
  }
  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("").trim() || "";
  return NextResponse.json({ text: text || "Bunu uzmanımızın netleştirmesi daha doğru olur; \"Sizi arayalım\" formuna adınızı ve telefonunuzu yazarsanız hemen dönüş yapalım." });
}
