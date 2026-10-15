"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutList, Search } from "lucide-react";
import { formatTL, STORE_CATEGORIES, STORE_PRODUCTS } from "@/lib/store";
import { productHref } from "@/lib/store-details";

const norm = (s: string) =>
  s
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/,/g, ".");

// Mağaza üst menüsündeki arama: "10 kw", "hibrit", "sulama" gibi yazınca
// paketler ve kategoriler anında listelenir.
export default function StoreSearch({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    if (terms.length === 0) return { cats: [], prods: [] };
    const match = (text: string) => terms.every((t) => norm(text).replace(/\s+/g, " ").includes(t) || norm(text).replace(/\s+/g, "").includes(t));
    return {
      cats: STORE_CATEGORIES.filter((c) => match(c.name)).slice(0, 3),
      prods: STORE_PRODUCTS.filter((p) => match(`${p.name} ${p.power}`)).slice(0, 6),
    };
  }, [q]);

  const first = results.cats[0] ? `/magaza/${results.cats[0].slug}` : results.prods[0] ? productHref(results.prods[0]) : null;
  const hasResults = results.cats.length + results.prods.length > 0;

  return (
    <div
      ref={box}
      className={`relative ${className}`}
      onBlur={(e) => {
        if (!box.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (first) {
            setOpen(false);
            router.push(first);
          }
        }}
      >
        <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-soft" />
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Paket ara: 10 kW, hibrit, sulama..."
          aria-label="Mağazada ara"
          className="w-full rounded-full border border-line bg-paper-raised py-2.5 pl-10 pr-4 text-[14px] text-ink outline-none placeholder:text-slate-soft focus:border-brand"
        />
      </form>

      {open && q.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-paper-raised shadow-[0_20px_44px_-20px_rgba(11,20,32,0.45)]">
          {!hasResults && <p className="px-4 py-4 text-[14px] text-slate">Sonuç bulunamadı.</p>}
          {results.cats.map((c) => (
            <Link
              key={c.slug}
              href={`/magaza/${c.slug}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 border-b border-line px-4 py-3 text-[14px] font-semibold text-ink hover:bg-paper"
            >
              <LayoutList size={16} className="text-brand" />
              {c.name}
              <span className="ml-auto text-[12px] font-normal text-slate-soft">Kategori</span>
            </Link>
          ))}
          {results.prods.map((p) => (
            <Link
              key={p.slug}
              href={productHref(p)}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0 hover:bg-paper"
            >
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-paper">
                {p.image && <Image src={p.image} alt="" fill sizes="40px" className="object-cover" />}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">{p.name}</span>
              {p.price != null && <span className="text-[13px] font-bold text-ink">{formatTL(p.price)}</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
