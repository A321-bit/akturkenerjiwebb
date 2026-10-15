import type { Metadata } from "next";
import CoverMedia from "@/components/CoverMedia";
import { MapPin, Zap } from "lucide-react";
import { getReferences } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Mağaza Referanslarımız",
    description: "Aktürk Enerji'nin kurduğu güneş enerjisi sistemlerinden örnekler: villa, müstakil ev, off grid ve hibrit projeler.",
    path: "/magaza/referanslar",
  }),
  robots: { index: false, follow: true },
};

// Kurumsal sitedeki referans detay sayfalarına link verilmez; müşteri
// mağazanın içinde kalır.
export default async function StoreReferencesPage() {
  const references = await getReferences();

  return (
    <div className="flex flex-col gap-8">
      <section className="max-w-3xl">
        <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Referanslarımız</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Kurduğumuz sistemler</h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-slate">
          Mağazadaki paketlerin sahadaki karşılıkları: Ankara ve Türkiye genelinde kendi ekibimizle kurduğumuz güneş
          enerjisi sistemlerinden bir seçki.
        </p>
      </section>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {references.map((r) => (
          <article key={r.slug} className="overflow-hidden rounded-2xl border border-line bg-paper-raised">
            <div className="relative">
              <CoverMedia
                src={r.image}
                alt={r.title}
                label={r.category}
                aspect="aspect-[4/3]"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="!rounded-none"
              />
              {r.capacity && (
                <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-ink/85 px-3 py-1 font-mono-data text-[12px] font-semibold text-paper">
                  <Zap size={12} className="text-sun" /> {r.capacity}
                </span>
              )}
            </div>
            <div className="p-4">
              <p className="font-mono-data text-[11px] uppercase tracking-[0.14em] text-brand">{r.category}</p>
              <h2 className="mt-1.5 font-display text-[16.5px] font-semibold leading-snug text-ink">{r.title}</h2>
              <p className="mt-2 flex items-center gap-1 text-[13px] text-slate">
                <MapPin size={13} /> {r.location}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
