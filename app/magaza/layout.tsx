import { getSiteSettings } from "@/lib/data";
import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";

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
      {children}
      <StoreFooter settings={site} />
    </>
  );
}
