import { createHmac, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "./supabase";

// Admin oturumu: çerezde "<oturum-id>.<imza>" durur. İmza (HMAC-SHA256,
// ADMIN_SESSION_SECRET) çerezin değiştirilmediğini, veritabanındaki kayıt
// (admin_sessions) oturumun hâlâ geçerli olduğunu gösterir: çıkışta ya da
// "tüm oturumları kapat"ta kayıt iptal edilir ve çerez çalınmış olsa bile
// işe yaramaz. Proxy Node.js runtime'ında çalışır (Next 16).

export const ADMIN_COOKIE_NAME = "admin_session";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 gün

const sign = (id: string) => createHmac("sha256", process.env.ADMIN_SESSION_SECRET!).update(`session:${id}`).digest("hex");

export function sessionCookieValue(id: string): string {
  return `${id}.${sign(id)}`;
}

/** Çerezdeki imzayı (sabit sürede) doğrular ve oturum kimliğini döner. */
export function sessionIdFromCookie(token: string | undefined | null): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^[0-9a-f-]{36}$/.test(id) || !/^[0-9a-f]{64}$/.test(sig)) return null;
  const expected = Buffer.from(sign(id), "hex");
  const given = Buffer.from(sig, "hex");
  return expected.length === given.length && timingSafeEqual(expected, given) ? id : null;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  const id = sessionIdFromCookie(token);
  if (!id) return false;
  const { data } = await supabaseAdmin().from("admin_sessions").select("expires_at, revoked_at").eq("id", id).maybeSingle();
  return Boolean(data && !data.revoked_at && new Date(data.expires_at).getTime() > Date.now());
}
