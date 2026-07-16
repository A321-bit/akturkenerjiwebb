import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/data";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import AnimatedCounter from "@/components/AnimatedCounter";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = buildMetadata({
  title: "Hakkımızda | Vizyon, Misyon ve İnsan Kaynakları",
  description:
    "2016'dan beri Ankara merkezli faaliyet gösteren Aktürk Enerji Teknolojileri hakkında — hikayemiz, vizyon ve misyonumuz, mühendislik yaklaşımımız ve insan kaynakları politikamız.",
  path: "/hakkimizda",
  keywords: [
    "Aktürk Enerji hakkında",
    "Ankara güneş enerjisi firması",
    "Aktürk Enerji vizyon misyon",
    "Aktürk Enerji insan kaynakları",
    "Ankara",
  ],
});

const jsonLd = {
  "@context": "https://schema.org",
  ...breadcrumbJsonLd([
    { name: "Anasayfa", path: "/" },
    { name: "Hakkımızda", path: "/hakkimizda" },
  ]),
};

const timeline = [
  {
    year: "2016",
    text: "Ankara'da solar enerji sektöründe faaliyete başladık.",
  },
  {
    year: "2018+",
    text: "Villa ve müstakil konut çatı GES projelerinde uzmanlaştık, ilk müteahhit iş birliklerini kurduk.",
  },
  {
    year: "2020+",
    text: "Tarımsal sulama, rüzgar-hibrit ve lityum batarya depolama sistemlerini hizmet yelpazemize ekledik.",
  },
  {
    year: "Günümüz",
    text: "Fabrika çatı GES, elektrikli araç şarj istasyonu ve taahhüt/işletme-bakım hizmetleriyle kurumsal ölçekte büyümeye devam ediyoruz.",
  },
];

const subNav = [
  { href: "#hakkimizda", label: "Hakkımızda" },
  { href: "#vizyon-misyon", label: "Vizyon ve Misyon" },
  { href: "#insan-kaynaklari", label: "İnsan Kaynakları" },
];

export default async function AboutPage() {
  const site = await getSiteSettings();
  const stats = site.stats;

  return (
    <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav
        aria-label="Sayfa içi bölümler"
        className="sticky top-[57px] z-30 -mx-5 mb-10 overflow-x-auto border-b border-line bg-paper/95 px-5 py-3 backdrop-blur sm:top-[73px] sm:-mx-8 sm:px-8"
      >
        <div className="flex w-fit divide-x divide-line overflow-hidden rounded-full border border-line bg-paper-raised">
          {subNav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="shrink-0 px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-brand/10 hover:text-brand"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      {/* HAKKIMIZDA */}
      <section id="hakkimizda" className="scroll-mt-32">
        <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
          Hakkımızda
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {site.foundedYear}&apos;dan beri {site.city}&apos;dan Türkiye geneline
        </h1>
        <p className="mt-5 text-[16px] leading-relaxed text-slate">
          {site.name}, {site.foundedYear} yılından bu yana Ankara merkezli olarak
          solar enerji sektöründe hizmet veriyor. Villa ve müstakil konutlardan{" "}
          <Link href="/hizmetlerimiz/muteahhit-ges" className="font-medium text-brand hover:underline">
            müteahhit projelerine
          </Link>
          ,{" "}
          <Link href="/hizmetlerimiz/tarimsal-sulama" className="font-medium text-brand hover:underline">
            tarımsal sulama sistemlerinden
          </Link>{" "}
          <Link href="/hizmetlerimiz/fabrika-cati-ges" className="font-medium text-brand hover:underline">
            fabrika çatı GES sistemlerine
          </Link>{" "}
          kadar geniş bir yelpazede anahtar teslim güneş enerjisi çözümleri
          sunuyoruz. Keşiften mühendislik başvurularına, kurulumdan satış
          sonrası desteğe kadar sürecin tamamını kendi ekibimizle yürütüyoruz.
        </p>

        <Reveal>
          <div className="mt-10 grid grid-cols-2 gap-6 rounded-2xl border border-line bg-paper-raised p-6 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-mono-data text-lg font-semibold text-ink sm:text-xl">
                  <AnimatedCounter value={s.value} />
                </p>
                <p className="mt-1 text-[12.5px] text-slate">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <h2 className="mt-14 font-display text-2xl font-semibold tracking-tight">
          Yolculuğumuz
        </h2>
        <ol className="mt-6 space-y-6 border-l border-line pl-6">
          {timeline.map((t, i) => (
            <Reveal as="li" key={t.year} delay={i * 80} className="relative">
              <span className="absolute -left-[27px] top-1 h-2.5 w-2.5 rounded-full bg-brand" />
              <p className="font-mono-data text-[12.5px] font-semibold text-brand">{t.year}</p>
              <p className="mt-1 text-[15px] leading-relaxed text-ink">{t.text}</p>
            </Reveal>
          ))}
        </ol>

        <h2 className="mt-14 font-display text-2xl font-semibold tracking-tight">
          Neden Aktürk Enerji
        </h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {[
            {
              title: "Uçtan uca mühendislik",
              text: "Statik hesap, elektrik projesi ve EDAŞ başvurusu dahil tüm süreç kendi mühendislik ekibimizde.",
            },
            {
              title: "Sektörler arası tecrübe",
              text: "Konut ve tarımın yanı sıra savunma sanayi ve telekomünikasyon projelerinde de saha tecrübesi kazandık.",
            },
            {
              title: "Yerel ve erişilebilir",
              text: `${site.city} merkezli olmamız, keşif ve satış sonrası desteğe hızlı erişim sağlıyor.`,
            },
            {
              title: "Tedarik gücü",
              text: "Toptan/perakende tedarik ve distribütörlük ağımızla rekabetçi fiyat ve stok garantisi sunuyoruz.",
            },
          ].map((f, i) => (
            <Reveal key={f.title} delay={i * 60} className="rounded-2xl border border-line bg-paper-raised p-6">
              <h3 className="font-display text-[16px] font-semibold">{f.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-slate">{f.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* VİZYON VE MİSYON */}
      <section id="vizyon-misyon" className="mt-20 scroll-mt-32 border-t border-line pt-16">
        <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
          Vizyon ve Misyon
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Neden var olduğumuz, nereye gittiğimiz
        </h2>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Reveal className="rounded-2xl border border-line bg-paper-raised p-7">
            <h3 className="font-display text-[17px] font-semibold text-ink">Vizyonumuz</h3>
            <p className="mt-3 text-[14.5px] leading-relaxed text-slate">
              Türkiye&apos;de her çatının ve her arazinin kendi enerjisini
              üretebildiği bir geleceğe katkı sağlamak; konuttan tarıma,
              sanayiden telekomünikasyona kadar her ölçekte güvenilir ve
              erişilebilir güneş enerjisi çözümleriyle Ankara merkezli olarak
              Türkiye genelinde tanınan bir mühendislik markası olmak.
            </p>
          </Reveal>
          <Reveal delay={80} className="rounded-2xl border border-line bg-paper-raised p-7">
            <h3 className="font-display text-[17px] font-semibold text-ink">Misyonumuz</h3>
            <p className="mt-3 text-[14.5px] leading-relaxed text-slate">
              Keşiften mühendislik başvurusuna, kurulumdan işletme-bakıma kadar
              sürecin tamamını kendi ekibimizle yürüterek müşterilerimize
              şeffaf, garantili ve uzun ömürlü sistemler sunmak; her projede
              doğru boyutlandırma ve dürüst danışmanlıkla güven inşa etmek.
            </p>
          </Reveal>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { title: "Şeffaflık", text: "Uygun olmayan bir çatıyı veya sistemi zorlamayız; açıkça söyleriz." },
            { title: "Mühendislik disiplini", text: "Her sistem, doğru hesap ve keşif üzerine kurulur — tahmine yer yok." },
            { title: "Uzun vadeli ilişki", text: "İş, devreye almayla bitmez; garanti ve bakım sürecinde de yanınızdayız." },
          ].map((v, i) => (
            <Reveal key={v.title} delay={i * 60} className="rounded-xl border border-line bg-paper p-5">
              <h4 className="font-display text-[14.5px] font-semibold text-ink">{v.title}</h4>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate">{v.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* İNSAN KAYNAKLARI */}
      <section id="insan-kaynaklari" className="mt-20 scroll-mt-32 border-t border-line pt-16">
        <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
          İnsan Kaynakları
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Ekibimize katılın
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate">
          Aktürk Enerji olarak büyümemizin arkasında sahada çalışan mühendislik,
          kurulum ve satış ekibimiz var. Mühendislikten saha ekiplerine kadar
          işini sahiplenen, öğrenmeye açık kişilerle çalışmayı önemsiyoruz;
          yeni projeler açtıkça ekibimizi büyütmeye devam ediyoruz.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {[
            {
              title: "Sahada gerçek deneyim",
              text: "Villa çatısından fabrika kurulumuna, tarımsal sulama sahasından telekom istasyonuna kadar farklı ölçeklerde proje deneyimi kazanırsınız.",
            },
            {
              title: "Uygulamalı eğitim",
              text: "Deneyimli mühendis ve teknisyenlerimiz eşliğinde saha ve teknik eğitimlerle gelişiminizi destekliyoruz.",
            },
            {
              title: "Net kariyer yolu",
              text: "Teknisyenlikten saha mühendisliğine, satıştan proje yönetimine kadar performansa dayalı ilerleme imkânı sunuyoruz.",
            },
            {
              title: "Kurumsal yaklaşım",
              text: "İş güvenliği, sözleşmeli çalışma ve düzenli özlük haklarıyla kurumsal bir çalışma ortamı sağlıyoruz.",
            },
          ].map((h, i) => (
            <Reveal key={h.title} delay={i * 60} className="rounded-2xl border border-line bg-paper-raised p-6">
              <h3 className="font-display text-[15.5px] font-semibold text-ink">{h.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-slate">{h.text}</p>
            </Reveal>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-line bg-paper-raised p-6 sm:p-7">
          <h3 className="font-display text-[16px] font-semibold text-ink">Açık pozisyonlar</h3>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-slate">
            Güncel açık pozisyon ilanımız bulunmuyor olsa da CV&apos;nizi
            bize her zaman gönderebilirsiniz; uygun bir proje açıldığında
            sizinle iletişime geçeriz.
          </p>
          <a
            href={`mailto:${site.contact.email}?subject=${encodeURIComponent("İş Başvurusu")}`}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[13.5px] font-semibold text-paper hover:bg-sun hover:text-ink"
          >
            CV Gönder
          </a>
        </div>
      </section>
    </div>
  );
}
