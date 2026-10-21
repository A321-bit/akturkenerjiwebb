import { ADS_CUSTOMER, adsBatch, adsMutate, adsQuery } from "./google-ads";

// Admin "Google Ads" sayfası: anahtar kelime, arama terimi, negatif, reklam ve uzantı
// listeleri; anahtar kelime/negatif ekleme-çıkarma, durdurma. Hepsi hesap 334-276-8968.

const micros = (v?: string | number) => Number(v ?? 0) / 1e6;
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const C = `customers/${ADS_CUSTOMER}`;

export type MatchType = "EXACT" | "PHRASE" | "BROAD";
type Metrics = { costMicros?: string; clicks?: string; impressions?: string; conversions?: number };
const m = (x?: Metrics) => ({
  cost: micros(x?.costMicros),
  clicks: Number(x?.clicks ?? 0),
  impressions: Number(x?.impressions ?? 0),
  conversions: Number(x?.conversions ?? 0),
});

function range(days: number) {
  const now = new Date(Date.now() + 3 * 3600000);
  const end = new Date(now.getTime() - 86400000);
  const start = new Date(end.getTime() - (days - 1) * 86400000);
  return `segments.date BETWEEN '${ymd(start)}' AND '${ymd(end)}'`;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- Google Ads REST yanıtları geniş JSON */

export async function listKeywords(days: number) {
  const [list, perf] = await Promise.all([
    adsQuery<any>(
      "SELECT campaign.id, campaign.name, campaign.status, ad_group.id, ad_group.name, ad_group.status, ad_group_criterion.criterion_id, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.status, ad_group_criterion.quality_info.quality_score FROM ad_group_criterion WHERE ad_group_criterion.type = 'KEYWORD' AND ad_group_criterion.negative = FALSE AND ad_group_criterion.status != 'REMOVED' AND campaign.status != 'REMOVED'",
    ),
    adsQuery<any>(`SELECT ad_group.id, ad_group_criterion.criterion_id, metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions FROM keyword_view WHERE ${range(days)}`),
  ]);
  const p = new Map<string, ReturnType<typeof m>>();
  for (const r of perf) {
    const k = `${r.adGroup.id}~${r.adGroupCriterion.criterionId}`;
    const a = p.get(k) ?? m();
    const b = m(r.metrics);
    p.set(k, { cost: a.cost + b.cost, clicks: a.clicks + b.clicks, impressions: a.impressions + b.impressions, conversions: a.conversions + b.conversions });
  }
  return list
    .map((r) => {
      const id = `${r.adGroup.id}~${r.adGroupCriterion.criterionId}`;
      return {
        id,
        campaignId: r.campaign.id as string,
        campaign: r.campaign.name as string,
        campaignStatus: r.campaign.status as string,
        adGroupId: r.adGroup.id as string,
        adGroup: r.adGroup.name as string,
        text: r.adGroupCriterion.keyword.text as string,
        match: r.adGroupCriterion.keyword.matchType as MatchType,
        status: r.adGroupCriterion.status as string,
        quality: (r.adGroupCriterion.qualityInfo?.qualityScore as number | undefined) ?? null,
        ...(p.get(id) ?? m()),
      };
    })
    .sort((a, b) => b.cost - a.cost || b.impressions - a.impressions);
}

export async function listSearchTerms(days: number) {
  const rows = await adsQuery<any>(
    `SELECT search_term_view.search_term, search_term_view.status, campaign.id, campaign.name, ad_group.id, ad_group.name, metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions FROM search_term_view WHERE ${range(days)} ORDER BY metrics.cost_micros DESC LIMIT 300`,
  );
  return rows.map((r) => ({
    term: r.searchTermView.searchTerm as string,
    // ADDED: anahtar kelime olarak var · EXCLUDED: negatif · NONE: ikisi de değil
    status: r.searchTermView.status as string,
    campaignId: r.campaign.id as string,
    campaign: r.campaign.name as string,
    adGroupId: r.adGroup.id as string,
    adGroup: r.adGroup.name as string,
    ...m(r.metrics),
  }));
}

export async function listNegatives() {
  const rows = await adsQuery<any>(
    "SELECT campaign.id, campaign.name, campaign_criterion.criterion_id, campaign_criterion.keyword.text, campaign_criterion.keyword.match_type FROM campaign_criterion WHERE campaign_criterion.negative = TRUE AND campaign_criterion.type = 'KEYWORD' AND campaign.status != 'REMOVED'",
  );
  return rows.map((r) => ({
    id: `${r.campaign.id}~${r.campaignCriterion.criterionId}`,
    campaignId: r.campaign.id as string,
    campaign: r.campaign.name as string,
    text: r.campaignCriterion.keyword.text as string,
    match: r.campaignCriterion.keyword.matchType as MatchType,
  }));
}

export async function listAds() {
  const rows = await adsQuery<any>(
    "SELECT campaign.id, campaign.name, campaign.status, ad_group.id, ad_group.name, ad_group_ad.ad.id, ad_group_ad.status, ad_group_ad.ad_strength, ad_group_ad.ad.type, ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.ad.responsive_search_ad.descriptions, ad_group_ad.ad.responsive_search_ad.path1, ad_group_ad.ad.responsive_search_ad.path2, ad_group_ad.ad.final_urls, ad_group_ad.policy_summary.approval_status FROM ad_group_ad WHERE ad_group_ad.status != 'REMOVED' AND campaign.status != 'REMOVED'",
  );
  return rows.map((r) => {
    const ad = r.adGroupAd.ad;
    return {
      id: `${r.adGroup.id}~${ad.id}`,
      adId: ad.id as string,
      adGroupId: r.adGroup.id as string,
      campaignId: r.campaign.id as string,
      campaign: r.campaign.name as string,
      campaignStatus: r.campaign.status as string,
      adGroup: r.adGroup.name as string,
      path1: (ad.responsiveSearchAd?.path1 as string | undefined) ?? "",
      path2: (ad.responsiveSearchAd?.path2 as string | undefined) ?? "",
      status: r.adGroupAd.status as string,
      strength: (r.adGroupAd.adStrength as string | undefined) ?? "",
      approval: (r.adGroupAd.policySummary?.approvalStatus as string | undefined) ?? "",
      type: ad.type as string,
      headlines: ((ad.responsiveSearchAd?.headlines ?? []) as { text: string }[]).map((h) => h.text),
      descriptions: ((ad.responsiveSearchAd?.descriptions ?? []) as { text: string }[]).map((h) => h.text),
      url: ((ad.finalUrls ?? []) as string[])[0] ?? "",
    };
  });
}

export async function listAssets() {
  const F =
    "asset.id, asset.name, asset.type, asset.final_urls, asset.image_asset.full_size.url, asset.text_asset.text, asset.sitelink_asset.link_text, asset.sitelink_asset.description1, asset.sitelink_asset.description2, asset.callout_asset.callout_text, asset.structured_snippet_asset.header, asset.structured_snippet_asset.values, asset.call_asset.phone_number";
  const [camp, cust] = await Promise.all([
    adsQuery<any>(
      `SELECT campaign.id, campaign.name, campaign.status, campaign_asset.resource_name, campaign_asset.field_type, campaign_asset.status, ${F} FROM campaign_asset WHERE campaign_asset.status != 'REMOVED' AND campaign.status != 'REMOVED'`,
    ),
    adsQuery<any>(`SELECT customer_asset.resource_name, customer_asset.field_type, customer_asset.status, ${F} FROM customer_asset WHERE customer_asset.status != 'REMOVED'`),
  ]);
  const text = (a: any) =>
    a.sitelinkAsset?.linkText ??
    a.calloutAsset?.calloutText ??
    (a.structuredSnippetAsset ? `${a.structuredSnippetAsset.header}: ${(a.structuredSnippetAsset.values ?? []).join(", ")}` : null) ??
    a.callAsset?.phoneNumber ??
    a.textAsset?.text ??
    a.name ??
    a.type;
  const row = (link: any, a: any, level: string, campaign = "", campaignId = "") => ({
    resource: link.resourceName as string,
    level,
    campaign,
    campaignId,
    type: link.fieldType as string,
    text: text(a) as string,
    detail: [a.sitelinkAsset?.description1, a.sitelinkAsset?.description2].filter(Boolean).join(" · "),
    url: ((a.finalUrls ?? []) as string[])[0] ?? "",
    image: (a.imageAsset?.fullSize?.url as string | undefined) ?? "",
    status: link.status as string,
  });
  return [...cust.map((r) => row(r.customerAsset, r.asset, "Hesap")), ...camp.map((r) => row(r.campaignAsset, r.asset, "Kampanya", r.campaign.name, r.campaign.id))];
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// ───────────────────────── İşlemler ─────────────────────────

const id = (s: string) => {
  if (!/^\d+(~\d+)?$/.test(s)) throw new Error("Geçersiz kimlik.");
  return s;
};
const clean = (t: string) => {
  const s = t.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
  if (!s || s.length > 80) throw new Error("Anahtar kelime boş ya da çok uzun.");
  return s;
};

export const setKeywordStatus = (kwId: string, status: "ENABLED" | "PAUSED") =>
  adsMutate("adGroupCriteria", [{ update: { resourceName: `${C}/adGroupCriteria/${id(kwId)}`, status }, updateMask: "status" }]);

export const removeKeyword = (kwId: string) => adsMutate("adGroupCriteria", [{ remove: `${C}/adGroupCriteria/${id(kwId)}` }]);

export const addKeywords = (adGroupId: string, texts: string[], matchType: MatchType) =>
  adsMutate(
    "adGroupCriteria",
    texts.map((t) => ({ create: { adGroup: `${C}/adGroups/${id(adGroupId)}`, status: "ENABLED", keyword: { text: clean(t), matchType } } })),
  );

/** Kampanya düzeyinde negatif anahtar kelime(ler). */
export const addNegatives = (campaignIds: string[], texts: string[], matchType: MatchType) =>
  adsMutate(
    "campaignCriteria",
    campaignIds.flatMap((c) => texts.map((t) => ({ create: { campaign: `${C}/campaigns/${id(c)}`, negative: true, keyword: { text: clean(t), matchType } } }))),
  );

export const removeNegative = (negId: string) => adsMutate("campaignCriteria", [{ remove: `${C}/campaignCriteria/${id(negId)}` }]);

export const setAdStatus = (adId: string, status: "ENABLED" | "PAUSED") =>
  adsMutate("adGroupAds", [{ update: { resourceName: `${C}/adGroupAds/${id(adId)}`, status }, updateMask: "status" }]);

// ───────────────────────── Kampanya kurulumu ─────────────────────────

/**
 * Plandan arama kampanyası kurar (DURDURULMUŞ): bütçe, kampanya, iller, dil, negatifler,
 * reklam grupları, anahtar kelimeler, duyarlı reklamlar, site bağlantıları, açıklama metinleri,
 * snippet. Tek atomik istek: biri hatalıysa hiçbiri oluşmaz. validateOnly: sadece doğrular.
 */
export async function createSearchCampaign(plan: import("./google-ads-plan").CampaignPlan, opts: { validateOnly?: boolean } = {}) {
  const { headlinesFor } = await import("./google-ads-plan");
  const budget = `${C}/campaignBudgets/-1`;
  const campaign = `${C}/campaigns/-2`;
  const ops: Record<string, unknown>[] = [
    {
      campaignBudgetOperation: {
        create: { resourceName: budget, name: `${plan.name} · bütçe`, amountMicros: String(plan.dailyBudget * 1_000_000), deliveryMethod: "STANDARD", explicitlyShared: false },
      },
    },
    {
      campaignOperation: {
        create: {
          resourceName: campaign,
          name: plan.name,
          status: "PAUSED",
          advertisingChannelType: "SEARCH",
          campaignBudget: budget,
          maximizeConversions: {},
          networkSettings: { targetGoogleSearch: true, targetSearchNetwork: false, targetContentNetwork: false, targetPartnerSearchNetwork: false },
          geoTargetTypeSetting: { positiveGeoTargetType: "PRESENCE", negativeGeoTargetType: "PRESENCE" },
          containsEuPoliticalAdvertising: "DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING",
        },
      },
    },
    ...plan.locations.map((l) => ({ campaignCriterionOperation: { create: { campaign, location: { geoTargetConstant: `geoTargetConstants/${l.id}` } } } })),
    { campaignCriterionOperation: { create: { campaign, language: { languageConstant: "languageConstants/1037" } } } },
    ...plan.negatives.map((t) => ({ campaignCriterionOperation: { create: { campaign, negative: true, keyword: { text: clean(t), matchType: "PHRASE" } } } })),
  ];
  plan.adGroups.forEach((g, i) => {
    const adGroup = `${C}/adGroups/-${10 + i}`;
    ops.push({ adGroupOperation: { create: { resourceName: adGroup, campaign, name: g.name, status: "ENABLED", type: "SEARCH_STANDARD" } } });
    for (const k of g.keywords) ops.push({ adGroupCriterionOperation: { create: { adGroup, status: "ENABLED", keyword: { text: clean(k), matchType: "PHRASE" } } } });
    ops.push({
      adGroupAdOperation: {
        create: {
          adGroup,
          status: "ENABLED",
          ad: {
            finalUrls: [g.finalUrl],
            responsiveSearchAd: {
              headlines: headlinesFor(g).map((text) => ({ text })),
              descriptions: plan.descriptions.map((text) => ({ text })),
              path1: g.path1,
              ...(g.path2 ? { path2: g.path2 } : {}),
            },
          },
        },
      },
    });
  });
  const assets: [string, string][] = [];
  plan.sitelinks.forEach((s, i) => {
    const r = `${C}/assets/-${100 + i}`;
    ops.push({ assetOperation: { create: { resourceName: r, finalUrls: [s.url], sitelinkAsset: { linkText: s.text, description1: s.d1, description2: s.d2 } } } });
    assets.push([r, "SITELINK"]);
  });
  plan.callouts.forEach((t, i) => {
    const r = `${C}/assets/-${200 + i}`;
    ops.push({ assetOperation: { create: { resourceName: r, calloutAsset: { calloutText: t } } } });
    assets.push([r, "CALLOUT"]);
  });
  const sn = `${C}/assets/-300`;
  ops.push({ assetOperation: { create: { resourceName: sn, structuredSnippetAsset: { header: plan.snippet.header, values: plan.snippet.values } } } });
  assets.push([sn, "STRUCTURED_SNIPPET"]);
  for (const [asset, fieldType] of assets) ops.push({ campaignAssetOperation: { create: { campaign, asset, fieldType } } });

  return adsBatch(ops, opts.validateOnly);
}

// ───────────────────────── Reklam ve uzantı düzenleme ─────────────────────────

export type RsaInput = { headlines: string[]; descriptions: string[]; finalUrl: string; path1?: string; path2?: string };
const SITE = /^https:\/\/akturkenerji\.com\//;

function checkRsa(r: RsaInput) {
  const h = r.headlines.map((x) => x.trim()).filter(Boolean);
  const d = r.descriptions.map((x) => x.trim()).filter(Boolean);
  if (h.length < 3 || h.length > 15) throw new Error("3–15 başlık gerekli.");
  if (d.length < 2 || d.length > 4) throw new Error("2–4 açıklama gerekli.");
  const longH = h.find((x) => x.length > 30);
  if (longH) throw new Error(`Başlık 30 karakteri geçiyor: "${longH}"`);
  const longD = d.find((x) => x.length > 90);
  if (longD) throw new Error(`Açıklama 90 karakteri geçiyor: "${longD}"`);
  if (!SITE.test(r.finalUrl)) throw new Error("Sayfa adresi https://akturkenerji.com/ ile başlamalı.");
  if ((r.path1 ?? "").length > 15 || (r.path2 ?? "").length > 15) throw new Error("Yol alanları en fazla 15 karakter.");
  return {
    finalUrls: [r.finalUrl],
    responsiveSearchAd: {
      headlines: h.map((text) => ({ text })),
      descriptions: d.map((text) => ({ text })),
      path1: r.path1 || undefined,
      path2: r.path1 && r.path2 ? r.path2 : undefined,
    },
  };
}

/** Duyarlı arama reklamının başlık/açıklama/adres değişikliği (reklam yeniden incelemeye girer). */
export const updateRsa = (adId: string, r: RsaInput) =>
  adsMutate("ads", [
    {
      update: { resourceName: `${C}/ads/${id(adId)}`, ...checkRsa(r) },
      updateMask: "final_urls,responsive_search_ad.headlines,responsive_search_ad.descriptions,responsive_search_ad.path1,responsive_search_ad.path2",
    },
  ]);

/** Reklam grubuna yeni duyarlı arama reklamı. */
export const createRsa = (adGroupId: string, r: RsaInput) =>
  adsMutate("adGroupAds", [{ create: { adGroup: `${C}/adGroups/${id(adGroupId)}`, status: "ENABLED", ad: checkRsa(r) } }]);

/** Kampanyaya site bağlantısı ekler. */
export function addSitelink(campaignId: string, s: { text: string; d1: string; d2: string; url: string }) {
  if (!s.text.trim() || s.text.length > 25) throw new Error("Bağlantı metni 1–25 karakter olmalı.");
  if (s.d1.length > 35 || s.d2.length > 35) throw new Error("Açıklamalar en fazla 35 karakter.");
  if (!SITE.test(s.url)) throw new Error("Sayfa adresi https://akturkenerji.com/ ile başlamalı.");
  const asset = `${C}/assets/-1`;
  return adsBatch([
    {
      assetOperation: {
        create: { resourceName: asset, finalUrls: [s.url], sitelinkAsset: { linkText: s.text.trim(), description1: s.d1.trim() || undefined, description2: s.d2.trim() || undefined } },
      },
    },
    { campaignAssetOperation: { create: { campaign: `${C}/campaigns/${id(campaignId)}`, asset, fieldType: "SITELINK" } } },
  ]);
}

/** Kampanyaya açıklama metni (callout) ekler. */
export function addCallout(campaignId: string, text: string) {
  if (!text.trim() || text.length > 25) throw new Error("Açıklama metni 1–25 karakter olmalı.");
  const asset = `${C}/assets/-1`;
  return adsBatch([
    { assetOperation: { create: { resourceName: asset, calloutAsset: { calloutText: text.trim() } } } },
    { campaignAssetOperation: { create: { campaign: `${C}/campaigns/${id(campaignId)}`, asset, fieldType: "CALLOUT" } } },
  ]);
}

/** Uzantıyı kampanyadan / hesaptan kaldırır (uzantının kendisi silinmez, bağlantısı kalkar). */
export function removeAssetLink(resource: string) {
  const m = resource.match(/^customers\/\d+\/(campaignAssets|customerAssets)\/[\w~]+$/);
  if (!m || !resource.startsWith(`${C}/`)) throw new Error("Geçersiz uzantı.");
  return adsMutate(m[1], [{ remove: resource }]);
}
