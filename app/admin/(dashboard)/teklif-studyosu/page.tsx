import { adminClient, getSiteSettings, SITE_URL } from "@/lib/data";
import { getStoreProducts } from "@/lib/store-data";
import { kwOf } from "@/lib/store-details";
import Studio from "@/components/admin/teklif/Studio";

// Teklif Stüdyosu: uydu üzerinde çatı çizimi, panel yerleşimi, 3B görünüm, üretim ve PDF teklif.
// Ürün ve fiyat seçenekleri mağazadan gelir.

export default async function TeklifStudyosuPage({ searchParams }: { searchParams: Promise<{ calc?: string; id?: string }> }) {
  const [products, site, sp, costRes] = await Promise.all([getStoreProducts(), getSiteSettings(), searchParams, adminClient().from("store_products").select("slug, cost_usd, margin_pct")]);
  // Maliyetler yalnız bu admin sayfasına gelir; mağaza verisinde bulunmaz.
  const costs = new Map((costRes.data ?? []).map((c) => [c.slug as string, { costUsd: c.cost_usd == null ? undefined : Number(c.cost_usd), marginPct: c.margin_pct == null ? undefined : Number(c.margin_pct) }]));

  // Paneller paletle satılır; adet fiyatı palet fiyatı / adet.
  const panels = products
    .filter((p) => p.category === "gunes-panelleri")
    .map((p) => {
      const wp = Number(p.name.match(/(\d{3})\s*W/)?.[1]);
      const count = Number(p.name.match(/\((\d+)\s*Adet\)/i)?.[1]) || 1;
      const c = costs.get(p.slug);
      return { name: p.name.replace(/\s*—.*$/, "").replace(/\s*\(.*\)$/, ""), wp, price: p.price ? Math.round(p.price / count) : undefined, slug: p.slug, lengthM: wp >= 600 ? 2.382 : 2.279, widthM: 1.134, costUsd: c?.costUsd != null ? c.costUsd / count : undefined, marginPct: c?.marginPct };
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

  // Anahtar teslim fiyat karşılaştırması için on grid paketleri (TL/kW).
  const packages = products
    .filter((p) => p.category === "on-grid-paketler" && p.price)
    .map((p) => ({ kw: kwOf(p), price: p.price! }))
    .filter((p) => p.kw > 0);

  return (
    <Studio
      panels={panels}
      inverters={inverters}
      batteries={batteries}
      packages={packages}
      company={{ name: site.name, phone: site.contact.phoneDisplay, email: site.contact.email, address: site.contact.addressLine, web: SITE_URL.replace(/^https?:\/\//, "") }}
      initialCalcId={sp.calc ? Number(sp.calc) : undefined}
      initialId={sp.id ? Number(sp.id) : undefined}
    />
  );
}
