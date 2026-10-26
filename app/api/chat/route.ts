import { NextResponse } from "next/server";
import { getChatContext } from "@/lib/chat-context";
import { chatDb, transcript, verifyChat } from "@/lib/chat-session";

// Canlı destek: Gemini (Google AI Studio ücretsiz kota) ile cevap.
// Kişisel bilgi (ad/telefon) Gemini'ye gitmez; /api/chat/start ile açılan
// kayda burada yalnızca sohbet dökümü yazılır.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Msg = { role: "user" | "assistant"; text: string };

// İlk iki model aynı anda denenir (ayrı kotalar; hangisi önce cevaplarsa o). İkisi de
// yoğunsa (503) ya da yanıt vermezse anahtarın erişebildiği diğer flash modellere geçilir.
const PRIMARY = [...new Set([process.env.GEMINI_MODEL || "gemini-flash-latest", "gemini-flash-lite-latest"])];
const API = "https://generativelanguage.googleapis.com/v1beta/models";
type Reply = { candidates?: { content?: { parts?: { text?: string }[] } }[] };
let extra: { at: number; list: string[] } | null = null;

async function extraModels(key: string): Promise<string[]> {
  if (extra && Date.now() - extra.at < 3600e3) return extra.list;
  const r = await fetch(`${API}?pageSize=200`, { headers: { "x-goog-api-key": key }, signal: AbortSignal.timeout(5000) }).catch(() => null);
  const j = r?.ok ? await r.json() : { models: [] };
  const list = ((j.models || []) as { name: string; supportedGenerationMethods?: string[] }[])
    .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
    .map((m) => m.name.replace(/^models\//, ""))
    .filter((n) => n.includes("flash") && !/image|tts|audio|live|embed|robotics|computer|exp/.test(n) && !PRIMARY.includes(n))
    .slice(0, 3);
  extra = { at: Date.now(), list };
  return list;
}

async function generate(key: string, model: string, body: object, ms: number, tried: string[]): Promise<Reply> {
  // Önce düşünme sınırlı denenir; model bu ayarı kabul etmezse (400) ayarsız tekrar denenir.
  for (const thinking of [true, false]) {
    const cfg = { temperature: 0.4, maxOutputTokens: 2048, ...(thinking ? { thinkingConfig: { thinkingBudget: 512 } } : {}) };
    const res = await fetch(`${API}/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ ...body, generationConfig: cfg }),
      signal: AbortSignal.timeout(ms),
    }).catch(() => null);
    tried.push(`${model}${thinking ? "" : "/nt"}:${res?.status ?? 0}`);
    if (res?.ok) return res.json();
    console.error("[canlı destek] Gemini hatası", model, res?.status ?? "zaman aşımı", res && (await res.text()).slice(0, 300));
    if (res?.status !== 400) break;
  }
  throw new Error(model);
}

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
  const body = { systemInstruction: { parts: [{ text: system }] }, contents };
  const tried: string[] = [];
  const started = Date.now();
  let data: Reply | null = await Promise.any(PRIMARY.map((m) => generate(key, m, body, 25000, tried))).catch(() => null);
  for (const model of data ? [] : await extraModels(key)) {
    const left = 55000 - (Date.now() - started);
    if (left < 6000) break;
    data = await generate(key, model, body, Math.min(15000, left), tried).catch(() => null);
    if (data) break;
  }

  if (!data) {
    return NextResponse.json({ error: "Şu an cevap veremiyorum. WhatsApp'tan yazarsanız hemen dönüş yapalım.", code: tried.join(" ") }, { status: 502 });
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
