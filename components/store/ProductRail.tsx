"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import type { StoreProduct } from "@/lib/store";

// Başlıklı, yana kayan ürün şeridi (ör. "Çok Tercih Edilen Paketler").
export default function ProductRail({
  title,
  subtitle,
  products,
  whatsappNumber,
}: {
  title: string;
  subtitle?: string;
  products: StoreProduct[];
  whatsappNumber: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  if (products.length === 0) return null;

  function scroll(dir: 1 | -1) {
    const el = track.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 280) + 20), behavior: "smooth" });
  }

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
          {subtitle && <p className="mt-1 text-[14px] text-slate">{subtitle}</p>}
        </div>
        {products.length > 1 && (
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              aria-label="Önceki"
              onClick={() => scroll(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper-raised hover:border-ink"
            >
              <ChevronLeft size={19} />
            </button>
            <button
              type="button"
              aria-label="Sonraki"
              onClick={() => scroll(1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper-raised hover:border-ink"
            >
              <ChevronRight size={19} />
            </button>
          </div>
        )}
      </div>
      <div ref={track} className="no-scrollbar mt-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-1">
        {products.map((p) => (
          <div key={p.slug} className="w-[78%] shrink-0 snap-start sm:w-[calc((100%-20px)/2)] md:w-[calc((100%-40px)/3)] lg:w-[calc((100%-60px)/4)]">
            <ProductCard product={p} whatsappNumber={whatsappNumber} />
          </div>
        ))}
      </div>
    </section>
  );
}
