import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";

// TCMB günlük kurlarından USD döviz satış kuru (admin'de "TCMB kurunu getir").
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const res = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", { cache: "no-store" });
    const xml = await res.text();
    const block = xml.match(/<Currency[^>]*CurrencyCode="USD"[\s\S]*?<\/Currency>/)?.[0] ?? "";
    const selling = Number(block.match(/<ForexSelling>([\d.]+)<\/ForexSelling>/)?.[1]);
    const date = xml.match(/Tarih="([\d.]+)"/)?.[1] ?? null;
    if (!selling) return NextResponse.json({ error: "TCMB kuru okunamadı." }, { status: 502 });
    return NextResponse.json({ rate: selling, date });
  } catch {
    return NextResponse.json({ error: "TCMB'ye ulaşılamadı." }, { status: 502 });
  }
}
