import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { authUrl, createState } from "@/lib/gbp";

// "Google ile bağlan": imzalı durum değeri üretir ve Google izin ekranına yönlendirir.
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { state, nonce } = createState();
  const res = NextResponse.redirect(authUrl(state));
  // Google'dan dönüş siteler arası yönlendirme olduğu için bu çerez Lax olmalı.
  res.cookies.set("gbp_oauth_nonce", nonce, { httpOnly: true, secure: true, sameSite: "lax", path: "/api/admin/gbp", maxAge: 600 });
  return res;
}
