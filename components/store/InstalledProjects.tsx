import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import type { Reference } from "@/lib/data";
import type { StoreCategory } from "@/lib/store";
import CoverMedia from "@/components/CoverMedia";

// Referans projeyi en yakın mağaza kategorisine bağlar; böylece referanslar
// mağazada "bu paketlerle kurduklarımız" olarak, farklı bir açıdan sunulur.
function categoryFor(r: Reference): string {
  const t = `${r.title} ${r.category}`.toLocaleLowerCase("tr-TR");
  if (/sulama|pompa/.test(t)) return "tarimsal-sulama-paketleri";
  if (/rüzgar/.test(t)) return "ruzgar-turbini-paketleri";
  if (/şarj/.test(t)) return "elektrikli-arac-sarj-istasyonu";
  if (/off-grid|off grid/.test(t)) return "off-grid-paketler";
  if (/öztüketim/.test(t)) return "oztuketim-paketleri";
  if (/hibrit|batarya|depolama|lityum/.test(t)) return "hibrit-paketler";
  return "on-grid-paketler";
}

export default function InstalledProjects({ references, categories }: { references: Reference[]; categories: StoreCategory[] }) {
  const items = references.filter((r) => r.image).slice(0, 8);
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">Bu paketlerle kurduklarımız</h2>
      <p className="mt-1 text-[14px] text-slate">Mağazadaki paketlerin sahadaki karşılıkları: kendi ekibimizle kurduğumuz sistemler.</p>
      <div className="no-scrollbar mt-4 flex snap-x gap-5 overflow-x-auto pb-1">
        {items.map((r) => {
          const cat = categories.find((c) => c.slug === categoryFor(r));
          return (
            <article
              key={r.slug}
              className="w-[78%] shrink-0 snap-start overflow-hidden rounded-2xl border border-line bg-paper-raised sm:w-[calc((100%-20px)/2)] lg:w-[calc((100%-40px)/3)]"
            >
              <CoverMedia
                src={r.image}
                alt={r.title}
                label={r.category}
                aspect="aspect-[4/3]"
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 80vw"
                className="!rounded-none"
              />
              <div className="p-4">
                <p className="line-clamp-2 font-display text-[15px] font-semibold leading-snug text-ink">{r.title}</p>
                <p className="mt-1.5 flex items-center gap-1 text-[12.5px] text-slate">
                  <MapPin size={12} /> {r.location}
                </p>
                {cat && (
                  <Link
                    href={`/magaza/${cat.slug}`}
                    className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:text-ink"
                  >
                    Benzer paketler: {cat.name} <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
