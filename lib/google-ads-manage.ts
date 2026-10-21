import { ADS_CUSTOMER, adsQuery, adsMutate } from "./google-ads";

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
    "SELECT campaign.id, campaign.name, ad_group.id, ad_group.name, ad_group_ad.ad.id, ad_group_ad.status, ad_group_ad.ad_strength, ad_group_ad.ad.type, ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.ad.responsive_search_ad.descriptions, ad_group_ad.ad.final_urls, ad_group_ad.policy_summary.approval_status FROM ad_group_ad WHERE ad_group_ad.status != 'REMOVED' AND campaign.status != 'REMOVED'",
  );
  return rows.map((r) => {
    const ad = r.adGroupAd.ad;
    return {
      id: `${r.adGroup.id}~${ad.id}`,
      campaign: r.campaign.name as string,
      adGroup: r.adGroup.name as string,
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
  const [camp, cust] = await Promise.all([
    adsQuery<any>(
      "SELECT campaign.name, campaign.status, campaign_asset.field_type, campaign_asset.status, asset.type, asset.sitelink_asset.link_text, asset.sitelink_asset.description1, asset.callout_asset.callout_text, asset.structured_snippet_asset.header, asset.structured_snippet_asset.values, asset.call_asset.phone_number FROM campaign_asset WHERE campaign_asset.status != 'REMOVED' AND campaign.status != 'REMOVED'",
    ),
    adsQuery<any>(
      "SELECT customer_asset.field_type, customer_asset.status, asset.type, asset.sitelink_asset.link_text, asset.sitelink_asset.description1, asset.callout_asset.callout_text, asset.structured_snippet_asset.header, asset.structured_snippet_asset.values, asset.call_asset.phone_number FROM customer_asset WHERE customer_asset.status != 'REMOVED'",
    ),
  ]);
  const text = (a: any) =>
    a.sitelinkAsset?.linkText ??
    a.calloutAsset?.calloutText ??
    (a.structuredSnippetAsset ? `${a.structuredSnippetAsset.header}: ${(a.structuredSnippetAsset.values ?? []).join(", ")}` : null) ??
    a.callAsset?.phoneNumber ??
    a.type;
  return [
    ...cust.map((r) => ({ level: "Hesap", campaign: "", type: r.customerAsset.fieldType as string, text: text(r.asset) as string, status: r.customerAsset.status as string })),
    ...camp.map((r) => ({ level: "Kampanya", campaign: r.campaign.name as string, type: r.campaignAsset.fieldType as string, text: text(r.asset) as string, status: r.campaignAsset.status as string })),
  ];
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
