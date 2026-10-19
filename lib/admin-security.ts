import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { adminClient } from "./data";
import { SESSION_TTL_MS, sessionCookieValue } from "./auth";

// Admin girişi güvenliği:
//  - Kaba kuvvet koruması: aynı IP 30 dakikada 5 hatalı denemede engellenir;
//    tüm IP'lerden 1 saatte 30 hatalı deneme olursa giriş 1 saat kilitlenir.
//  - İki adımlı doğrulama (TOTP, RFC 6238; Google/Microsoft Authenticator) ve
//    tek kullanımlık yedek kodlar. Gizli anahtar veritabanında AES-256-GCM ile şifreli.
//  - Şifre panelden değiştirilebilir (bcrypt 12); değiştirilmediyse ortam
//    değişkenindeki (ADMIN_PASSWORD_HASH_B64) şifre geçerlidir.
//  - Başarılı girişte ve kilitlenmede e-posta bildirimi.

const IP_WINDOW_MS = 30 * 60 * 1000;
const IP_MAX_FAILURES = 5;
const GLOBAL_WINDOW_MS = 60 * 60 * 1000;
const GLOBAL_MAX_FAILURES = 30;

export type Security = {
  password_hash: string | null;
  totp_secret: string | null;
  totp_pending: string | null;
  totp_enabled: boolean;
  backup_codes: string[];
};

export async function getSecurity(): Promise<Security> {
  const { data } = await adminClient().from("admin_security").select("*").eq("id", 1).single();
  return (data ?? { password_hash: null, totp_secret: null, totp_pending: null, totp_enabled: false, backup_codes: [] }) as Security;
}

export async function updateSecurity(patch: Partial<Security>) {
  const { error } = await adminClient()
    .from("admin_security")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error(error.message);
}

// ───────────── İstek bilgisi ─────────────

export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "bilinmiyor";
}

// ───────────── Kaba kuvvet koruması ─────────────

export async function loginBlocked(ip: string): Promise<string | null> {
  const db = adminClient();
  const now = Date.now();
  const [byIp, all] = await Promise.all([
    db
      .from("admin_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .eq("success", false)
      .gte("at", new Date(now - IP_WINDOW_MS).toISOString()),
    db
      .from("admin_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("success", false)
      .gte("at", new Date(now - GLOBAL_WINDOW_MS).toISOString()),
  ]);
  if ((all.count ?? 0) >= GLOBAL_MAX_FAILURES) return "Çok sayıda hatalı deneme nedeniyle giriş geçici olarak kilitlendi. 1 saat sonra tekrar deneyin.";
  if ((byIp.count ?? 0) >= IP_MAX_FAILURES) return "Çok fazla hatalı deneme. 30 dakika sonra tekrar deneyin.";
  return null;
}

export async function recordAttempt(ip: string, success: boolean, reason: string) {
  await adminClient().from("admin_login_attempts").insert({ ip, success, reason });
  if (!success) {
    // Eşik ilk aşıldığında e-posta (sonraki denemelerde tekrar gönderilmez).
    const db = adminClient();
    const [byIp, all] = await Promise.all([
      db.from("admin_login_attempts").select("id", { count: "exact", head: true }).eq("ip", ip).eq("success", false).gte("at", new Date(Date.now() - IP_WINDOW_MS).toISOString()),
      db.from("admin_login_attempts").select("id", { count: "exact", head: true }).eq("success", false).gte("at", new Date(Date.now() - GLOBAL_WINDOW_MS).toISOString()),
    ]);
    if (all.count === GLOBAL_MAX_FAILURES) await notify("Admin girişi kilitlendi", `Son 1 saatte ${GLOBAL_MAX_FAILURES} hatalı giriş denemesi oldu; giriş 1 saatliğine kilitlendi. Son deneyen IP: ${ip}`);
    else if (byIp.count === IP_MAX_FAILURES) await notify("Admin girişinde şüpheli deneme", `${ip} adresinden 30 dakikada ${IP_MAX_FAILURES} hatalı giriş denemesi; bu IP 30 dakika engellendi.`);
  }
}

// ───────────── Şifre ─────────────

export async function verifyPassword(password: string): Promise<boolean> {
  const sec = await getSecurity();
  let hash = sec.password_hash;
  if (!hash) {
    const encoded = process.env.ADMIN_PASSWORD_HASH_B64;
    if (!encoded) return false;
    hash = Buffer.from(encoded, "base64").toString("utf-8");
  }
  return bcrypt.compare(password, hash);
}

const WEAK = ["123456", "password", "sifre", "şifre", "akturk", "aktürk", "admin", "qwerty", "enerji", "111111"];

export function passwordProblem(pw: string): string | null {
  if (pw.length < 12) return "Şifre en az 12 karakter olmalı.";
  const kinds = [/[a-zçğıöşü]/, /[A-ZÇĞİÖŞÜ]/, /[0-9]/, /[^A-Za-z0-9çğıöşüÇĞİÖŞÜ]/].filter((r) => r.test(pw)).length;
  if (kinds < 3) return "Şifrede küçük harf, büyük harf, rakam ve sembolden en az üçü olmalı.";
  if (WEAK.some((w) => pw.toLocaleLowerCase("tr").includes(w))) return "Şifre tahmin edilebilir kelimeler içeriyor (ör. akturk, admin, 123456).";
  return null;
}

export async function setPassword(pw: string) {
  await updateSecurity({ password_hash: await bcrypt.hash(pw, 12) });
}

// ───────────── Gizli anahtar şifreleme ─────────────

const encKey = () => createHash("sha256").update(`totp:${process.env.ADMIN_SESSION_SECRET}`).digest();

function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", encKey(), iv);
  const data = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
}

function decrypt(box: string): string {
  const [iv, tag, data] = box.split(".").map((s) => Buffer.from(s, "base64"));
  const d = createDecipheriv("aes-256-gcm", encKey(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]).toString("utf8");
}

// ───────────── TOTP (RFC 6238) ─────────────

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(s: string): Buffer {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of s.replace(/=+$/, "").toUpperCase()) {
    const idx = B32.indexOf(ch);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function totpAt(secret: string, counter: number): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = createHmac("sha1", base32Decode(secret)).update(msg).digest();
  const off = h[h.length - 1] & 15;
  const code = ((h.readUInt32BE(off) & 0x7fffffff) % 1_000_000).toString().padStart(6, "0");
  return code;
}

function totpValid(secret: string, code: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const counter = Math.floor(Date.now() / 30000);
  // Saat kayması için ±1 adım (±30 sn) tolerans.
  return [-1, 0, 1].some((d) => {
    const a = Buffer.from(totpAt(secret, counter + d));
    const b = Buffer.from(code);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

/** Kurulum: yeni gizli anahtar üretir (doğrulanana kadar beklemede) ve authenticator bağlantısını döner. */
export async function startTotpSetup(): Promise<string> {
  const secret = base32Encode(randomBytes(20));
  await updateSecurity({ totp_pending: encrypt(secret) });
  const label = encodeURIComponent("Aktürk Enerji Admin");
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent("Aktürk Enerji")}&algorithm=SHA1&digits=6&period=30`;
}

const hashCode = (code: string) => createHash("sha256").update(`backup:${code.replace(/\s|-/g, "").toUpperCase()}`).digest("hex");

/** Kurulum onayı: kod doğruysa iki adımlı doğrulama açılır, 10 yedek kod döner (bir kez gösterilir). */
export async function confirmTotpSetup(code: string): Promise<string[] | null> {
  const sec = await getSecurity();
  if (!sec.totp_pending) return null;
  const secret = decrypt(sec.totp_pending);
  if (!totpValid(secret, code)) return null;
  const backups = Array.from({ length: 10 }, () => {
    const raw = base32Encode(randomBytes(5)).slice(0, 8);
    return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  });
  await updateSecurity({ totp_secret: encrypt(secret), totp_pending: null, totp_enabled: true, backup_codes: backups.map(hashCode) });
  return backups;
}

/** Girişte ikinci adım: authenticator kodu ya da (tek kullanımlık) yedek kod. */
export async function verifySecondFactor(code: string): Promise<boolean> {
  const sec = await getSecurity();
  if (!sec.totp_enabled || !sec.totp_secret) return true;
  const clean = code.trim();
  if (totpValid(decrypt(sec.totp_secret), clean)) return true;
  const h = hashCode(clean);
  if (sec.backup_codes.includes(h)) {
    await updateSecurity({ backup_codes: sec.backup_codes.filter((x) => x !== h) });
    await notify("Admin yedek kodu kullanıldı", `Bir yedek kod kullanıldı; ${sec.backup_codes.length - 1} yedek kod kaldı.`);
    return true;
  }
  return false;
}

export async function disableTotp() {
  await updateSecurity({ totp_secret: null, totp_pending: null, totp_enabled: false, backup_codes: [] });
}

// ───────────── Oturumlar ─────────────

export async function createSession(ip: string, userAgent: string): Promise<{ cookie: string; maxAge: number }> {
  const { data, error } = await adminClient()
    .from("admin_sessions")
    .insert({ expires_at: new Date(Date.now() + SESSION_TTL_MS).toISOString(), ip, user_agent: userAgent.slice(0, 300) })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Oturum açılamadı.");
  return { cookie: sessionCookieValue(data.id), maxAge: Math.floor(SESSION_TTL_MS / 1000) };
}

export async function revokeSession(id: string) {
  await adminClient().from("admin_sessions").update({ revoked_at: new Date().toISOString() }).eq("id", id).is("revoked_at", null);
}

export async function revokeOtherSessions(keepId: string | null) {
  let q = adminClient().from("admin_sessions").update({ revoked_at: new Date().toISOString() }).is("revoked_at", null);
  if (keepId) q = q.neq("id", keepId);
  await q;
}

// ───────────── Bildirim ─────────────

export async function notify(subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  try {
    await new Resend(apiKey).emails.send({
      from: "Aktürk Enerji Güvenlik <onboarding@resend.dev>",
      to: process.env.LEAD_NOTIFY_EMAIL || "info@akturkenerji.com.tr",
      subject: `[Güvenlik] ${subject}`,
      html: `<div style="font-family:sans-serif;font-size:14px;line-height:1.6;color:#1c2430"><p>${text}</p><p style="color:#6b7280">Zaman: ${new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}</p><p style="color:#6b7280">Siz değilseniz admin → Güvenlik ekranından tüm oturumları kapatın ve şifreyi değiştirin.</p></div>`,
    });
  } catch {
    // Bildirim gönderilemese de giriş akışı bozulmaz.
  }
}
