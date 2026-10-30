import { NextResponse } from "next/server";
import { currentUser } from "@/lib/admin-guard";
import { adminClient } from "@/lib/data";
import { NO_PERMS, hashPassword, readCred, removeCred, writeCred, type StaffPerms } from "@/lib/staff";

// Personel giriş ve yetkileri: yalnız sahip hesabı yönetir (personel bu adrese hiç ulaşamaz).

const ownerOnly = async () => {
  const u = await currentUser();
  return u?.kind === "owner" ? null : NextResponse.json({ error: "Bu işlem yalnız sahip hesabıyla yapılır." }, { status: 403 });
};

export async function GET() {
  const denied = await ownerOnly();
  if (denied) return denied;
  const { data, error } = await adminClient().from("staff").select("id, full_name, title, email, phone, active").order("full_name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = await Promise.all((data ?? []).map(async (s) => {
    const cred = await readCred(s.id);
    return { ...s, hasLogin: Boolean(cred), perms: cred?.perms ?? NO_PERMS };
  }));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const denied = await ownerOnly();
  if (denied) return denied;
  const b = await req.json().catch(() => null);
  const id = Number(b?.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Geçersiz personel." }, { status: 400 });
  const db = adminClient();

  if (typeof b.email === "string") {
    const email = b.email.trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "E-posta adresi hatalı." }, { status: 400 });
    if (email) {
      const { data: same } = await db.from("staff").select("id").ilike("email", email).neq("id", id).limit(1);
      if (same?.length) return NextResponse.json({ error: "Bu e-posta başka bir personelde kayıtlı." }, { status: 409 });
    }
    await db.from("staff").update({ email: email || null }).eq("id", id);
  }
  if (typeof b.active === "boolean") await db.from("staff").update({ active: b.active }).eq("id", id);

  const cred = await readCred(id);
  const perms: StaffPerms = { ...(cred?.perms ?? NO_PERMS), ...(b.perms && typeof b.perms === "object" ? b.perms : {}) };
  // Fiyat kuralları maliyet içerir; maliyet yetkisi olmadan verilmez.
  if (!perms.cost) perms.rules = false;
  if (typeof b.password === "string" && b.password) {
    if (b.password.length < 10) return NextResponse.json({ error: "Şifre en az 10 karakter olmalı." }, { status: 400 });
    await writeCred(id, { ...hashPassword(b.password), perms });
  } else if (cred) {
    await writeCred(id, { hash: cred.hash, salt: cred.salt, perms });
  }
  if (b.removeLogin === true) await removeCred(id);
  return NextResponse.json({ ok: true });
}
