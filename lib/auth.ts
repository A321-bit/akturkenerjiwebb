// Web Crypto API (crypto.subtle) kullanılıyor — hem Node.js hem Edge (middleware)
// runtime'ında çalışır. Node'un "crypto" modülü middleware içinde çalışmaz.

export const ADMIN_COOKIE_NAME = "admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 gün

const encoder = new TextEncoder();

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return bufToHex(sig);
}

export async function createSessionToken(): Promise<string> {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = String(expires);
  const sig = await hmacHex(process.env.ADMIN_SESSION_SECRET!, payload);
  return `${payload}.${sig}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = await hmacHex(process.env.ADMIN_SESSION_SECRET!, payload);
  if (expected.length !== sig.length || expected !== sig) return false;
  const expires = Number(payload);
  return Number.isFinite(expires) && Date.now() < expires;
}
