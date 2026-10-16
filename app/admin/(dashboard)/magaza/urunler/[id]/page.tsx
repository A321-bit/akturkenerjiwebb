import { notFound } from "next/navigation";
import { adminClient } from "@/lib/data";
import ProductForm, { type ProductFormValues } from "@/components/admin/store/ProductForm";
import { getPricingSettings } from "@/lib/store-pricing";

/** Son 30 günde uygulanan en düşük satış fiyatı (30 gün önce geçerli olan dahil). */
async function lowestPriceLast30Days(productId: string): Promise<number | null> {
  const db = adminClient();
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const [inside, before] = await Promise.all([
    db.from("store_price_history").select("price").eq("product_id", productId).gte("recorded_at", since),
    db
      .from("store_price_history")
      .select("price")
      .eq("product_id", productId)
      .lt("recorded_at", since)
      .order("recorded_at", { ascending: false })
      .limit(1),
  ]);
  const prices = [...(inside.data ?? []), ...(before.data ?? [])].map((r: { price: number }) => r.price);
  return prices.length ? Math.min(...prices) : null;
}

export default async function EditStoreProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = adminClient();
  const isNew = id === "yeni";
  const [productRes, categoriesRes, lowest30, pricing] = await Promise.all([
    isNew ? Promise.resolve({ data: null }) : db.from("store_products").select("*").eq("id", id).single(),
    db.from("store_categories").select("slug, name, margin_pct, list_margin_pct").order("sort_order"),
    isNew ? Promise.resolve(null) : lowestPriceLast30Days(id),
    getPricingSettings(db),
  ]);
  const data = productRes.data;
  if (!isNew && !data) notFound();

  const initial: ProductFormValues = data
    ? {
        id: data.id,
        slug: data.slug,
        category: data.category,
        name: data.name,
        power: data.power ?? "",
        price: data.price,
        list_price: data.list_price,
        price_usd: data.price_usd != null ? Number(data.price_usd) : null,
        list_price_usd: data.list_price_usd != null ? Number(data.list_price_usd) : null,
        install_included: data.install_included,
        image: data.image,
        gallery: data.gallery ?? [],
        contents: data.contents ?? [],
        content: data.content ?? "",
        datasheet: data.datasheet,
        featured: data.featured,
        active: data.active,
        sort_order: data.sort_order,
        seo_title: data.seo_title ?? "",
        seo_description: data.seo_description ?? "",
        cost_usd: data.cost_usd != null ? Number(data.cost_usd) : null,
        bom: Array.isArray(data.bom) ? data.bom : [],
        margin_pct: data.margin_pct != null ? Number(data.margin_pct) : null,
        list_margin_pct: data.list_margin_pct != null ? Number(data.list_margin_pct) : null,
      }
    : {
        slug: "",
        category: "",
        name: "",
        power: "",
        price: null,
        list_price: null,
        price_usd: null,
        list_price_usd: null,
        install_included: false,
        image: null,
        gallery: [],
        contents: [],
        content: "",
        datasheet: null,
        featured: false,
        active: true,
        sort_order: 100,
        seo_title: "",
        seo_description: "",
        cost_usd: null,
        bom: [],
        margin_pct: null,
        list_margin_pct: null,
      };

  return (
    <div>
      <h2 className="mb-4 font-display text-xl font-semibold">{isNew ? "Yeni ürün" : data.name}</h2>
      <ProductForm
        initial={initial}
        categories={categoriesRes.data ?? []}
        categoryMargins={Object.fromEntries((categoriesRes.data ?? []).map((c) => [
            c.slug,
            { margin: c.margin_pct != null ? Number(c.margin_pct) : null, list: c.list_margin_pct != null ? Number(c.list_margin_pct) : null },
          ]))}
        lowest30={lowest30}
        pricing={pricing}
      />
    </div>
  );
}
