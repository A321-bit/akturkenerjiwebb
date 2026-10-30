import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/auth";
import { adminClient } from "@/lib/data";
import { STAFF_UA_PREFIX, checkPassword, readCred } from "@/lib/staff";
import { clientIp, createSession, getSecurity, loginBlocked, notify, recordAttempt, verifyPassword, verifySecondFactor } from "@/lib/admin-security";

// Admin girişi: deneme sınırı → şifre → (açıksa) iki adımlı doğrulama kodu →
// sunucu tarafı oturum. Hatalı denemeler kaydedilir ve yavaşlatılır; hata
// mesajı şifrenin mi kodun mu yanlış olduğunu söylemez.
const slow = () => new Promise((r) => setTimeout(r, 700 + Math.random() * 500));

export async function POST(req: Request) {
  const ip = clientIp(req);
  const blocked = await loginBlocked(ip);
  if (blocked) return NextResponse.json({ error: blocked }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  const code = typeof body.code === "string" ? body.code : "";
  const cookie = (value: { cookie: string; maxAge: number }) => {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE_NAME, value.cookie, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: value.maxAge });
    return res;
  };

  // Personel: e-posta + şifre. E-posta boşsa sahip girişi aynen işler.
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email) {
    const { data: staff } = password && email.length < 200 ? await adminClient().from("staff").select("id, full_name, active").ilike("email", email).maybeSingle() : { data: null };
    const cred = staff?.active ? await readCred(staff.id) : null;
    if (!staff || !cred || password.length > 200 || !checkPassword(password, cred)) {
      await recordAttempt(ip, false, "personel");
      await slow();
      return NextResponse.json({ error: "E-posta ya da şifre hatalı." }, { status: 401 });
    }
    await recordAttempt(ip, true, `personel ${staff.id}`);
    const session = await createSession(ip, `${STAFF_UA_PREFIX}${staff.id}|${req.headers.get("user-agent") ?? ""}`);
    await notify("Personel girişi", `${staff.full_name} panele giriş yaptı. IP: ${ip}`);
    return cookie(session);
  }

  if (!password || password.length > 200 || !(await verifyPassword(password))) {
    await recordAttempt(ip, false, "şifre");
    await slow();
    return NextResponse.json({ error: "Şifre ya da doğrulama kodu hatalı." }, { status: 401 });
  }

  const sec = await getSecurity();
  if (sec.totp_enabled) {
    if (!code) return NextResponse.json({ needCode: true }, { status: 401 });
    if (!(await verifySecondFactor(code))) {
      await recordAttempt(ip, false, "kod");
      await slow();
      return NextResponse.json({ error: "Şifre ya da doğrulama kodu hatalı.", needCode: true }, { status: 401 });
    }
  }

  await recordAttempt(ip, true, sec.totp_enabled ? "şifre+kod" : "şifre");
  const userAgent = req.headers.get("user-agent") ?? "";
  const session = await createSession(ip, userAgent);
  await notify("Admin paneline giriş yapıldı", `IP: ${ip}<br>Tarayıcı: ${userAgent.slice(0, 160)}`);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, session.cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: session.maxAge,
  });
  return res;
}
