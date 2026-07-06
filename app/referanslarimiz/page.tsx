import type { Metadata } from "next";
import { site } from "@/lib/site-config";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import ReferenceGrid from "@/components/ReferenceGrid";

export const metadata: Metadata = buildMetadata({
  title: "Referanslarımız",
  description:
    "Ankara ve çevresinde tamamladığımız villa, müteahhit, tarımsal ve hobi bahçesi güneş enerjisi projelerinden referanslar.",
  path: "/referanslarimiz",
  keywords: ["güneş enerjisi referansları", "GES projeleri Ankara", "solar enerji örnekleri", site.city],
});

const jsonLd = {
  "@context": "https://schema.org",
  ...breadcrumbJsonLd([
    { name: "Anasayfa", path: "/" },
    { name: "Referanslarımız", path: "/referanslarimiz" },
  ]),
};

export default function ReferencesPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
        Referanslarımız
      </p>
      <h1 className="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Tamamladığımız projelerden bir kesit
      </h1>
      <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-slate">
        2016&apos;dan bu yana Ankara ve çevresinde villa, hobi bahçesi, tarımsal
        ve müteahhit projelerinde yüzlerce sistem kurduk. Aşağıda bir seçkisini
        bulabilirsiniz — proje fotoğrafları ve daha fazla referans için bizimle
        iletişime geçin.
      </p>
      <ReferenceGrid />
    </div>
  );
}
