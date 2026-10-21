import { createHash } from "node:crypto";
import { adminClient } from "./data";
import { META_PAGE_ID, metaAccount } from "./social";

// Meta anlık form (Lead Ads) başvuruları → admin "Meta Formları". Formlar Meta'dan
// çekilip meta_leads tablosuna yazılır (yeni olanlar eklenir, personelin girdiği durum
// ve not korunur). Personel aradıktan sonra durum seçer; durum Meta Dönüşümler API'sine
// (CRM olayı, lead_id ile) gönderilir ki Meta "satışa dönen" kişilere benzeyenleri bulsun.

const GRAPH = "https://graph.facebook.com/v23.0";
/** Sitedeki Meta Pikseli / veri seti ("Aktürk Enerji Web"). */
export const META_DATASET_ID = "956247070771662";

export { LEAD_STATUSES, type LeadStatus, type MetaLead } from "./meta-lead-status";
import type { MetaLead } from "./meta-lead-status";

type Field = { name: string; values: string[] };
type ApiLead = {
  id: string;
  created_time: string;
  ad_id?: string;
  ad_name?: string;
  adset_name?: string;
  campaign_name?: string;
  form_id?: string;
  platform?: string;
  field_data?: Field[];
};

async function graph<T>(path: string, params: Record<string, string>): Promise<T> {
  const res = await fetch(`${GRAPH}/${path}?${new URLSearchParams(params)}`, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(`Meta: ${data.error?.message ?? res.status}`);
  return data as T;
}

const pick = (fields: Field[], ...names: string[]) => fields.find((f) => names.includes(f.name))?.values?.[0] ?? null;
const STANDARD = ["full_name", "first_name", "last_name", "phone_number", "email", "city"];

/** Sayfadaki bütün formların son 90 günlük başvurularını çeker; yenileri tabloya ekler. */
export async function syncMetaLeads(): Promise<{ forms: number; fetched: number }> {
  const { pageToken } = await metaAccount();
  const forms = await graph<{ data: { id: string; name: string }[] }>(`${META_PAGE_ID}/leadgen_forms`, {
    fields: "id,name",
    limit: "100",
    access_token: pageToken,
  });
  const since = Math.floor(Date.now() / 1000) - 90 * 86400;
  const rows = [];
  for (const form of forms.data) {
    let next: string | null = `${GRAPH}/${form.id}/leads?${new URLSearchParams({
      fields: "id,created_time,ad_id,ad_name,adset_name,campaign_name,form_id,platform,field_data",
      filtering: JSON.stringify([{ field: "time_created", operator: "GREATER_THAN", value: since }]),
      limit: "200",
      access_token: pageToken,
    })}`;
    for (let page = 0; next && page < 10; page++) {
      const res: Response = await fetch(next, { cache: "no-store" });
      const body = (await res.json()) as { data?: ApiLead[]; paging?: { next?: string }; error?: { message: string } };
      if (!res.ok || body.error) throw new Error(`Meta (${form.name}): ${body.error?.message ?? res.status}`);
      for (const l of body.data ?? []) {
        const f = l.field_data ?? [];
        const first = pick(f, "first_name");
        const last = pick(f, "last_name");
        rows.push({
          id: l.id,
          created_time: l.created_time,
          page_id: META_PAGE_ID,
          form_id: l.form_id ?? form.id,
          form_name: form.name,
          ad_id: l.ad_id ?? null,
          ad_name: l.ad_name ?? null,
          adset_name: l.adset_name ?? null,
          campaign_name: l.campaign_name ?? null,
          platform: l.platform ?? null,
          full_name: pick(f, "full_name") ?? ([first, last].filter(Boolean).join(" ") || null),
          phone: pick(f, "phone_number"),
          email: pick(f, "email"),
          city: pick(f, "city"),
          answers: f.filter((x) => !STANDARD.includes(x.name)).map((x) => ({ name: x.name, value: x.values.join(", ") })),
        });
      }
      next = body.paging?.next ?? null;
    }
  }
  if (rows.length) {
    // Var olan satırlara dokunulmaz (personelin durumu/notu korunur).
    const { error } = await adminClient().from("meta_leads").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
  }
  return { forms: forms.data.length, fetched: rows.length };
}

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
/** Türkiye numarası → ülke kodlu rakamlar (Meta eşleştirmesi için). */
function normPhone(p: string) {
  const d = p.replace(/\D/g, "");
  if (d.startsWith("90")) return d;
  if (d.startsWith("0")) return `90${d.slice(1)}`;
  return d.length === 10 ? `90${d}` : d;
}

/** Durumu Meta Dönüşümler API'sine CRM olayı olarak gönderir. */
export async function sendLeadStage(lead: Pick<MetaLead, "id" | "phone" | "email">, event: string) {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error("META_ACCESS_TOKEN ortam değişkeni tanımlı değil.");
  const user_data: Record<string, unknown> = { lead_id: lead.id };
  if (lead.phone) user_data.ph = [sha(normPhone(lead.phone))];
  if (lead.email) user_data.em = [sha(lead.email.trim().toLowerCase())];
  const body = {
    data: [
      {
        event_name: event,
        event_time: Math.floor(Date.now() / 1000),
        event_id: `${lead.id}_${event}`,
        action_source: "system_generated",
        user_data,
        custom_data: { event_source: "crm", lead_event_source: "Aktürk Enerji Panel" },
      },
    ],
  };
  const res = await fetch(`${GRAPH}/${META_DATASET_ID}/events?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(`Meta: ${data.error?.error_user_msg ?? data.error?.message ?? res.status}`);
  return data as { events_received: number };
}
