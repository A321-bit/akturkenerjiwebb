import { NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/admin-password";
import { createSessionToken, ADMIN_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  const { password } = await req.json();
  if (typeof password !== "string" || !verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Şifre hatalı." }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
