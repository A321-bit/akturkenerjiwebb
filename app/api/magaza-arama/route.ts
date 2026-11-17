import { getStoreCategories, getStoreProducts } from "@/lib/store-data";

// Mağaza arama kutusunun verisi. Eskiden her mağaza sayfasına gömülüydü (~128 KB, sayfa
// verisinin %70'i) ve her sayfa üretiminde ISR yazım kotası harcıyordu; artık arama kutusu
// ilk kullanıldığında bir kez indirilir. Günde bir yenilenir.
export const revalidate = 86400;

export async function GET() {
  const [categories, products] = await Promise.all([getStoreCategories(), getStoreProducts()]);
  return Response.json({
    categories: categories.map((c) => ({ slug: c.slug, name: c.name })),
    products: products.map((p) => ({
      slug: p.slug,
      category: p.category,
      name: p.name,
      power: p.power,
      price: p.price,
      // Arama sonucunda "… TL'den başlayan" yazabilmek için yalnızca seçenek sayısı kadar boş kayıt.
      options: p.options.map(() => ({ label: "" })),
      image: p.image,
    })),
  });
}
