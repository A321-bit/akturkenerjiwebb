import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Bu route iki entegrasyonu da destekler; ikisi de opsiyoneldir ve ilgili
// ortam değişkenleri (Vercel Project Settings > Environment Variables) tanımlı
// olduğunda otomatik devreye girer. Hiçbiri tanımlı değilse talep yalnızca
// sunucu loguna yazılır (Vercel dashboard > Logs).
//
//   SUPABASE_URL                 — proje URL'i
//   SUPABASE_SERVICE_ROLE_KEY    — "leads" tablosuna yazma izni olan servis anahtarı
//   GOOGLE_SHEETS_WEBHOOK_URL    — Google Apps Script Web App URL'i (POST kabul eden)
//   RESEND_API_KEY               — resend.com hesabından alınan API anahtarı (yeni talep e-postası için)
//   LEAD_NOTIFY_EMAIL            — bildirimin gideceği adres (varsayılan: info@akturkenerji.com.tr)
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

  const [supabaseResult, sheetsResult, emailResult] = await Promise.allSettled([
    sendToSupabase(lead),
    sendToGoogleSheets(lead),
    sendLeadNotificationEmail(lead),
  ]);

  if (supabaseResult.status === "rejected") {
    console.error("[LeadForm] Supabase kaydı başarısız:", supabaseResult.reason);
  }
  if (sheetsResult.status === "rejected") {
    console.error("[LeadForm] Google Sheets kaydı başarısız:", sheetsResult.reason);
  }
  if (emailResult.status === "rejected") {
    console.error("[LeadForm] Bildirim e-postası başarısız:", emailResult.reason);
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

async function sendLeadNotificationEmail(lead: LeadForStorage) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // yapılandırılmamış — sessizce atla

  const to = process.env.LEAD_NOTIFY_EMAIL || "info@akturkenerji.com.tr";
  const resend = new Resend(apiKey);

  const rows: [string, string][] = [
    ["Ad Soyad", lead.fullname],
    ["Telefon", lead.phone],
    ["E-posta", lead.email || "—"],
    ["İhtiyaç türü", lead.needType],
    ["Fatura aralığı", lead.billRange || "—"],
    ["İl", lead.province || "—"],
    ["Kaynak", lead.source],
    ["Form sayfası", lead.formPage || "—"],
    ["UTM kaynak", lead.utmSource || "—"],
    ["UTM kampanya", lead.utmCampaign || "—"],
  ];

  const html = `
    <meta charset="utf-8" />
    <div style="font-family:sans-serif;font-size:14px;line-height:1.6;color:#1c2430">
      <h2 style="margin:0 0 12px">Yeni teklif talebi</h2>
      <table style="border-collapse:collapse">
        ${rows
          .map(
            ([label, value]) => `
          <tr>
            <td style="padding:4px 12px 4px 0;color:#6b7280;white-space:nowrap">${label}</td>
            <td style="padding:4px 0;font-weight:600">${value}</td>
          </tr>`
          )
          .join("")}
      </table>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: "Aktürk Enerji Web <onboarding@resend.dev>",
    to,
    subject: `Yeni teklif talebi — ${lead.fullname} (${lead.needType})`,
    html,
  });
  if (error) throw error;
}
