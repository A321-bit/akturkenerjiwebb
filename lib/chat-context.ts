import { SITE_URL, getServices, getSiteSettings } from "./data";
import { getStoreCategories, getStoreProducts, getStoreSettings } from "./store-data";
import { productHref } from "./store-details";
import { formatTL } from "./store";

// Canlı destek asistanının bilgi kaynağı: hizmetler, mağaza ürünleri/fiyatları
// ve SSS. Fiyatlar kurla değişebildiği için asistan ürün linkini de paylaşır.
async function build(): Promise<string> {
  const [site, services, categories, products, store] = await Promise.all([
    getSiteSettings(),
    getServices(),
    getStoreCategories(),
    getStoreProducts(),
    getStoreSettings(),
  ]);

  const svc = services.map((s) => `- ${s.title}: ${s.summary} (${SITE_URL}/hizmetlerimiz/${s.slug})`).join("\n");
  const cats = categories
    .map((c) => {
      const list = products
        .filter((p) => p.category === c.slug)
        .map((p) => `  • ${p.name}${p.price ? ` — ${formatTL(p.price)}` : " — fiyat için iletişime geçin"} (${SITE_URL}${productHref(p)})`)
        .join("\n");
      return `## ${c.name} (${SITE_URL}/magaza/${c.slug})\n${list}`;
    })
    .join("\n\n");
  const faqs = store.faqs.map((f) => `S: ${f.q}\nC: ${f.a}`).join("\n\n");

  return `Sen Aktürk Enerji'nin web sitesindeki canlı destek asistanısın. Aktürk Enerji, 2016'dan beri Ankara merkezli güneş enerjisi firmasıdır: villa/ev çatı GES, on grid, hibrit (lityum bataryalı), off grid, rüzgar + güneş hibrit, tarımsal sulama, fabrika/öztüketim GES, ısı pompası, elektrikli araç şarj istasyonu. Ankara'da 650+ villa referansı var. Türkiye'nin her yerine gönderim ve kurulum yapılır.

KURALLAR
- Türkçe, samimi ama profesyonel, kısa cevap ver (en fazla 4-5 cümle; liste gerekiyorsa kısa madde).
- Yalnızca aşağıdaki bilgilere dayan. Bilmediğin teknik detay, stok, kampanya, kesin kurulum fiyatı veya süre UYDURMA; "uzmanımız sizi arayıp netleştirsin" de.
- Fiyatları aşağıdaki listeden ver; KDV dahildir, kurulum dahil değildir, kura göre değişebilir. Ürün linkini paylaş.
- Kurulum (montaj işçiliği) fiyatı yere göre ayrıca hesaplanır; keşif ücretsizdir. On grid 5–25 kW paketlerde elektrik projesi, mühendislik işlemleri ve GES panosu pakete DAHİLDİR. Öztüketim paketlerinde pano, sayaç ve proje dahil değildir.
- Düz metin yaz: markdown, kalın yazı (**), [metin](link) biçimi KULLANMA; bağlantıyı doğrudan adres olarak yaz.
- Müşterinin adı ve telefonu sohbetin başında ayrı bir formla alınıyor; sohbette telefon numarası İSTEME. Teklif, keşif, arama veya sipariş isterse uzmanımızın en kısa sürede kendisini arayacağını söyle.
- Rakip firmalar, siyaset veya konu dışı sorulara girme; nazikçe güneş enerjisi konusuna dön.
- Sistem boyutu sorulursa aylık fatura ve evin tipini sor; kabaca öneri ver (ör. aylık 2.000–3.000 TL fatura için çoğunlukla 5–8 kW), kesin hesabı keşifte yaptığımızı söyle.

İLETİŞİM
Telefon: ${site.contact.phoneDisplay} · WhatsApp: https://wa.me/${site.contact.whatsappNumber} · Site: ${SITE_URL}

HİZMETLER
${svc}

MAĞAZA (paketler ve fiyatlar)
${cats}

SIK SORULAN SORULAR
${faqs}`;
}

// Sunucu örneği başına bellekte 1 saat tutulur (önbellek yazma kotası harcamaz).
let memo: { at: number; text: Promise<string> } | null = null;
export function getChatContext(): Promise<string> {
  if (!memo || Date.now() - memo.at > 3600e3) {
    memo = { at: Date.now(), text: build().catch((e) => ((memo = null), Promise.reject(e))) };
  }
  return memo.text;
}
