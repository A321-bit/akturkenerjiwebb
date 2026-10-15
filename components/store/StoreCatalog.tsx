"use client";

import { useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import type { StoreCategory, StoreProduct } from "@/lib/store";

type Sort = "onerilen" | "artan" | "azalan";

export default function StoreCatalog({
  products,
  categories,
  whatsappNumber,
  showCategoryFilter = true,
}: {
  products: StoreProduct[];
  categories: StoreCategory[];
  whatsappNumber: string;
  showCategoryFilter?: boolean;
}) {
  const [category, setCategory] = useState<string>("tumu");
  const [installOnly, setInstallOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("onerilen");

  const usedCategories = categories.filter((c) => products.some((p) => p.category === c.slug));
  const list = useMemo(() => {
    let l = products.filter((p) => (category === "tumu" || p.category === category) && (!installOnly || p.installIncluded));
    if (sort !== "onerilen") {
      l = [...l].sort((a, b) => ((a.priceMin ?? 1e12) - (b.priceMin ?? 1e12)) * (sort === "artan" ? 1 : -1));
    }
    return l;
  }, [products, category, installOnly, sort]);

  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-3.5 py-2 text-[13.5px] font-semibold transition-colors ${
      active ? "border-ink bg-ink text-paper" : "border-line bg-paper-raised text-slate hover:border-ink hover:text-ink"
    }`;

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {showCategoryFilter ? (
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            <button type="button" onClick={() => setCategory("tumu")} className={chip(category === "tumu")}>
              Tümü
            </button>
            {usedCategories.map((c) => (
              <button key={c.slug} type="button" onClick={() => setCategory(c.slug)} className={chip(category === c.slug)}>
                {c.name}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-[13.5px] font-medium text-slate">
            <input type="checkbox" checked={installOnly} onChange={(e) => setInstallOnly(e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
            Kurulum dahil
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-full border border-line bg-paper-raised px-3.5 py-2 text-[13.5px] font-medium text-ink"
            aria-label="Sıralama"
          >
            <option value="onerilen">Önerilen</option>
            <option value="artan">Fiyat: düşükten yükseğe</option>
            <option value="azalan">Fiyat: yüksekten düşüğe</option>
          </select>
        </div>
      </div>

      <p className="mt-4 text-[13px] text-slate-soft">{list.length} ürün</p>

      {list.length > 0 ? (
        <div className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((p) => (
            <ProductCard key={p.slug} product={p} whatsappNumber={whatsappNumber} />
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-dashed border-line bg-paper-raised p-10 text-center text-[14.5px] text-slate">
          Bu kategoriye ürünler ekleniyor. Aradığınız ürün için WhatsApp&apos;tan yazabilirsiniz.
        </div>
      )}
    </div>
  );
}
