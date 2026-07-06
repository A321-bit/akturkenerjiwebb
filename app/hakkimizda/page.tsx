import type { Metadata } from "next";
import { site, stats } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description:
    "2016'dan beri Ankara merkezli faaliyet gösteren Aktürk Enerji Teknolojileri hakkında — hikayemiz, çalışma alanlarımız ve mühendislik yaklaşımımız.",
  alternates: { canonical: "/hakkimizda" },
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
    text: "Savunma sanayi ve telekomünikasyon projelerinde de yer alarak, Türkiye genelinde malzeme tedariği ve bayilik iş birlikleriyle büyümeye devam ediyoruz.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-20">
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
        Hakkımızda
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {site.foundedYear}&apos;dan beri {site.city}&apos;dan Türkiye geneline
      </h1>
      <p className="mt-5 text-[16px] leading-relaxed text-slate">
        {site.name}, {site.foundedYear} yılından bu yana Ankara merkezli olarak
        solar enerji sektöründe hizmet veriyor. Villa ve müstakil konutlardan
        müteahhit projelerine, tarımsal sulama sistemlerinden hobi bahçelerine
        kadar geniş bir yelpazede anahtar teslim güneş enerjisi çözümleri
        sunuyoruz. Keşiften mühendislik başvurularına, kurulumdan satış
        sonrası desteğe kadar sürecin tamamını kendi ekibimizle yürütüyoruz.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-6 rounded-2xl border border-line bg-paper-raised p-6 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="font-mono-data text-lg font-semibold text-ink sm:text-xl">{s.value}</p>
            <p className="mt-1 text-[12.5px] text-slate">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-14 font-display text-2xl font-semibold tracking-tight">
        Yolculuğumuz
      </h2>
      <ol className="mt-6 space-y-6 border-l border-line pl-6">
        {timeline.map((t) => (
          <li key={t.year} className="relative">
            <span className="absolute -left-[27px] top-1 h-2.5 w-2.5 rounded-full bg-brand" />
            <p className="font-mono-data text-[12.5px] font-semibold text-brand">{t.year}</p>
            <p className="mt-1 text-[15px] leading-relaxed text-ink">{t.text}</p>
          </li>
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
        ].map((f) => (
          <div key={f.title} className="rounded-2xl border border-line bg-paper-raised p-6">
            <h3 className="font-display text-[16px] font-semibold">{f.title}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-slate">{f.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
