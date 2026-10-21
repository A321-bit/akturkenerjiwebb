import { AD_ACCOUNT } from "./meta-ads";
import { META_DATASET_ID } from "./meta-leads";
import { META_PAGE_ID, metaAccount } from "./social";

// Meta reklam kurulumu (Marketing API, ads_management): yeniden pazarlama kitleleri ve
// anlık form (lead) kampanyaları. Her şey DURDURULMUŞ kurulur; yayına almak admin panelinden.

const GRAPH = "https://graph.facebook.com/v23.0";

async function call<T>(method: "GET" | "POST", path: string, params: Record<string, unknown> = {}): Promise<T> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error("META_ACCESS_TOKEN ortam değişkeni tanımlı değil.");
  const flat = Object.fromEntries(Object.entries({ ...params, access_token: token }).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)]));
  const res =
    method === "GET"
      ? await fetch(`${GRAPH}/${path}?${new URLSearchParams(flat)}`, { cache: "no-store" })
      : await fetch(`${GRAPH}/${path}`, { method: "POST", body: new URLSearchParams(flat), cache: "no-store" });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(`Meta: ${data.error?.error_user_msg ?? data.error?.message ?? res.status}`);
  return data as T;
}

/** Hedefleme araması: konum (mahalle/ilçe/il) ya da ilgi alanı. */
export async function searchTargeting(kind: "konum" | "ilgi", q: string) {
  if (kind === "konum") {
    const r = await call<{ data: { key: string; name: string; type: string; region?: string; primary_city?: string }[] }>("GET", "search", {
      type: "adgeolocation",
      q,
      location_types: ["neighborhood", "subcity", "city", "region"],
      country_code: "TR",
      limit: "10",
    });
    return r.data.map((x) => ({ key: x.key, name: x.name, type: x.type, where: [x.primary_city, x.region].filter(Boolean).join(", ") }));
  }
  const r = await call<{ data: { id: string; name: string; audience_size_upper_bound?: number; path?: string[] }[] }>("GET", "search", { type: "adinterest", q, limit: "10" });
  return r.data.map((x) => ({ key: x.id, name: x.name, type: (x.path ?? []).join(" › "), where: String(x.audience_size_upper_bound ?? "") }));
}

// ───────────────────────── Kitleler ─────────────────────────

const DAY = 86400;
export const AUDIENCES = {
  site: "AKT · Site ziyaretçileri 180 gün",
  instagram: "AKT · Instagram etkileşim 365 gün",
  page: "AKT · Facebook sayfa etkileşim 365 gün",
  formOpened: "AKT · Formu açanlar 90 gün",
  formSubmitted: "AKT · Formu gönderenler 90 gün",
} as const;

/** Yeniden pazarlama kitlelerini (yoksa) oluşturur; ad → kimlik döner. Para harcamaz. */
export async function ensureAudiences(): Promise<Record<keyof typeof AUDIENCES, string>> {
  const existing = await call<{ data: { id: string; name: string }[] }>("GET", `${AD_ACCOUNT}/customaudiences`, { fields: "id,name", limit: "200" });
  const byName = new Map(existing.data.map((a) => [a.name, a.id]));
  const { igId } = await metaAccount();
  const engagement = (sourceType: string, sourceId: string, event: string, days: number) => ({
    inclusions: { operator: "or", rules: [{ event_sources: [{ type: sourceType, id: sourceId }], retention_seconds: days * DAY, filter: { operator: "and", filters: [{ field: "event", operator: "eq", value: event }] } }] },
  });
  const specs: Record<keyof typeof AUDIENCES, Record<string, unknown> | null> = {
    site: {
      rule: { inclusions: { operator: "or", rules: [{ event_sources: [{ type: "pixel", id: META_DATASET_ID }], retention_seconds: 180 * DAY, filter: { operator: "and", filters: [{ field: "url", operator: "i_contains", value: "akturkenerji.com" }] } }] } },
    },
    instagram: igId ? { rule: engagement("ig_business", igId, "ig_business_profile_all", 365) } : null,
    page: { rule: engagement("page", META_PAGE_ID, "page_engaged", 365) },
    formOpened: { rule: engagement("lead", META_PAGE_ID, "lead_generation_opened", 90) },
    formSubmitted: { rule: engagement("lead", META_PAGE_ID, "lead_generation_submitted", 90) },
  };
  const out = {} as Record<keyof typeof AUDIENCES, string>;
  for (const key of Object.keys(AUDIENCES) as (keyof typeof AUDIENCES)[]) {
    const name = AUDIENCES[key];
    const spec = specs[key];
    if (byName.has(name)) out[key] = byName.get(name)!;
    else if (spec) out[key] = (await call<{ id: string }>("POST", `${AD_ACCOUNT}/customaudiences`, { name, ...spec, prefill: true })).id;
    // (Meta v23: kitle türü "subtype" parametresi kaldırıldı; tür kuraldaki olay kaynağından anlaşılıyor.)
  }
  return out;
}

// ───────────────────────── Kampanya ─────────────────────────

export type LeadAd = { name: string; image: string; message: string; headline: string; description: string };
export type LeadCampaignSpec = {
  name: string;
  dailyBudget: number;
  formId: string;
  adSetName: string;
  targeting: Record<string, unknown>;
  ads: LeadAd[];
};

async function imageHash(url: string): Promise<string> {
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  const r = await call<{ images: Record<string, { hash: string }> }>("POST", `${AD_ACCOUNT}/adimages`, { bytes: buf.toString("base64") });
  return Object.values(r.images)[0].hash;
}

/** Anlık form kampanyası: kampanya + reklam seti + kreatifler + reklamlar, hepsi DURDURULMUŞ. */
export async function createLeadCampaign(spec: LeadCampaignSpec) {
  const { igId } = await metaAccount();
  const campaign = await call<{ id: string }>("POST", `${AD_ACCOUNT}/campaigns`, {
    name: spec.name,
    objective: "OUTCOME_LEADS",
    status: "PAUSED",
    special_ad_categories: [],
    is_adset_budget_sharing_enabled: false,
  });
  const adset = await call<{ id: string }>("POST", `${AD_ACCOUNT}/adsets`, {
    name: spec.adSetName,
    campaign_id: campaign.id,
    status: "PAUSED",
    daily_budget: String(Math.round(spec.dailyBudget * 100)),
    billing_event: "IMPRESSIONS",
    optimization_goal: "LEAD_GENERATION",
    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    destination_type: "ON_AD",
    promoted_object: { page_id: META_PAGE_ID },
    targeting: spec.targeting,
  });
  const ads = [];
  for (const a of spec.ads) {
    const hash = await imageHash(a.image);
    const creative = await call<{ id: string }>("POST", `${AD_ACCOUNT}/adcreatives`, {
      name: `${spec.name} · ${a.name}`,
      object_story_spec: {
        page_id: META_PAGE_ID,
        ...(igId ? { instagram_user_id: igId } : {}),
        link_data: {
          image_hash: hash,
          link: "https://akturkenerji.com/",
          message: a.message,
          name: a.headline,
          description: a.description,
          call_to_action: { type: "GET_QUOTE", value: { lead_gen_form_id: spec.formId } },
        },
      },
    });
    const ad = await call<{ id: string }>("POST", `${AD_ACCOUNT}/ads`, { name: a.name, adset_id: adset.id, creative: { creative_id: creative.id }, status: "PAUSED" });
    ads.push(ad.id);
  }
  return { campaignId: campaign.id, adSetId: adset.id, adIds: ads };
}

/** Kampanyayı açar/durdurur (kampanya, reklam setleri ve reklamlar birlikte). */
export async function setMetaCampaignStatus(campaignId: string, status: "ACTIVE" | "PAUSED") {
  if (!/^\d+$/.test(campaignId)) throw new Error("Geçersiz kampanya.");
  const [adsets, ads] = await Promise.all([
    call<{ data: { id: string }[] }>("GET", `${campaignId}/adsets`, { fields: "id", limit: "100" }),
    call<{ data: { id: string }[] }>("GET", `${campaignId}/ads`, { fields: "id", limit: "200" }),
  ]);
  for (const x of [...ads.data, ...adsets.data]) await call("POST", x.id, { status });
  await call("POST", campaignId, { status });
}

/** Reklam setinin günlük bütçesi (TL). */
export async function setMetaAdSetBudget(adSetId: string, amountTl: number) {
  if (!/^\d+$/.test(adSetId)) throw new Error("Geçersiz reklam seti.");
  if (!(amountTl >= 20 && amountTl <= 5000)) throw new Error("Günlük bütçe 20–5.000 TL arasında olmalı.");
  await call("POST", adSetId, { daily_budget: String(Math.round(amountTl * 100)) });
}
