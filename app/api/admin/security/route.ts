import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import QRCode from "qrcode";
import { z } from "zod";
import { adminClient } from "@/lib/data";
import { ADMIN_COOKIE_NAME, sessionIdFromCookie } from "@/lib/auth";
import {
  confirmTotpSetup,
  disableTotp,
  getSecurity,
  notify,
  passwordProblem,
  revokeOtherSessions,
  revokeSession,
  setPassword,
  startTotpSetup,
  verifyPassword,
  verifySecondFactor,
} from "@/lib/admin-security";

// Admin → Güvenlik: iki adımlı doğrulama, şifre, oturumlar ve giriş geçmişi.
// Hassas işlemler (doğrulamayı kapatma, şifre değiştirme) mevcut şifre ve kod ister.

async function currentSessionId() {
  return sessionIdFromCookie((await cookies()).get(ADMIN_COOKIE_NAME)?.value);
}

export async function GET() {
  const db = adminClient();
  const [sec, sessions, attempts, current] = await Promise.all([
    getSecurity(),
    db.from("admin_sessions").select("id, created_at, expires_at, ip, user_agent").is("revoked_at", null).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }),
    db.from("admin_login_attempts").select("at, ip, success, reason").order("at", { ascending: false }).limit(40),
    currentSessionId(),
  ]);
  return NextResponse.json({
    totpEnabled: sec.totp_enabled,
    backupCodesLeft: sec.backup_codes.length,
    customPassword: Boolean(sec.password_hash),
    sessions: (sessions.data ?? []).map((s) => ({ ...s, current: s.id === current })),
    attempts: attempts.data ?? [],
  });
}

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("totp-start") }),
  z.object({ action: z.literal("totp-confirm"), code: z.string() }),
  z.object({ action: z.literal("totp-disable"), password: z.string(), code: z.string() }),
  z.object({ action: z.literal("password"), current: z.string(), code: z.string().optional(), next: z.string() }),
  z.object({ action: z.literal("revoke"), id: z.string().uuid() }),
  z.object({ action: z.literal("revoke-others") }),
]);

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  const b = parsed.data;

  if (b.action === "totp-start") {
    const sec = await getSecurity();
    if (sec.totp_enabled) return NextResponse.json({ error: "İki adımlı doğrulama zaten açık." }, { status: 400 });
    const url = await startTotpSetup();
    const qr = await QRCode.toDataURL(url, { margin: 1, width: 240 });
    const secret = new URL(url).searchParams.get("secret");
    return NextResponse.json({ qr, secret });
  }
  if (b.action === "totp-confirm") {
    const codes = await confirmTotpSetup(b.code.trim());
    if (!codes) return NextResponse.json({ error: "Kod doğrulanamadı. Telefondaki güncel kodu girin." }, { status: 400 });
    await notify("İki adımlı doğrulama açıldı", "Admin paneli için iki adımlı doğrulama etkinleştirildi.");
    return NextResponse.json({ ok: true, backupCodes: codes });
  }
  if (b.action === "totp-disable") {
    if (!(await verifyPassword(b.password)) || !(await verifySecondFactor(b.code))) {
      return NextResponse.json({ error: "Şifre ya da kod hatalı." }, { status: 401 });
    }
    await disableTotp();
    await notify("İki adımlı doğrulama KAPATILDI", "Admin paneli için iki adımlı doğrulama kapatıldı. Siz yapmadıysanız hemen şifreyi değiştirin.");
    return NextResponse.json({ ok: true });
  }
  if (b.action === "password") {
    const sec = await getSecurity();
    if (!(await verifyPassword(b.current)) || (sec.totp_enabled && !(await verifySecondFactor(b.code ?? "")))) {
      return NextResponse.json({ error: "Mevcut şifre ya da kod hatalı." }, { status: 401 });
    }
    const problem = passwordProblem(b.next);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    await setPassword(b.next);
    await revokeOtherSessions(await currentSessionId());
    await notify("Admin şifresi değiştirildi", "Admin şifresi değiştirildi; bu oturum dışındaki tüm oturumlar kapatıldı.");
    return NextResponse.json({ ok: true });
  }
  if (b.action === "revoke") {
    await revokeSession(b.id);
    return NextResponse.json({ ok: true });
  }
  await revokeOtherSessions(await currentSessionId());
  return NextResponse.json({ ok: true });
}
