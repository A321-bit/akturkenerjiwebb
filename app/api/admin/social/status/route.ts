import { NextResponse } from "next/server";
import { metaAccount } from "@/lib/social";

// Meta bağlantısı: sayfa adı ve bağlı Instagram hesabı (anahtarın kendisi dönmez).
export async function GET() {
  try {
    const m = await metaAccount();
    return NextResponse.json({ ok: true, page: m.pageName, instagram: m.igUsername });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
}
