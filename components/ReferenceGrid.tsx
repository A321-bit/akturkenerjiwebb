"use client";

import { useState } from "react";
import { references } from "@/lib/site-config";

const categories = ["Tümü", ...Array.from(new Set(references.map((r) => r.category)))];

export default function ReferenceGrid() {
  const [active, setActive] = useState("Tümü");
  const filtered =
    active === "Tümü" ? references : references.filter((r) => r.category === active);

  return (
    <>
      <div className="mt-8 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={`rounded-full border px-4 py-1.5 text-[13.5px] font-medium transition-colors ${
              active === c
                ? "border-ink bg-ink text-paper"
                : "border-line text-slate hover:border-brand"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <div key={r.slug} className="rounded-2xl border border-line bg-paper-raised p-6">
            <div className="flex items-center justify-between">
              <span className="font-mono-data text-[11px] uppercase tracking-[0.14em] text-brand">
                {r.category}
              </span>
              <span className="font-mono-data text-[11px] text-slate-soft">{r.year}</span>
            </div>
            <h3 className="mt-3 font-display text-[17px] font-semibold leading-snug">
              {r.title}
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-slate">{r.summary}</p>
            <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[12.5px] text-slate-soft">
              <span>{r.location}</span>
              <span className="font-mono-data font-semibold text-ink">{r.capacity}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
