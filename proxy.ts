import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, sessionUser } from "@/lib/auth";
import { STAFF_HOME, staffCanOpen } from "@/lib/staff";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Google izin dönüşü: Strict admin çerezi bu istekte gelmez; rota imzalı durum değeriyle doğrular.
  if (pathname === "/admin/login" || pathname === "/api/admin/login" || pathname === "/api/admin/gbp/callback") {
    return NextResponse.next();
  }

  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const user = await sessionUser(token);
  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  // Personel yalnız izin verilen sayfa ve API'lere girer; sahip hesabı sınırsızdır.
  if (user.kind === "staff" && !staffCanOpen(pathname, user.perms)) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
    const url = req.nextUrl.clone();
    url.pathname = STAFF_HOME;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
