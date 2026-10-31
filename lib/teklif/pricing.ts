// Teklif fiyatlama: mağazadaki panel/invertör/batarya maliyetleri ile kW aralığına göre
// tanımlanan kurallardan malzeme listesi üretir. Tutarlar USD ve KDV hariçtir.

import type { PaymentStep, PriceLine, Proposal, ProposalNumbers } from "./proposal";
import type { InverterSpec, PanelSpec, SiteTemps } from "./strings";

export type RoofKind = "kiremit" | "trapez" | "sandvic" | "etermit" | "parapetli" | "parapetsiz" | "toprak";
export const CATI_ADI: Record<RoofKind, string> = {
  kiremit: "Kiremit çatı",
  trapez: "Trapez çatı",
  sandvic: "Sandviç panel çatı",
  etermit: "Etermit çatı",
  parapetli: "Parapetli düz çatı",
  parapetsiz: "Parapetsiz düz çatı",
  toprak: "Toprak zemin",
};

/** birim: sabit = iş başına, kwp = kWp başına, panel = panel başına. */
export type QuoteRule = { id: string; ad: string; birim: "sabit" | "kwp" | "panel"; kwFrom: number; kwTo: number; cati: RoofKind | "hepsi"; maliyetUsd: number; marjPct: number };

export type QuoteSettings = {
  rules: QuoteRule[];
  /** Mağaza ürününde kâr oranı yoksa kullanılır. */
  defaultMarginPct: number;
  /** Sözleşme gücünün üzerine eklenecek PV payı. */
  oversizePct: number;
  /** Elektrik fiyatının bugüne göre artışı (%): 2. yıldan 10. yıla, sonrası sabit. */
  hikeTable: number[];
  /** Bu kâr oranının altındaki teklifler uyarı verir. */
  minMarginPct: number;
  paymentPlan: PaymentStep[];
  /** Ürün veri sayfası değerleri (string tasarımı). */
  specs?: { panels: Record<string, PanelSpec>; inverters: Record<string, InverterSpec> };
  temps?: SiteTemps;
  /** Kurulu sistemlerin gerçek yıllık üretimi. */
  realProduction?: RealProduction[];
  /** Teklif PDF'inin ekleri. */
  datasheets?: Datasheet[];
  /** Teklifte görünecek site referansları; boşsa DEFAULT_REFERENCE_IDS. */
  referenceIds?: number[];
  banks?: { banka: string; sube: string; iban: string }[];
  hesapSahibi?: string;
  notlar?: string;
  garantiDisi?: string;
};

/** slugs: bağlı ürünler; kelime: hazır paket kaleminin adında geçen ifade. */
export type Datasheet = { id: string; ad: string; url: string; slugs?: string[]; kelime?: string };

export type RealProduction = { id: string; ad: string; kwp: number; yillikKwh: number };

/** Benzer güçteki (±%30) kurulumların ortalama kWh/kWp değeri. */
export function similarProduction(rows: RealProduction[] | undefined, kwp: number) {
  const list = (rows ?? []).filter((r) => r.kwp > 0 && r.yillikKwh > 0 && r.kwp >= kwp * 0.7 && r.kwp <= kwp * 1.3);
  if (!list.length) return undefined;
  return { count: list.length, specific: list.reduce((a, r) => a + r.yillikKwh / r.kwp, 0) / list.length };
}

const rule = (id: string, ad: string, birim: QuoteRule["birim"], cati: QuoteRule["cati"] = "hepsi"): QuoteRule => ({ id, ad, birim, kwFrom: 0, kwTo: 100000, cati, maliyetUsd: 0, marjPct: 45 });

export const DEFAULT_REFERENCE_IDS = [38, 33, 50, 37, 46, 29];

/** Sitedeki referans projelerinden teklif sayfası için seçim, sıra korunur. */
export function pickReferences<T extends { id?: number; title: string; image?: string | null; location?: string | null; year?: string | number | null }>(rows: T[], ids?: number[]) {
  const chosen = ids?.length ? ids : DEFAULT_REFERENCE_IDS;
  return chosen.flatMap((id) => {
    const r = rows.find((x) => x.id === id);
    return r?.image ? [{ id, ad: r.title, url: r.image, konum: r.location, yil: r.year }] : [];
  });
}

export const DEFAULT_SETTINGS: QuoteSettings = {
  datasheets: [{ id: "tommatech-v-280", ad: "TommaTech V Serisi LFP Lityum Batarya 51.2V 280Ah", url: "/teklif/tommatech-v-serisi-51v-280ah.pdf", kelime: "51.2V 280" }],
  hesapSahibi: "Akturk Yenilenebilir Enerji Teknolojileri Sanayi Ticaret Limited Şirketi",
  banks: [
    { banka: "Ziraat Bankası", sube: "Necatibey Şubesi", iban: "TR03 0001 0021 0191 5377 6550 02" },
    { banka: "Türkiye İş Bankası", sube: "Esertepe Şubesi", iban: "TR95 0006 4000 0014 3920 1411 17" },
    { banka: "Vakıfbank", sube: "Esertepe Şubesi", iban: "TR06 0001 5001 5800 7314 9556 86" },
  ],
  notlar: [
    "Döviz bazlı tekliflerde TL ile ödeme yapılacaksa Ziraat Bankası Efektif Satış kuru baz alınır.",
    "Döviz bazlı tekliflerde döviz ile ödeme yapılacaksa USD kuru üzerinden gönderim sağlanabilir.",
    "Sistemin kurulacağı alanın projeye uygunluğu, Aktürk Enerji tarafından onaylanacaktır.",
    "Sunulan teklif ve dokümanlar gizlilik kapsamındadır, üçüncü kişilerle paylaşılmaması rica olunur.",
    "Dış müdahale veya hatalı kullanım sonucu arızalarda servis hizmetleri ücretli sağlanabilir.",
    "Bu teklif yazım hatalarında Aktürk Enerji Teknolojileri'nin düzeltme hakkı saklıdır.",
    "Doğabilecek uyuşmazlıklarda Ankara Mahkemeleri ve İcra Daireleri yetkilidir.",
    "Havale/EFT ile yapılan ödemelerde, ödeme açıklaması bölümüne teklif numarasının belirtilmesi rica olunur.",
    "Kredi kartı ile yapılan taksitli ödemelerde, ilgili banka ve ödeme kuruluşları tarafından uygulanabilecek komisyon oranları toplam tutara yansıtılabilir.",
    "Ödeme yaptıktan sonra satış temsilcinize dekontu iletmeniz rica olunur.",
  ].join("\n"),
  garantiDisi: [
    "Bakım ve kullanım talimatlarına aykırı kullanım,",
    "Yanlış kullanım ve ihmaller,",
    "Mücbir sebepler, doğal felaketler,",
    "Aktürk Enerji Teknolojileri kapsam alanı dışındaki kazalar,",
    "Yetkisiz kişilerce açılmış veya tamir edilmeye çalışılmış ekipmanlar,",
    "Yukarıda yer almayan koşullarda uluslararası standartlar geçerlidir.",
  ].join("\n"),
  rules: [
    rule("kons-kiremit", "Kiremit çatı montaj sistemi", "kwp", "kiremit"),
    rule("kons-trapez", "Trapez çatı montaj sistemi", "kwp", "trapez"),
    rule("kons-sandvic", "Sandviç panel çatı montaj sistemi", "kwp", "sandvic"),
    rule("kons-etermit", "Etermit çatı montaj sistemi", "kwp", "etermit"),
    rule("kons-parapetli", "Parapetli düz çatı montaj sistemi", "kwp", "parapetli"),
    rule("kons-parapetsiz", "Parapetsiz düz çatı montaj sistemi", "kwp", "parapetsiz"),
    rule("kons-toprak", "Zemin tipi montaj sistemi", "kwp", "toprak"),
    rule("kablo", "Solar DC kablo ve MC4 konnektörler", "kwp"),
    rule("ag", "AG kablo ve kablo tavaları", "kwp"),
    rule("pano", "GES panosu ve şalt malzemeleri", "sabit"),
    rule("topraklama", "Topraklama malzemeleri", "sabit"),
    rule("montaj", "Konstrüksiyon, panel ve elektrik montajı", "kwp"),
    rule("nakliye", "Nakliye", "sabit"),
    rule("vinc", "Vinç hizmeti", "sabit"),
    rule("eproje", "Elektrik projesi", "sabit"),
    rule("sproje", "Statik proje", "sabit"),
    rule("muhendislik", "Başvuru, müşavirlik ve mühendislik hizmetleri", "sabit"),
  ],
  defaultMarginPct: 45,
  oversizePct: 20,
  hikeTable: [25, 50, 100, 150, 200, 250, 300, 350, 400],
  minMarginPct: 20,
  paymentPlan: [
    { id: "kesif", ad: "Saha keşfi", pct: 10, sure: "1. hafta" },
    { id: "proje", ad: "Proje onayı", pct: 20, sure: "9. hafta" },
    { id: "baglanti", ad: "Sistem bağlantı anlaşması", pct: 50, sure: "10. hafta" },
    { id: "kurulum", ad: "Tedarik, kurulum ve montaj", pct: 10, sure: "16. hafta" },
    { id: "kabul", ad: "Geçici kabul", pct: 10, sure: "18. hafta" },
  ],
};

/** Sözleşme gücüne göre hedef PV gücü (kWp). */
export const targetKwp = (contractKw: number, oversizePct: number) => (contractKw > 0 ? contractKw * (1 + oversizePct / 100) : 0);

export const salePrice = (costUsd: number, marginPct: number) => costUsd * (1 + marginPct / 100);

type Item = { name: string; costUsd?: number; marginPct?: number };

/** Tasarımdaki sisteme göre kalem listesi. Maliyeti girilmemiş kurallar 0 ile gelir; ekranda uyarılır. */
export function buildQuoteLines(input: {
  kwp: number;
  panelCount: number;
  roof: RoofKind;
  panel: Item;
  inverter?: (Item & { adet: number }) | null;
  battery?: (Item & { adet: number; extras?: { name: string; adet: number; costUsd: number }[] }) | null;
  settings: QuoteSettings;
  uid: () => string;
}): PriceLine[] {
  const { kwp, panelCount, roof, panel, inverter, battery, settings, uid } = input;
  const item = (ad: string, adet: number, birim: string, costUsd: number, marjPct: number): PriceLine => ({ id: uid(), ad, adet, birim, maliyetUsd: costUsd, marjPct, birimFiyat: salePrice(costUsd, marjPct) });
  const m = (i: Item) => i.marginPct ?? settings.defaultMarginPct;
  const lines: PriceLine[] = [{ ...item(panel.name, panelCount, "adet", panel.costUsd ?? 0, m(panel)), kind: "panel" }];
  if (inverter) lines.push({ ...item(inverter.name, inverter.adet, "adet", inverter.costUsd ?? 0, m(inverter)), kind: "inverter" });
  if (battery) {
    lines.push({ ...item(battery.name, battery.adet, "adet", battery.costUsd ?? 0, m(battery)), kind: "battery" });
    for (const x of battery.extras ?? []) lines.push(item(x.name, x.adet, "adet", x.costUsd, settings.defaultMarginPct));
  }
  for (const r of settings.rules) {
    if (r.cati !== "hepsi" && r.cati !== roof) continue;
    if (kwp < r.kwFrom || kwp > r.kwTo) continue;
    const adet = r.birim === "kwp" ? Math.round(kwp * 100) / 100 : r.birim === "panel" ? panelCount : 1;
    lines.push(item(r.ad, adet, r.birim === "kwp" ? "kWp" : r.birim === "panel" ? "adet" : "iş", r.maliyetUsd, r.marjPct));
  }
  return lines;
}

export type QuoteCheck = { level: "hata" | "uyari"; text: string };

/** Teklif oluşturmadan önceki kontroller. Hatalar teklifi yanlış yapar, uyarılar gözden geçirilir. */
export function quoteChecks(p: Proposal, n: ProposalNumbers, minMarginPct: number): QuoteCheck[] {
  const out: QuoteCheck[] = [];
  const hata = (text: string) => out.push({ level: "hata", text });
  const uyari = (text: string) => out.push({ level: "uyari", text });
  const mode = p.priceMode ?? "malzeme";
  const c = p.customer;
  if (c.name.trim().split(/\s+/).length < 2) hata("Müşterinin adı ve soyadı girilmedi.");
  const tel = c.phone.replace(/\D/g, "").replace(/^90/, "").replace(/^0/, "");
  if (tel.length !== 10) hata("Telefon numarası eksik ya da hatalı (10 hane olmalı).");
  if (!c.province.trim()) hata("İl girilmedi.");
  if (!c.district?.trim()) hata("İlçe girilmedi.");
  if (!c.email.trim()) uyari("E-posta girilmedi.");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) hata("E-posta adresi hatalı.");
  if (n.panelCount === 0) hata("Çatıda panel yok.");
  if (n.total <= 0) hata("Teklif tutarı 0.");
  if (mode === "malzeme") {
    const empty = p.lines.filter((l) => !l.birimFiyat).length;
    if (empty) hata(`${empty} kalemin fiyatı yok.`);
  }
  const plan = (p.paymentPlan ?? []).reduce((a, b) => a + b.pct, 0);
  if (p.paymentPlan?.length && plan !== 100) hata(`Ödeme planı toplamı %${plan}, %100 olmalı.`);
  if (p.priceCurrency === "USD" && !p.usdTry) hata("USD/TL kuru girilmedi; geri ödeme hesaplanamaz.");
  const panelLine = p.lines.find((l) => l.kind === "panel");
  if (panelLine && panelLine.adet !== n.panelCount) uyari(`Listede ${panelLine.adet} panel var, tasarımda ${n.panelCount}.`);
  const onGrid = (p.systemType ?? "ongrid") === "ongrid";
  if (onGrid && !p.inverter) uyari("İnvertör seçilmedi.");
  if (!onGrid && !p.lines.length) hata("Paket seçilmedi.");
  if ((p.voltage === "og" || p.term === "cift") && !p.unitKr) hata("Orta gerilim ya da çift terimde elle birim fiyat girilmeli; EPDK tablosu yalnız AG tek terimi kapsıyor.");
  if (n.dcAcRatio != null && (n.dcAcRatio > 1.3 || n.dcAcRatio < 0.85)) uyari(`DC/AC oranı ${n.dcAcRatio.toFixed(2)}; önerilen aralık 0,85-1,30.`);
  if (p.abone === "mesken" && n.acKw > 25) uyari("Mesken aboneliğinde AC güç en fazla 25 kW olabilir.");
  if (p.contractKw && n.acKw > p.contractKw) uyari(`AC güç (${n.acKw} kW) sözleşme gücünü (${p.contractKw} kW) aşıyor.`);
  if (p.battery && p.inverter && !/hibrit|hybrid/i.test(p.inverter.name)) uyari("Bataryalı teklifte hibrit olmayan invertör seçili.");
  if (onGrid && n.annualKwh <= 0) uyari("Tüketim girilmedi; tasarruf ve geri ödeme belgede yer almaz.");
  if (!onGrid && !p.currentEnergyCostTl) uyari("Mevcut yıllık enerji gideri girilmedi; geri ödeme hesaplanmaz.");
  if (p.usdDate && p.showTl) {
    const [d, m, y] = p.usdDate.split(".").map(Number);
    const age = (Date.now() - new Date(y, m - 1, d).getTime()) / 864e5;
    if (age > 3) uyari(`Kur ${p.usdDate} tarihli, güncelleyin.`);
  }
  if (mode !== "manuel" || p.lines.length) {
    const cost = p.lines.reduce((a, l) => a + l.adet * (l.maliyetUsd ?? 0), 0);
    const net = Math.max(0, n.subtotal - p.discountTl);
    if (cost > 0 && ((net - cost) / cost) * 100 < minMarginPct) uyari(`Kâr oranı %${(((net - cost) / cost) * 100).toFixed(0)}; alt sınır %${minMarginPct}.`);
  }
  return out;
}

export type Recipe = { slug: string; name: string; kind: "offgrid" | "sulama"; bom: { qty: number; name: string; unit: number }[] };
const isPanelRow = (name: string) => /panel/i.test(name) && !/kablo|konstr|montaj|set/i.test(name);

/** Off grid ve sulama: mağaza paketinin reçetesi kalem listesi olur. */
export function recipeLines(r: Recipe, marginPct: number, uid: () => string): PriceLine[] {
  return r.bom.map((b) => ({ id: uid(), ad: b.name, adet: b.qty, birim: "adet", maliyetUsd: b.unit, marjPct: marginPct, birimFiyat: salePrice(b.unit, marginPct), kind: isPanelRow(b.name) ? ("panel" as const) : undefined }));
}

/** Tasarımdaki panel sayısına en yakın (mümkünse yetecek kadar büyük) paket. */
export function pickRecipe(list: Recipe[], kind: Recipe["kind"], panelCount: number) {
  const own = list.filter((r) => r.kind === kind && r.bom.length);
  const count = (r: Recipe) => r.bom.filter((b) => isPanelRow(b.name)).reduce((a, b) => a + b.qty, 0);
  return [...own].sort((a, b) => Math.abs(count(a) - panelCount) - Math.abs(count(b) - panelCount))[0] ?? null;
}

/** Yazım farklarını siler: "51,2 V 280 Ah" ile "51.2V 280Ah" aynı sayılır. */
const yazim = (t: string) => t.toLocaleLowerCase("tr-TR").replace(/,/g, ".").replace(/\s+/g, "");
export const kelimeUyar = (d: Datasheet, ad: string) => Boolean(d.kelime?.trim() && yazim(ad).includes(yazim(d.kelime)));

/** Teklifteki ürünlere bağlı datasheet'ler. */
export function matchDatasheets(p: Proposal, list: Datasheet[]) {
  const slugs = [p.panel.slug, p.inverter?.slug, p.battery?.slug, ...(p.extraInverters ?? []).map((x) => x.slug)].filter(Boolean) as string[];
  const names = [p.panel.name, p.inverter?.name, p.battery?.name, ...p.lines.map((l) => l.ad)].filter(Boolean).join("\n").toLocaleLowerCase("tr-TR");
  return list.filter((d) => d.slugs?.some((x) => slugs.includes(x)) || (d.kelime?.trim() && names.includes(d.kelime.trim().toLocaleLowerCase("tr-TR"))));
}
