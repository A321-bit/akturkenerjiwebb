import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BatteryCharging, ClipboardCheck, Droplets, FileText, Flame, MapPin, PhoneCall, Sun, Thermometer, Zap } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { TARIFE_TARIHI } from "@/lib/elektrik-tarife";

// Hesaplama araçları ana sayfası: tüm hesaplayıcılar, nasıl çalıştıkları ve dayandıkları veriler.
// Onay sürecinde arama motorlarına kapalı; yayına alınınca robots satırı kaldırılır.
export const metadata: Metadata = {
  ...buildMetadata({
    title: "Güneş Enerjisi ve Isı Pompası Hesaplama Araçları",
    description:
      "Güneş paneli, ısı pompası, güneş enerjili tarımsal sulama ve off grid sistem hesaplayıcıları. Gerçek tarife, uydu güneş verisi ve güncel fiyatlarla ücretsiz ön fizibilite raporu.",
    path: "/hesaplama",
  }),
  robots: { index: false, follow: false },
};

const ARACLAR = [
  {
    href: "/hesaplama/on-grid",
    icon: Sun,
    renk: "bg-sun/15 text-sun-soft",
    etiket: "Ev, işyeri, fabrika",
    baslik: "Güneş paneli (on grid) hesaplama",
    aciklama: "Elektrik faturanız ve çatınızla kaç kW güneş sistemi gerektiğini, faturanızın ne kadar düşeceğini ve yatırımın kaç yılda geri döneceğini hesaplayın.",
    cikti: ["Sistem gücü ve panel sayısı", "Aylık üretim ve tüketim dengesi", "Yıllık tasarruf ve geri ödeme"],
  },
  {
    href: "/hesaplama/isi-pompasi",
    icon: Flame,
    renk: "bg-red-500/10 text-red-600",
    etiket: "Isıtma ve sıcak su",
    baslik: "Isı pompası hesaplama",
    aciklama: "Evinizin alanı, yalıtımı ve tesisatına göre kaç kW ısı pompası gerektiğini; doğalgaz, motorin ya da elektrikle bugünkü giderinizi ısı pompasıyla karşılaştırın.",
    cikti: ["Cihaz gücü ve mevsimsel verim (SCOP)", "Aylık ısınma gideri karşılaştırması", "Güneş enerjisiyle birlikte senaryosu"],
  },
  {
    href: "/hesaplama/tarimsal-sulama",
    icon: Droplets,
    renk: "bg-[#3f74c4]/10 text-[#3f74c4]",
    etiket: "Çiftçi ve üretici",
    baslik: "Güneş enerjili sulama hesaplama",
    aciklama: "Ürününüz, arazi büyüklüğünüz, sulama yönteminiz ve kuyu derinliğinize göre gereken pompa gücünü, panel sistemini ve mazot tasarrufunu hesaplayın.",
    cikti: ["Pompa gücü (HP) ve güneş sistemi", "Aylık su ihtiyacı ve güneşle karşılama", "Mazot ya da elektrik tasarrufu"],
  },
  {
    href: "/magaza/off-grid-hesaplama",
    icon: BatteryCharging,
    renk: "bg-volt/10 text-volt",
    etiket: "Şebekesiz yerler",
    baslik: "Off grid (bataryalı) sistem hesaplama",
    aciklama: "Bağ evi, yayla evi, konteyner ya da şebekenin olmadığı her yer için kullandığınız cihazlara göre panel, akü ve inverter ihtiyacınızı belirleyin.",
    cikti: ["Günlük enerji ihtiyacı", "Akü kapasitesi ve inverter gücü", "Uygun off grid paket"],
  },
];

const ADIMLAR = [
  { icon: ClipboardCheck, baslik: "Bilgilerinizi girin", metin: "Fatura, bina ya da arazi bilgileriniz ve bulunduğunuz il. Bilmediğiniz alanları boş bırakabilirsiniz." },
  { icon: FileText, baslik: "Raporunuzu açın", metin: "Ücretsiz ön fizibilite raporunuz; sistem gücü, aylık grafikler, tasarruf ve geri ödeme süresiyle hazırlanır." },
  { icon: PhoneCall, baslik: "Mühendisimiz sizi arasın", metin: "Raporunuzu inceleyen mühendisimiz sizi arar, yerinde ücretsiz keşif yapar ve kesin teklifinizi hazırlar." },
];

const VERILER = [
  { icon: Zap, baslik: "EPDK elektrik tarifesi", metin: `${TARIFE_TARIHI} tarihli resmi tarife; kademe, dağıtım bedeli, tüketim vergisi ve KDV dahil fatura birebir hesaplanır.` },
  { icon: Sun, baslik: "Uydu tabanlı güneş verisi", metin: "Avrupa Komisyonu Ortak Araştırma Merkezi'nin PVGIS veritabanından, seçtiğiniz konuma ve çatı yönüne özel aylık üretim." },
  { icon: Thermometer, baslik: "Saatlik sıcaklık verisi", metin: "Isı pompası hesabında bölgenizin tipik yılına ait 8.760 saatlik sıcaklık; ısı ihtiyacı ve cihaz verimi saat saat hesaplanır." },
  { icon: MapPin, baslik: "Güncel paket fiyatları", metin: "Önerilen paket ve fiyatı mağazamızdaki güncel listeden gelir; geri ödeme süresi gerçek fiyatla hesaplanır." },
];

const SSS = [
  {
    s: "Hesaplama ücretli mi?",
    c: "Hayır. Hesaplayıcılar ve ön fizibilite raporu tamamen ücretsizdir. Raporunuzu görmek için adınızı ve telefonunuzu bırakmanız yeterli; mühendisimiz sizi arayıp keşif için gün planlar.",
  },
  {
    s: "Sonuçlar ne kadar doğru?",
    c: "Rapor gerçek tarife, konumunuza özel güneş ve iklim verisiyle hazırlanır; ancak bir ön fizibilitedir. Çatının gölgelenmesi, kuyu testi ya da binanın gerçek ısı kaybı gibi ayrıntılar yerinde keşifte ölçülür ve kesin teklif buna göre verilir.",
  },
  {
    s: "Neden il ya da konum soruyorsunuz?",
    c: "Güneşlenme ve sıcaklık bölgeden bölgeye ciddi fark gösterir. Aynı sistem Antalya'da Ardahan'a göre belirgin şekilde fazla üretir. Konumunuzu haritada işaretlemek isteğe bağlıdır; il seçmeniz yeterlidir.",
  },
  {
    s: "Bilgilerim nerede kullanılır?",
    c: "Bilgileriniz raporunuzun hazırlanması, size dönüş yapılması ve teklif süreci için işlenir. Hangi verilerin hangi amaçla işlendiği KVKK aydınlatma metnimizde yer alır.",
  },
];

export default function HesaplamaPage() {
  return (
    <main className="bg-paper">
      <section className="border-b border-line bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="font-mono-data text-[12px] uppercase tracking-[0.18em] text-sun">Hesaplama araçları</p>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight sm:text-[44px]">Yatırım yapmadan önce, rakamları kendi verinizle görün</h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-paper/75">
            Güneş paneli, ısı pompası ve güneş enerjili sulama için mühendislik hesabına dayanan ücretsiz araçlar. Birkaç dakikada sisteminizin gücünü, aylık üretim ve tüketim dengesini, yıllık tasarrufu ve geri ödeme süresini içeren ön fizibilite raporunuzu alın.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-[13.5px] text-paper/70">
            <span className="flex items-center gap-2"><Zap size={16} className="text-sun" /> EPDK güncel tarifesi</span>
            <span className="flex items-center gap-2"><Sun size={16} className="text-sun" /> Konuma özel uydu güneş verisi</span>
            <span className="flex items-center gap-2"><PhoneCall size={16} className="text-sun" /> Mühendis değerlendirmesi ücretsiz</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">Ne hesaplamak istiyorsunuz?</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {ARACLAR.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group flex flex-col rounded-3xl border border-line bg-paper-raised p-6 shadow-[0_24px_60px_-48px_rgba(14,22,38,0.4)] transition hover:-translate-y-0.5 hover:border-brand sm:p-7"
            >
              <div className="flex items-center gap-3">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${a.renk}`}>
                  <a.icon size={24} />
                </span>
                <span className="text-[12.5px] font-semibold uppercase tracking-wide text-slate">{a.etiket}</span>
              </div>
              <h3 className="mt-5 font-display text-[21px] font-semibold tracking-tight text-ink">{a.baslik}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-slate">{a.aciklama}</p>
              <ul className="mt-4 space-y-1.5 text-[13.5px] text-ink">
                {a.cikti.map((c) => (
                  <li key={c} className="flex items-start gap-2">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /> {c}
                  </li>
                ))}
              </ul>
              <span className="mt-6 inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-brand">
                Hesaplamaya başla <ArrowRight size={16} className="transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-paper-raised">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">Nasıl çalışır?</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {ADIMLAR.map((a, i) => (
              <li key={a.baslik} className="rounded-2xl border border-line bg-paper p-6">
                <div className="flex items-center gap-3">
                  <span className="font-mono-data text-[13px] font-bold text-brand">0{i + 1}</span>
                  <a.icon size={20} className="text-ink" />
                </div>
                <h3 className="mt-3 font-semibold text-ink">{a.baslik}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-slate">{a.metin}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">Hesaplarımız neye dayanır?</h2>
        <p className="mt-2 max-w-2xl text-[15px] text-slate">Tahmini ortalamalar yerine resmi tarife ve konumunuza özel ölçülmüş verilerle çalışırız.</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VERILER.map((v) => (
            <div key={v.baslik} className="rounded-2xl border border-line bg-paper-raised p-5">
              <v.icon size={22} className="text-brand" />
              <h3 className="mt-3 font-semibold text-ink">{v.baslik}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate">{v.metin}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-paper-raised">
        <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">Sık sorulan sorular</h2>
          <div className="mt-6 divide-y divide-line rounded-2xl border border-line bg-paper">
            {SSS.map((q) => (
              <details key={q.s} className="group p-5">
                <summary className="cursor-pointer list-none font-semibold text-ink marker:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {q.s}
                    <span className="text-brand transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-[14.5px] leading-relaxed text-slate">{q.c}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-[13.5px] text-slate">
            Hesaplama yerine doğrudan konuşmak isterseniz{" "}
            <Link href="/teklif-al" className="font-semibold text-brand hover:underline">
              teklif formunu
            </Link>{" "}
            doldurabilir ya da sağ alttaki düğmelerle bize ulaşabilirsiniz.
          </p>
        </div>
      </section>
    </main>
  );
}
