import { NextResponse } from "next/server";
import { currentUser } from "@/lib/admin-guard";
import { permsOf } from "@/lib/staff";

// Paneli açan kullanıcı: menü ve ekranlar buna göre daraltılır. Asıl denetim sunucu tarafındadır.
export async function GET() {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  return NextResponse.json({ kind: u.kind, id: u.kind === "staff" ? u.id : null, name: u.kind === "staff" ? u.name : null, perms: permsOf(u) });
}
