import { ChevronDown } from "lucide-react";

// Mağaza SSS. Ödeme, garanti ve gönderim gibi kesin koşullar netleşince
// cevaplar güncellenecek; şimdilik sipariş görüşmesine yönlendiriyor.
const FAQS = [
  {
    q: "Siparişimi nasıl veririm?",
    a: "Ürün kartındaki \"WhatsApp'tan Sipariş\" butonuna basın; ürün adı ve fiyatı mesaja otomatik eklenir. Uzmanımız sizi arayarak sistemin evinize uygunluğunu kontrol eder ve siparişinizi kesinleştirir.",
  },
  {
    q: "Fiyatlara KDV dahil mi?",
    a: "Evet, mağazadaki fiyatlar KDV dahildir. Fiyatlar döviz kuruna bağlı olarak güncellenebilir; geçerli fiyatı sipariş görüşmesinde yazılı olarak teyit ediyoruz.",
  },
  {
    q: "Kurulum fiyata dahil mi?",
    a: "Kurulumlu paketlerde proje, EDAŞ başvurusu, montaj ve devreye alma fiyata dahildir. Kurulumsuz paketlerde kurulum ve kullanım konusunda destek veriyoruz.",
  },
  {
    q: "Kurulum ne kadar sürer?",
    a: "Çatıdaki montaj ev sistemlerinde genellikle 1–3 gün sürer. Şebeke bağlantılı sistemlerde EDAŞ onay süreciyle birlikte toplam süre çoğunlukla 3–6 aydır; şebekesiz (off grid) sistemler ise çok daha kısa sürede devreye alınır.",
  },
  {
    q: "Ürünler garantili mi?",
    a: "Paketlerimizdeki tüm ürünler üretici garantilidir. Garanti süreleri ürüne ve markaya göre değişir; sipariş öncesi size yazılı olarak bildiriyoruz.",
  },
  {
    q: "Hangi bölgelere hizmet veriyorsunuz?",
    a: "Ankara merkezliyiz ve kurulumlu paketleri ağırlıklı olarak Ankara ve çevresinde kuruyoruz. Farklı illerdeki projeleriniz için WhatsApp sipariş hattımızdan bilgi alabilirsiniz.",
  },
  {
    q: "Ödeme seçenekleri nelerdir?",
    a: "Ödeme seçeneklerini sipariş görüşmesinde sizinle paylaşıyoruz.",
  },
];

export default function StoreFaq() {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">Sık sorulan sorular</h2>
      <div className="mt-4 flex flex-col gap-3">
        {FAQS.map((f) => (
          <details key={f.q} className="group rounded-2xl border border-line bg-paper-raised px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-semibold text-ink">
              {f.q}
              <ChevronDown size={18} className="shrink-0 text-brand transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-[14px] leading-relaxed text-slate">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
