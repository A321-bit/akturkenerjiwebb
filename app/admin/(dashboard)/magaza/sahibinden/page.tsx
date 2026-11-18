import { SITE_URL, adminClient, getSiteSettings } from "@/lib/data";
import { formatTL } from "@/lib/store";
import { getPricingSettings, usdToTl } from "@/lib/store-pricing";
import { getStoreCategories, getStoreProducts } from "@/lib/store-data";
import { buildListing, buildListingHtml } from "@/lib/listing";
import SahibindenListings, { type ListingItem } from "@/components/admin/store/SahibindenListings";

// Sahibinden.com ilan metinleri: her paket için başlık, açıklama ve fiyat hazır;
// kopyala-yapıştır ile ilan verilir.
export const dynamic = "force-dynamic";

// İlan metinleri Paket Oluştur'daki "Sahibinden ilanı" alanından gelir (kısa açıklama; ilan sırası = ORDER).
// Kasım 2026 turu: 2 on grid, 3 hibrit, 3 off grid (Exelon), 2 rüzgâr + güneş. Başlıklar inverter gücüyle başlar.
const ORDER = [10, 16, 2, 14, 11, 17, 13, 15, 12, 7];
const PICKS: string[] = [];
const TITLES: Record<string, string> = {};

/** Paket Oluştur'da sahibinden başlığı/açıklaması yazılmış paketler (listenin en başında). */
async function packageListings(products: Awaited<ReturnType<typeof getStoreProducts>>): Promise<ListingItem[]> {
  const db = adminClient();
  const [{ data }, pricing] = await Promise.all([
    db.from("product_packages").select("id, name, product_id, sale_usd, listing_title, listing_text").or("listing_title.not.is.null,listing_text.not.is.null").order("id"),
    getPricingSettings(db),
  ]);
  return ((data ?? []) as { id: number; name: string; product_id: number | null; sale_usd: number | null; listing_title: string | null; listing_text: string | null }[]).map((p, i) => {
    const linked = p.product_id ? products.find((x) => x.id === p.product_id) : undefined;
    const tl = linked?.price ?? (p.sale_usd != null ? usdToTl(Number(p.sale_usd), pricing) : null);
    const text = p.listing_text ?? "";
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const html = [
      `<p style="text-align:center"><img src="${SITE_URL}/akturk-enerji-sahibinden.jpg" alt="Aktürk Enerji" width="685" style="max-width:100%;height:auto" /></p>`,
      ...text.split("\n").map((l) => (l.trim() ? `<p><span style="font-family:'roboto',sans-serif;font-size:11pt">${esc(l)}</span></p>` : "<p>&nbsp;</p>")),
    ].join("");
    return { slug: `paket-${p.id}`, name: p.name, category: "Paket Oluştur", pick: ORDER.indexOf(p.id) < 0 ? 40 + i : ORDER.indexOf(p.id), title: p.listing_title ?? p.name, description: text, price: tl != null ? formatTL(tl) : "Satış fiyatı girilmemiş", html };
  });
}

export default async function SahibindenPage() {
  const [site, products, categories] = await Promise.all([getSiteSettings(), getStoreProducts(), getStoreCategories()]);
  const pkgItems = await packageListings(products);
  const items: ListingItem[] = products
    .map((p) => {
      const cat = categories.find((c) => c.slug === p.category);
      return cat ? { slug: p.slug, name: p.name, category: cat.name, pick: PICKS.indexOf(p.slug) < 0 ? -1 : 50 + PICKS.indexOf(p.slug), ...buildListing(p, cat, site), ...(TITLES[p.slug] ? { title: TITLES[p.slug] } : {}), html: buildListingHtml(p, cat, site, SITE_URL) } : null;
    })
    .filter((x): x is ListingItem => x !== null)
    .sort((a, b) => (a.pick < 0 ? 999 : a.pick) - (b.pick < 0 ? 999 : b.pick));
  return <SahibindenListings items={[...pkgItems.sort((a, b) => a.pick - b.pick), ...items]} />;
}
