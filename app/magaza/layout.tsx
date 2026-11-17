import { getSiteSettings } from "@/lib/data";
import { getStoreCategories, getStoreProducts, getStoreSettings } from "@/lib/store-data";
import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import StoreSidebar from "@/components/store/StoreSidebar";
import StoreShell from "@/components/store/StoreShell";
import { STORE_BRANDS, brandProducts } from "@/lib/store-brands";

// Mağaza, sitenin altında ama ayrı bir e-ticaret sitesi gibi çalışır: sitenin
// genel üst menüsü ve sayfa altı burada gizlenir, yerine mağazanınkiler gelir.
export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [site, categories, products, store] = await Promise.all([
    getSiteSettings(),
    getStoreCategories(),
    getStoreProducts(),
    getStoreSettings(),
  ]);

  const sidebar = categories.map((c) => ({
    slug: c.slug,
    name: c.name,
    icon: c.icon,
    count: products.filter((p) => p.category === c.slug).length,
  }));

  // Sol menüdeki marka bağlantıları: yalnız mağazada ürünü olan markalar.
  const brands = STORE_BRANDS.map((b) => ({ slug: b.slug, name: b.name, count: brandProducts(b, products).length })).filter((b) => b.count > 0);

  return (
    <>
      <StoreHeader
        whatsappNumber={site.contact.whatsappNumber}
        phoneHref={site.contact.phoneHref}
        phoneDisplay={site.contact.phoneDisplay}
      />
      <StoreShell sidebar={<StoreSidebar categories={sidebar} brands={brands} />}>{children}</StoreShell>
      <StoreFooter settings={site} categories={categories} text={store.footerText} />
    </>
  );
}
