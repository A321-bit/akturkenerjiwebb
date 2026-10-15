"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, LayoutList } from "lucide-react";
import { categoryIcon } from "./category-icons";

export type SidebarCategory = { slug: string; name: string; icon: string; count: number };

// Klasik e-ticaret düzeni: solda dikey kategori menüsü. Mobilde
// "Kategoriler" butonuna dönüşür.
export default function StoreSidebar({ categories }: { categories: SidebarCategory[] }) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  const list = (
    <nav className="flex flex-col py-2">
      <div className="py-1">
          {categories.map((c) => {
            const Icon = categoryIcon(c.icon);
            const active = pathname === `/magaza/${c.slug}`;
            const count = c.count;
            return (
              <Link
                key={c.slug}
                href={`/magaza/${c.slug}`}
                onClick={() => setOpen(false)}
                className={`group flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium transition-colors ${
                  active ? "bg-ink text-paper" : "text-ink hover:bg-paper"
                }`}
              >
                <Icon size={17} className={active ? "text-sun" : "text-brand"} />
                <span className="flex-1">{c.name}</span>
                {count > 0 && (
                  <span className={`text-[12px] ${active ? "text-paper/70" : "text-slate-soft"}`}>{count}</span>
                )}
                <ChevronRight
                  size={15}
                  className={`transition-transform group-hover:translate-x-0.5 ${active ? "text-paper/70" : "text-slate-soft"}`}
                />
              </Link>
            );
          })}
      </div>
    </nav>
  );

  return (
    <>
      {/* Masaüstü */}
      <aside className="hidden overflow-hidden rounded-2xl border border-line bg-paper-raised lg:block">
        <Link
          href="/magaza"
          className="flex items-center gap-2 border-b border-line bg-ink px-4 py-3 font-display text-[15px] font-semibold text-paper"
        >
          <LayoutList size={17} className="text-sun" />
          Kategoriler
        </Link>
        {list}
      </aside>

      {/* Mobil */}
      <div className="overflow-hidden rounded-2xl border border-line bg-paper-raised lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 bg-ink px-4 py-3 font-display text-[15px] font-semibold text-paper"
          aria-expanded={open}
        >
          <span className="flex items-center gap-2">
            <LayoutList size={17} className="text-sun" />
            Kategoriler
          </span>
          <ChevronDown size={18} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && list}
      </div>
    </>
  );
}
