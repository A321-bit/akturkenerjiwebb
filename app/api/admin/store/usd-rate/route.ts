import { NextResponse } from "next/server";

// TCMB günlük kurlarından USD döviz satış kuru (admin'de "TCMB kurunu getir").
export async function GET() {
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
