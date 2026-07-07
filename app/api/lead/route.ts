import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Bu route iki entegrasyonu da destekler; ikisi de opsiyoneldir ve ilgili
// ortam değişkenleri (Vercel Project Settings > Environment Variables) tanımlı
// olduğunda otomatik devreye girer. Hiçbiri tanımlı değilse talep yalnızca
// sunucu loguna yazılır (Vercel dashboard > Logs).
//
//   SUPABASE_URL                 — proje URL'i
//   SUPABASE_SERVICE_ROLE_KEY    — "leads" tablosuna yazma izni olan servis anahtarı
//   GOOGLE_SHEETS_WEBHOOK_URL    — Google Apps Script Web App URL'i (POST kabul eden)
//
// Supabase "leads" tablosu için önerilen şema:
//   create table leads (
//     id bigint generated always as identity primary key,
//     need_type text not null,
//     bill_range text not null,
//     fullname text not null,
//     phone text not null,
//     email text,
//     source text default 'website',
//     created_at timestamptz default now()
//   );

export async function POST(req: Request) {
  let body: {
    needType?: string;
    billRange?: string;
    fullname?: string;
    phone?: string;
    email?: string;
    province?: string;
    source?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const { needType, billRange, fullname, phone, email, province, source } = body;

  if (!needType || !fullname || !phone) {
    return NextResponse.json({ error: "Zorunlu alanlar eksik." }, { status: 400 });
  }

  const lead = {
    needType,
    billRange: billRange || null,
    fullname,
    phone,
    email: email || null,
    province: province || null,
    source: source || "website",
    receivedAt: new Date().toISOString(),
  };

  console.log("[Yeni Teklif Talebi - LeadForm]", lead);

  const results = await Promise.allSettled([sendToSupabase(lead), sendToGoogleSheets(lead)]);

  const supabaseResult = results[0];
  const sheetsResult = results[1];
  if (supabaseResult.status === "rejected") {
    console.error("[LeadForm] Supabase kaydı başarısız:", supabaseResult.reason);
  }
  if (sheetsResult.status === "rejected") {
    console.error("[LeadForm] Google Sheets kaydı başarısız:", sheetsResult.reason);
  }

  return NextResponse.json({ ok: true });
}

async function sendToSupabase(lead: {
  needType: string;
  billRange: string | null;
  fullname: string;
  phone: string;
  email: string | null;
  province?: string | null;
  source: string;
  receivedAt: string;
}) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return; // yapılandırılmamış — sessizce atla

  const supabase = createClient(url, key);
  const { error } = await supabase.from("leads").insert({
    need_type: lead.needType,
    bill_range: lead.billRange,
    fullname: lead.fullname,
    phone: lead.phone,
    email: lead.email,
    province: lead.province ?? null,
    source: lead.source,
  });
  if (error) throw error;
}

async function sendToGoogleSheets(lead: {
  needType: string;
  billRange: string | null;
  fullname: string;
  phone: string;
  email: string | null;
  province?: string | null;
  source: string;
  receivedAt: string;
}) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) return; // yapılandırılmamış — sessizce atla

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead),
  });
  if (!res.ok) throw new Error(`Google Sheets webhook ${res.status}`);
}
