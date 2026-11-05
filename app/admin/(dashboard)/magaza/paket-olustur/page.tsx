import { adminClient } from "@/lib/data";
import { currentUser } from "@/lib/admin-guard";
import { permsOf } from "@/lib/staff";
import { getPricingSettings } from "@/lib/store-pricing";
import { COST_ITEM_FIELDS, PACKAGE_FIELDS, type CostItem, type ProductPackage } from "@/lib/package-builder";
import PackageBuilder, { type LinkableProduct } from "@/components/admin/store/PackageBuilder";

// Paket Oluştur: tedarikçi maliyet listesinden paket reçetesi kurulur, toplam maliyet (USD, KDV dahil)
// görülür ve paket bir mağaza ürününe bağlanır.

export default async function PaketOlusturPage() {
  if (!permsOf(await currentUser()).cost) {
    return <p className="rounded-xl border border-line bg-paper-raised p-5 text-[14px] text-slate">Bu sayfa maliyet bilgisi içerir; maliyet yetkiniz yok.</p>;
  }
  const db = adminClient();
  // Supabase tek istekte en çok 1000 satır döndürür; katalog sayfa sayfa okunur.
  const items: CostItem[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await db.from("cost_items").select(COST_ITEM_FIELDS).order("id").range(from, from + 999);
    items.push(...((data ?? []) as CostItem[]));
    if (!data || data.length < 1000) break;
  }
  const [{ data: packages }, { data: products }, { data: cats }, pricing] = await Promise.all([
    db.from("product_packages").select(PACKAGE_FIELDS).order("updated_at", { ascending: false }),
    db.from("store_products").select("id, name, category, cost_usd, margin_pct, price_usd, price, active, options").order("category").order("sort_order"),
    db.from("store_categories").select("slug, name, margin_pct"),
    getPricingSettings(db),
  ]);
  const catMargin = new Map((cats ?? []).map((c) => [c.slug as string, c.margin_pct as number | null]));
  const catName = new Map((cats ?? []).map((c) => [c.slug as string, c.name as string]));
  const linkable: LinkableProduct[] = (products ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    category: catName.get(p.category) ?? p.category,
    active: p.active,
    costUsd: p.cost_usd != null ? Number(p.cost_usd) : null,
    priceUsd: p.price_usd != null ? Number(p.price_usd) : null,
    price: p.price,
    optionCount: Array.isArray(p.options) ? p.options.length : 0,
    margin: p.margin_pct != null ? Number(p.margin_pct) : catMargin.get(p.category) ?? pricing.defaultMargin,
  }));

  return <PackageBuilder initialItems={items} initialPackages={(packages ?? []) as ProductPackage[]} products={linkable} pricing={pricing} />;
}
