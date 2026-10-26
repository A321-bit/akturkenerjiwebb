import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Canlı destek sohbeti, müşteri adını/telefonunu yazınca "leads" tablosunda
// source = live_chat kaydı olur (admin → Talepler → Canlı Destek sekmesi).
// Tarayıcıya kayıt id'si ve imzası verilir; sonraki mesajlarda sohbet dökümü
// yalnızca imza doğruysa o kayda yazılır.
const secret = () => process.env.ADMIN_SESSION_SECRET || "";

export function signChat(id: number): string {
  return createHmac("sha256", secret()).update(`chat:${id}`).digest("hex");
}

export function verifyChat(id: unknown, sig: unknown): id is number {
  if (typeof id !== "number" || typeof sig !== "string" || !secret()) return false;
  const a = Buffer.from(signChat(id));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function chatDb() {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key) : null;
}

export type ChatMsg = { role: "user" | "assistant"; text: string };

export function transcript(messages: ChatMsg[]): string {
  const body = messages
    .slice(-40)
    .map((m) => `${m.role === "user" ? "Müşteri" : "Asistan"}: ${m.text}`)
    .join("\n\n");
  return `Canlı destek sohbeti:\n\n${body}`.slice(0, 12000);
}
