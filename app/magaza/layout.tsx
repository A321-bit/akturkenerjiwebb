import { getSiteSettings } from "@/lib/data";
import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import StoreSidebar from "@/components/store/StoreSidebar";

// Mağaza, sitenin altında ama ayrı bir e-ticaret sitesi gibi çalışır: sitenin
// genel üst menüsü ve sayfa altı burada gizlenir, yerine mağazanınkiler gelir.
export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const site = await getSiteSettings();
  return (
    <>
      <StoreHeader
        whatsappNumber={site.contact.whatsappNumber}
        phoneHref={site.contact.phoneHref}
        phoneDisplay={site.contact.phoneDisplay}
      />
      {/* Kategori menüsü mağazanın her sayfasında solda ve sayfa kaydıkça
          ekranda kilitli kalır; müşteri her an başka kategoriye geçebilir. */}
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 sm:py-8 lg:grid lg:grid-cols-[260px_1fr] lg:items-start lg:gap-8">
        <div className="mb-6 lg:sticky lg:top-28 lg:mb-0">
          <StoreSidebar />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
      <StoreFooter settings={site} />
    </>
  );
}
