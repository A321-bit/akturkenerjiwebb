import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, sessionUser, verifySessionToken } from "@/lib/auth";

/** Proxy'ye ek ikinci kontrol: proxy atlatılsa bile admin API'leri geçerli oturum ister. */
export async function requireAdmin(): Promise<NextResponse | null> {
  const token = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  return (await verifySessionToken(token)) ? null : NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
}

/** Paneli kullanan kişi (sahip ya da personel). */
export async function currentUser() {
  return sessionUser((await cookies()).get(ADMIN_COOKIE_NAME)?.value);
}
