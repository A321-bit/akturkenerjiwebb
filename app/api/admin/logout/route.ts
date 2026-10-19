import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, sessionIdFromCookie } from "@/lib/auth";
import { revokeSession } from "@/lib/admin-security";

// Çıkış: oturum veritabanında iptal edilir (çerez kopyalanmış olsa bile geçersizleşir).
export async function POST() {
  const id = sessionIdFromCookie((await cookies()).get(ADMIN_COOKIE_NAME)?.value);
  if (id) await revokeSession(id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
