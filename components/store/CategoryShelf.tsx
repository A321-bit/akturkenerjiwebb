"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import type { StoreCategory, StoreProduct } from "@/lib/store";

// Mağaza ana sayfasındaki kategori rafı: solda görselli kategori afişi,
// sağında o kategorinin ürünleri yana kayan şerit halinde.
export default function CategoryShelf({
  category,
  products,
  whatsappNumber,
}: {
  category: StoreCategory;
  products: StoreProduct[];
  whatsappNumber: string;
}) {
  const track = useRef<HTMLDivElement>(null);

  function scroll(dir: 1 | -1) {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("article");
    const step = card ? card.getBoundingClientRect().width + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <Link
        href={`/magaza/${category.slug}`}
        className="group relative flex min-h-[150px] flex-col justify-end overflow-hidden rounded-2xl bg-ink p-5 text-paper lg:min-h-full"
      >
        {category.image && (
          <Image
            src={category.image}
            alt={category.name}
            fill
            sizes="(min-width: 1024px) 220px, 100vw"
            className="object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/10" />
        <div className="relative">
          <h2 className="font-display text-[22px] font-semibold leading-tight">{category.name}</h2>
          <p className="mt-1.5 text-[13.5px] text-paper/80">{category.short}</p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-sun px-4 py-2 text-[13px] font-bold text-ink transition-colors group-hover:bg-sun-soft">
            Tümünü Gör <ArrowRight size={14} />
          </span>
        </div>
      </Link>

      <div className="relative min-w-0">
        <div
          ref={track}
          className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-1"
        >
          {products.map((p) => (
            <div key={p.slug} className="w-[78%] shrink-0 snap-start sm:w-[calc((100%-20px)/2)] md:w-[calc((100%-40px)/3)] xl:w-[calc((100%-60px)/4)]">
              <ProductCard product={p} whatsappNumber={whatsappNumber} />
            </div>
          ))}
        </div>
        {products.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Önceki ürünler"
              onClick={() => scroll(-1)}
              className="absolute left-2 top-[30%] hidden h-10 w-10 items-center justify-center rounded-full border border-line bg-paper-raised text-ink shadow-md hover:border-ink sm:flex"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              aria-label="Sonraki ürünler"
              onClick={() => scroll(1)}
              className="absolute right-2 top-[30%] hidden h-10 w-10 items-center justify-center rounded-full border border-line bg-paper-raised text-ink shadow-md hover:border-ink sm:flex"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
