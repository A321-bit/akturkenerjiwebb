import { getSiteSettings } from "@/lib/data";
import { getStoreCategories, getStoreProducts, getStoreSettings } from "@/lib/store-data";
import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import StoreSidebar from "@/components/store/StoreSidebar";

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
      {/* Kategori menüsü mağazanın her sayfasında solda ve sayfa kaydıkça
          ekranda kilitli kalır; müşteri her an başka kategoriye geçebilir. */}
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 sm:py-8 lg:grid lg:grid-cols-[260px_1fr] lg:items-start lg:gap-8">
        <div className="mb-6 lg:sticky lg:top-28 lg:mb-0">
          <StoreSidebar categories={sidebar} />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
      <StoreFooter settings={site} categories={categories} text={store.footerText} />
    </>
  );
}
