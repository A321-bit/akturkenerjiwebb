import type { Metadata } from "next";
import { getServices } from "@/lib/data";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import ServiceCard from "@/components/ServiceCard";

export const metadata: Metadata = buildMetadata({
  title: "Ankara Güneş Enerjisi ve GES Kurulum Hizmetleri",
  description:
    "Ankara'da villa ve fabrika çatı GES, hibrit ve bataryalı sistemler, off-grid, tarımsal sulama, EDAŞ başvurusu ve bakım: anahtar teslim güneş enerjisi hizmetleri.",
  path: "/hizmetlerimiz",
  keywords: ["güneş enerjisi hizmetleri", "GES kurulumu", "villa çatı GES", "tarımsal sulama GES", "Ankara"],
});

const jsonLd = {
  "@context": "https://schema.org",
  ...breadcrumbJsonLd([
    { name: "Anasayfa", path: "/" },
    { name: "Hizmetlerimiz", path: "/hizmetlerimiz" },
  ]),
};

// Hizmetler, arama niyetine göre gruplanıp her grup kendi H2'si altında
// listelenir. Admin panelden eklenen ve burada olmayan bir hizmet
// "Diğer hizmetler" grubuna düşer.
const GROUPS: { title: string; text: string; slugs: string[] }[] = [
  {
    title: "Konut, işyeri ve fabrika çatı GES",
    text: "Villa, müstakil ev, site ve fabrika çatılarına şebeke bağlantılı (on-grid) güneş enerjisi sistemleri. Keşif, statik ve elektrik projesi, EDAŞ başvurusu ve kurulum dahil.",
    slugs: ["villa-cati-ges", "fabrika-cati-ges", "muteahhit-ges"],
  },
  {
    title: "Hibrit, bataryalı ve şebekeden bağımsız sistemler",
    text: "Elektrik kesintisinde çalışmaya devam eden hibrit inverterli ve lityum bataryalı sistemler; şebekenin olmadığı hobi bahçesi, bağ evi ve arazilere off-grid çözümler.",
    slugs: ["lityum-batarya-depolama", "off-grid-sebekeden-bagimsiz", "ruzgar-hibrit"],
  },
  {
    title: "Tarımsal sulama",
    text: "Mazot ya da şebeke yerine güneşle çalışan sulama pompası sistemleri; pompa gücüne göre panel ve sürücü boyutlandırması.",
    slugs: ["tarimsal-sulama"],
  },
  {
    title: "Şarj istasyonu ve ısı pompası entegrasyonu",
    text: "Güneş enerjisi sisteminizle elektrikli aracınızı şarj etmek ve ısı pompasını beslemek için entegrasyon.",
    slugs: ["elektrikli-arac-sarj-istasyonu", "isi-pompasi-entegrasyonu"],
  },
  {
    title: "Mühendislik, bakım ve tedarik",
    text: "Projelendirme ve başvuru işlemleri, kurulu sistemlerin bakımı ve işletmesi, panel, inverter ve batarya tedariği, bayilik.",
    slugs: [
      "projelendirme-muhendislik-basvuru",
      "taahhut-isletme-bakim",
      "malzeme-tedarik-toptan-perakende",
      "distributorluk-bayilik",
    ],
  },
];

export default async function ServicesPage() {
  const services = await getServices();
  const grouped = new Set(GROUPS.flatMap((g) => g.slugs));
  const groups = [
    ...GROUPS.map((g) => ({
      ...g,
      items: g.slugs.map((slug) => services.find((s) => s.slug === slug)).filter((s) => s !== undefined),
    })),
    {
      title: "Diğer hizmetler",
      text: "",
      slugs: [],
      items: services.filter((s) => !grouped.has(s.slug)),
    },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
        Hizmetlerimiz
      </p>
      <h1 className="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Ankara&apos;da güneş enerjisi ve GES kurulum hizmetleri
      </h1>
      <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-slate">
        Keçiören&apos;deki ofisimizden Ankara&apos;nın tüm ilçelerine ve Türkiye geneline hizmet
        veriyoruz. Konut çatılarından tarımsal arazilere, müteahhit projelerinden mühendislik
        başvurularına kadar her işi keşiften devreye almaya kendi ekibimizle yürütüyoruz.
      </p>

      {groups.map((g) => (
        <section key={g.title} className="mt-14">
          <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{g.title}</h2>
          {g.text && <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-slate">{g.text}</p>}
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((s) => (
              <ServiceCard key={s.slug} service={s} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
