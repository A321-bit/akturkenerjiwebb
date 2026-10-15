import { getSiteSettings } from "@/lib/data";
import { getStoreCategories, getStoreProducts, getStoreSettings } from "@/lib/store-data";
import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import StoreSidebar from "@/components/store/StoreSidebar";
import StoreShell from "@/components/store/StoreShell";

// Mağaza, sitenin altında ama ayrı bir e-ticaret sitesi gibi çalışır: sitenin
// genel üst menüsü ve sayfa altı burada gizlenir, yerine mağazanınkiler gelir.
export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [site, categories, products, store] = await Promise.all([
    getSiteSettings(),
    getStoreCategories(),
    getStoreProducts(),
    getStoreSettings(),
  ]);

  const searchData = {
    categories: categories.map((c) => ({ slug: c.slug, name: c.name })),
    products: products.map((p) => ({
      slug: p.slug,
      category: p.category,
      name: p.name,
      power: p.power,
      price: p.price,
      image: p.image,
    })),
  };
  const sidebar = categories.map((c) => ({
    slug: c.slug,
    name: c.name,
    icon: c.icon,
    count: products.filter((p) => p.category === c.slug).length,
  }));

  return (
    <>
      <StoreHeader
        whatsappNumber={site.contact.whatsappNumber}
        phoneHref={site.contact.phoneHref}
        phoneDisplay={site.contact.phoneDisplay}
        searchData={searchData}
      />
      <StoreShell sidebar={<StoreSidebar categories={sidebar} />}>{children}</StoreShell>
      <StoreFooter settings={site} categories={categories} text={store.footerText} />
    </>
  );
}
