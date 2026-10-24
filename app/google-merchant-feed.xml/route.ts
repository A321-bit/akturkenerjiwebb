import { SITE_URL } from "@/lib/data";
import { getStoreCategories, getStoreProducts } from "@/lib/store-data";
import { productBrand, productGallery, productHref } from "@/lib/store-details";

// Google Merchant Center ürün feed'i (Google Alışveriş + Performance Max).
// Yalnızca fiyatı olan aktif ürünler girer. Üstü çizili liste fiyatı
// gönderilmez: Merchant Center indirimli fiyat için gerçek bir önceki satış
// fiyatı istiyor, bizde liste fiyatı kampanya göstergesi.
export const dynamic = "force-static";
export const revalidate = 86400;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const plain = (md: string) => md.replace(/[*_#>`]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " ").trim();

export async function GET() {
  const [products, categories] = await Promise.all([getStoreProducts(), getStoreCategories()]);
  const catName = new Map(categories.map((c) => [c.slug, c.name]));

  const items = products
    .filter((p) => p.price && p.image)
    .map((p) => {
      const images = productGallery(p);
      const desc = plain([p.seoDescription, p.contents.join(". ")].filter(Boolean).join(" ")).slice(0, 4900);
      return `<item>
<g:id>${p.id}</g:id>
<g:title>${esc(p.name.slice(0, 150))}</g:title>
<g:description>${esc(desc)}</g:description>
<g:link>${SITE_URL}${productHref(p)}</g:link>
<g:image_link>${esc(images[0])}</g:image_link>
${images.slice(1, 10).map((u) => `<g:additional_image_link>${esc(u)}</g:additional_image_link>`).join("\n")}
<g:availability>in_stock</g:availability>
<g:price>${p.price}.00 TRY</g:price>
<g:brand>${esc(productBrand(p))}</g:brand>
<g:condition>new</g:condition>
<g:identifier_exists>no</g:identifier_exists>
<g:product_type>${esc(catName.get(p.category) ?? p.category)}</g:product_type>
<g:custom_label_0>${esc(p.category)}</g:custom_label_0>
</item>`;
    });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>Aktürk Enerji Mağaza</title>
<link>${SITE_URL}/magaza</link>
<description>Güneş enerjisi paketleri ve ürünleri</description>
${items.join("\n")}
</channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
