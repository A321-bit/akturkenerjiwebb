"use client";

import { useEffect, useState } from "react";

export type ProductTab = { id: string; label: string };

// Ürün sayfası sekmeleri: tıklanan sekmenin içeriği görünür, diğerleri gizlenir.
// Tüm sekmelerin içeriği sayfada (HTML'de) bulunur; Google hepsini okuyabilir.
// "#yorumlar" gibi bir bağlantıyla gelinirse o sekme açılır.
export default function ProductTabs({ tabs, panels }: { tabs: ProductTab[]; panels: React.ReactNode[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  useEffect(() => {
    const sync = () => {
      const id = window.location.hash.slice(1);
      if (tabs.some((t) => t.id === id)) setActive(id);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [tabs]);

  return (
    <div id="urun-bilgileri" className="scroll-mt-32">
      <div role="tablist" aria-label="Ürün bilgileri" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            id={`tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => {
              setActive(t.id);
              history.replaceState(null, "", `#${t.id}`);
            }}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-[15px] font-semibold transition-colors ${
              active === t.id ? "border-sun text-ink" : "border-transparent text-slate hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`panel-${t.id}`}
          aria-labelledby={`tab-${t.id}`}
          hidden={active !== t.id}
          className="pt-6"
        >
          {panels[i]}
        </div>
      ))}
    </div>
  );
}
