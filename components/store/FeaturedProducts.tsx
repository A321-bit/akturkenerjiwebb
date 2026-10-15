import Image from "next/image";
import Link from "next/link";
import { Flame } from "lucide-react";
import { discountPercent, formatTL, STORE_PRODUCTS } from "@/lib/store";

// Kategori sayfasında yan menünün altında: çok tercih edilen paketlerin kısa listesi.
export default function FeaturedProducts({ exclude }: { exclude?: string }) {
  const items = STORE_PRODUCTS.filter((p) => p.featured && p.category !== exclude).slice(0, 4);
  if (items.length === 0) return null;

  return (
    <div className="hidden overflow-hidden rounded-2xl border border-line bg-paper-raised lg:block">
      <p className="flex items-center gap-2 border-b border-line px-4 py-3 font-display text-[15px] font-semibold text-ink">
        <Flame size={17} className="text-[#e8562a]" />
        Çok Tercih Edilenler
      </p>
      <div className="flex flex-col">
        {items.map((p) => {
          const discount = discountPercent(p);
          return (
            <Link
              key={p.slug}
              href={`/magaza/${p.category}`}
              className="flex gap-3 border-b border-line px-4 py-3 last:border-b-0 hover:bg-paper"
            >
              <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-paper">
                {p.image && <Image src={p.image} alt={p.name} fill sizes="64px" className="object-cover" />}
                {discount != null && (
                  <span className="absolute left-1 top-1 rounded-full bg-[#e8562a] px-1.5 text-[10.5px] font-bold text-white">
                    %{discount}
                  </span>
                )}
              </span>
              <span className="min-w-0">
                <span className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-ink">{p.name}</span>
                {p.listPrice != null && discount != null && (
                  <span className="mt-1 block text-[12px] text-slate-soft line-through">{formatTL(p.listPrice)}</span>
                )}
                {p.price != null && (
                  <span className="block text-[14px] font-bold text-ink">{formatTL(p.price)}</span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
