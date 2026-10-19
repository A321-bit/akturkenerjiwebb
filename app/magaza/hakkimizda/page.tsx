import type { Metadata } from "next";
import Link from "next/link";
import { FileText, PackageCheck, ShieldCheck, Tags } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { getGoogleReviews } from "@/lib/google-reviews";
import { CategoryTiles, HowToOrder } from "@/components/store/StoreSections";
import { getStoreCategories, getStoreProducts, getStoreSettings } from "@/lib/store-data";
import { priceNoteText } from "@/lib/store";
import MdxContent from "@/components/MdxContent";

// Mağaza hakkında: kurumsal "Hakkımızda" sayfasından farklı olarak firmayı değil
// mağazayı anlatır (paketler nasıl hazırlanır, neler satılır, nasıl alınır).
export const metadata: Metadata = {
  ...buildMetadata({
    title: "Mağaza Hakkında: Hazır Güneş Enerjisi Paketleri",
    description:
      "Aktürk Enerji Mağaza: sahada denenmiş ürünlerden hazırlanan, içeriği ve fiyatı açık güneş enerjisi paketleri. WhatsApp'tan sipariş, Türkiye geneline gönderim.",
    path: "/magaza/hakkimizda",
  }),
};

const PRINCIPLES = [
  {
    icon: PackageCheck,
    title: "Sahada denenmiş eşleşmeler",
    text: "Paketlerdeki panel, invertör, batarya ve montaj malzemelerini, kurduğumuz sistemlerde birlikte sorunsuz çalıştığını gördüğümüz ürünlerden seçiyoruz.",
  },
  {
    icon: Tags,
    title: "Açık fiyat",
    text: "Her paketin fiyatı ürün sayfasında KDV dahil yazar. Fiyatlar döviz kuruna bağlı olduğu için güncel kurla otomatik güncellenir.",
  },
  {
    icon: FileText,
    title: "İçeriği belli paketler",
    text: "Paketin içinde hangi malzemenin kaç adet olduğunu ve teknik datasheet dosyasını ürün sayfasında görürsünüz; sürpriz kalem çıkmaz.",
  },
  {
    icon: ShieldCheck,
    title: "Garantili ürünler",
    text: "Paketlerdeki ürünler üretici garantisiyle gönderilir; kurulum ve kullanımda destek veriyoruz.",
  },
];

export default async function StoreAboutPage() {
  const [google, store, categories, products] = await Promise.all([
    getGoogleReviews(),
    getStoreSettings(),
    getStoreCategories(),
    getStoreProducts(),
  ]);
  const filled = categories.filter((c) => products.some((p) => p.category === c.slug));
  const stats = [
    { value: String(products.length), label: "Hazır paket" },
    { value: String(filled.length), label: "Ürün kategorisi" },
    ...(google
      ? [{ value: google.rating.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }), label: `Google puanı (${google.count} yorum)` }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-12">
      <section className="max-w-3xl">
        <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Mağaza Hakkında</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {store.aboutTitle || "Hazır güneş enerjisi paketleri, açık fiyatla"}
        </h1>
        {store.aboutContent && (
          <div className="prose prose-neutral mt-5 max-w-none prose-headings:font-display prose-headings:font-semibold prose-a:text-brand prose-p:text-[16px] prose-p:leading-relaxed prose-p:text-slate prose-li:text-slate">
            <MdxContent source={store.aboutContent} />
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-6 rounded-2xl border border-line bg-paper-raised p-6 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="font-display text-2xl font-semibold text-ink">{s.value}</p>
            <p className="mt-1 text-[13px] text-slate">{s.label}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">Paketlerimizi nasıl hazırlıyoruz?</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {PRINCIPLES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 rounded-2xl border border-line bg-paper-raised p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sun/15 text-ink">
                <Icon size={20} />
              </span>
              <div>
                <p className="font-display text-[16px] font-semibold text-ink">{title}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-slate">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">Mağazada neler var?</h2>
        <p className="mt-1 text-[14px] text-slate">Şebekeli evden tarlaya, fabrikadan bağ evine kadar ihtiyaca göre gruplanmış paketler.</p>
        <div className="mt-5">
          <CategoryTiles categories={filled} />
        </div>
      </section>

      <HowToOrder steps={store.orderSteps} note={priceNoteText(store)} />

      <div className="flex flex-wrap gap-3">
        <Link href="/magaza" className="rounded-full bg-ink px-5 py-3 text-[14.5px] font-semibold text-paper hover:bg-sun hover:text-ink">
          Paketlere göz atın
        </Link>
        <Link href="/magaza/iletisim" className="rounded-full border border-line px-5 py-3 text-[14.5px] font-semibold text-ink hover:border-ink">
          Sipariş hattı
        </Link>
      </div>
    </div>
  );
}
