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
// Supabase "leads" tablosu için önerilen şema: bkz. supabase/schema.sql

type LeadInput = {
  needType?: string;
  billRange?: string;
  fullname?: string;
  phone?: string;
  email?: string;
  province?: string;
  source?: string;
  formPage?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  adClickId?: string;
};

export async function POST(req: Request) {
  let body: LeadInput;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const {
    needType,
    billRange,
    fullname,
    phone,
    email,
    province,
    source,
    formPage,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
    adClickId,
  } = body;

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
    formPage: formPage || null,
    utmSource: utmSource || null,
    utmMedium: utmMedium || null,
    utmCampaign: utmCampaign || null,
    utmContent: utmContent || null,
    utmTerm: utmTerm || null,
    adClickId: adClickId || null,
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

type LeadForStorage = {
  needType: string;
  billRange: string | null;
  fullname: string;
  phone: string;
  email: string | null;
  province?: string | null;
  source: string;
  formPage?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  adClickId?: string | null;
  receivedAt: string;
};

async function sendToSupabase(lead: LeadForStorage) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return; // yapılandırılmamış — sessizce atla

  const supabase = createClient(url, key);
  const record: Record<string, unknown> = {
    need_type: lead.needType,
    bill_range: lead.billRange,
    fullname: lead.fullname,
    phone: lead.phone,
    email: lead.email,
    source: lead.source,
  };
  if (lead.province) record.province = lead.province;
  if (lead.formPage) record.form_page = lead.formPage;
  if (lead.utmSource) record.utm_source = lead.utmSource;
  if (lead.utmMedium) record.utm_medium = lead.utmMedium;
  if (lead.utmCampaign) record.utm_campaign = lead.utmCampaign;
  if (lead.utmContent) record.utm_content = lead.utmContent;
  if (lead.utmTerm) record.utm_term = lead.utmTerm;
  if (lead.adClickId) record.ad_click_id = lead.adClickId;

  let { error } = await supabase.from("leads").insert(record);

  // "province"/"form_page"/"utm_*" kolonları henüz canlıya uygulanmamış
  // migration'a bağlıysa talep tamamen kaybolmasın diye, tanınmayan
  // alanları çıkarıp bir kez daha deniyoruz.
  if (error) {
    const optionalKeys = [
      "province",
      "form_page",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "ad_click_id",
    ];
    for (const k of optionalKeys) delete record[k];
    if (record.bill_range === null) record.bill_range = "Belirtilmedi";
    ({ error } = await supabase.from("leads").insert(record));
  }
  if (error) throw error;
}

async function sendToGoogleSheets(lead: LeadForStorage) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) return; // yapılandırılmamış — sessizce atla

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead),
  });
  if (!res.ok) throw new Error(`Google Sheets webhook ${res.status}`);
}
