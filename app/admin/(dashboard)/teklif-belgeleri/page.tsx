import { getReferences } from "@/lib/data";
import { getStoreProducts } from "@/lib/store-data";
import DocumentAssets, { type DocProduct } from "@/components/admin/teklif/DocumentAssets";

// Teklif PDF'ine girecek belgeler. Ürün listesi Teklif Stüdyosu'nun seçeneklerini izler.

export default async function TeklifBelgeleriPage() {
  const [products, references] = await Promise.all([getStoreProducts(), getReferences()]);
  const list: DocProduct[] = products.flatMap((p): DocProduct[] => {
    if (p.category === "gunes-panelleri" && /\d{3}\s*W/.test(p.name)) return [{ slug: p.slug, name: p.name, group: "Panel" }];
    if (p.category === "inverter" && /on grid|hibrit/i.test(p.name) && !/off grid/i.test(p.name)) return [{ slug: p.slug, name: p.name, group: "İnvertör" }];
    if (p.category === "lityum-batarya-ve-setleri" && /[\d,.]+\s*kWh/i.test(p.name)) return [{ slug: p.slug, name: p.name, group: "Batarya" }];
    return [];
  });
  return (
    <div>
      <h1 className="font-display text-[26px] font-semibold">Teklif Belgeleri</h1>
      <p className="mt-1 text-[14px] text-slate">Müşteriye giden PDF&apos;in datasheet&apos;leri, referansları, şartları ve banka bilgileri.</p>
      <DocumentAssets products={list} projects={references.flatMap((r) => (r.id == null ? [] : [{ id: r.id, title: r.title, location: r.location, image: r.image }]))} />
    </div>
  );
}
