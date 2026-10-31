import { adminClient, getReferences, getSiteSettings, SITE_URL } from "@/lib/data";
import { getStoreProducts } from "@/lib/store-data";
import { kwOf } from "@/lib/store-details";
import { currentUser } from "@/lib/admin-guard";
import { permsOf } from "@/lib/staff";
import Studio from "@/components/admin/teklif/Studio";

// Teklif Stüdyosu: uydu üzerinde çatı çizimi, panel yerleşimi, 3B görünüm, üretim ve PDF teklif.
// Ürün ve fiyat seçenekleri mağazadan gelir.

export default async function TeklifStudyosuPage({ searchParams }: { searchParams: Promise<{ calc?: string; id?: string; customer?: string }> }) {
  const [products, site, sp, siteReferences, costRes] = await Promise.all([getStoreProducts(), getSiteSettings(), searchParams, getReferences(), adminClient().from("store_products").select("slug, name, cost_usd, margin_pct, bom, category")]);
  // Maliyetler yalnız bu admin sayfasına gelir; mağaza verisinde bulunmaz.
  const costs = new Map((costRes.data ?? []).map((c) => [c.slug as string, { costUsd: c.cost_usd == null ? undefined : Number(c.cost_usd), marginPct: c.margin_pct == null ? undefined : Number(c.margin_pct) }]));

  // Paneller paletle satılır; adet fiyatı palet fiyatı / adet.
  const panels = products
    .filter((p) => p.category === "gunes-panelleri")
    .map((p) => {
      const wp = Number(p.name.match(/(\d{3})\s*W/)?.[1]);
      const count = Number(p.name.match(/\((\d+)\s*Adet\)/i)?.[1]) || 1;
      const c = costs.get(p.slug);
      return { name: p.name.replace(/\s*—.*$/, "").replace(/\s*\(.*\)$/, ""), wp, price: p.price ? Math.round(p.price / count) : undefined, slug: p.slug, lengthM: /diamond plus/i.test(p.name) ? 2.278 : wp >= 600 ? 2.382 : 2.279, widthM: 1.134, costUsd: c?.costUsd != null ? c.costUsd / count : undefined, marginPct: c?.marginPct };
    })
    .filter((p) => p.wp > 0);

  // Şebekeye bağlı sistemler için on grid ve hibrit invertörler.
  const inverters = products
    .filter((p) => p.category === "inverter" && /on grid|hibrit/i.test(p.name) && !/off grid/i.test(p.name))
    .map((p) => ({ name: p.name, kw: kwOf(p), price: p.price ?? undefined, slug: p.slug, hybrid: /hibrit/i.test(p.name), ...costs.get(p.slug) }))
    .filter((p) => p.kw > 0)
    .sort((a, b) => a.kw - b.kw || (a.price ?? 0) - (b.price ?? 0));

  // Bataryalı teklifler için lityum bataryalar (kWh adından okunur).
  const batteries = products
    .filter((p) => p.category === "lityum-batarya-ve-setleri")
    .map((p) => ({ name: p.name, kwh: Number(p.name.match(/([\d,.]+)\s*kWh/i)?.[1].replace(",", ".")) || 0, slug: p.slug, ...costs.get(p.slug) }))
    .filter((p) => p.kwh > 0)
    .sort((a, b) => a.kwh - b.kwh);

  // Off grid ve sulama: paket reçeteleri.
  type RecipeRow = { qty?: number; name?: string; unit?: number };
  const recipes = (costRes.data ?? [])
    .filter((c) => (c.category === "off-grid-paketler" || c.category === "tarimsal-sulama-paketleri") && Array.isArray(c.bom) && c.bom.length)
    .map((c) => ({ slug: c.slug as string, name: c.name as string, kind: c.category === "off-grid-paketler" ? ("offgrid" as const) : ("sulama" as const), bom: (c.bom as RecipeRow[]).map((b) => ({ qty: Number(b.qty) || 0, name: String(b.name ?? ""), unit: Number(b.unit) || 0 })) }));

  // Bataryalı sistemin BMS, sayaç ve Wi-Fi kalemleri: mağaza ürünü ve hibrit paket reçetelerinden.
  type BomRow = { name?: string; unit?: number };
  const accessoryMap = new Map<string, number>();
  for (const c of costRes.data ?? []) {
    if (c.category === "lityum-batarya-ve-setleri" && /BMS/i.test(c.name) && c.cost_usd) accessoryMap.set(c.name, Number(c.cost_usd));
    if (c.category === "hibrit-paketler")
      for (const b of (c.bom ?? []) as BomRow[]) if (b.name && b.unit && /BMS|Smart Meter|Dongle/i.test(b.name)) accessoryMap.set(b.name, b.unit);
  }
  const accessories = [...accessoryMap].map(([name, costUsd]) => ({ name, costUsd }));

  // Anahtar teslim fiyat karşılaştırması için on grid paketleri (TL/kW).
  const packages = products
    .filter((p) => p.category === "on-grid-paketler" && p.price)
    .map((p) => ({ kw: kwOf(p), price: p.price! }))
    .filter((p) => p.kw > 0);

  // Maliyet yetkisi yoksa tarayıcıya maliyet inmez: ürünler satış fiyatıyla (kâr %0) gider.
  const perms = permsOf(await currentUser());
  const sell = <T extends { costUsd?: number; marginPct?: number }>(x: T): T => (perms.cost ? x : { ...x, costUsd: x.costUsd != null ? x.costUsd * (1 + (x.marginPct ?? 45) / 100) : undefined, marginPct: 0 });

  return (
    <Studio
      panels={panels.map(sell)}
      inverters={inverters.map(sell)}
      batteries={batteries.map(sell)}
      accessories={accessories.map((a) => (perms.cost ? a : { ...a, costUsd: a.costUsd * 1.45 }))}
      recipes={perms.cost ? recipes : recipes.map((r) => ({ ...r, bom: r.bom.map((b) => ({ ...b, unit: b.unit * 1.45 })) }))}
      hideCost={!perms.cost}
      siteReferences={siteReferences}
      canEditRules={perms.rules}
      packages={packages}
      company={{ name: site.name, phone: site.contact.phoneDisplay, email: site.contact.email, address: site.contact.addressLine, web: SITE_URL.replace(/^https?:\/\//, "") }}
      initialCalcId={sp.calc ? Number(sp.calc) : undefined}
      initialId={sp.id ? Number(sp.id) : undefined}
      initialCustomerId={sp.customer ? Number(sp.customer) : undefined}
    />
  );
}
