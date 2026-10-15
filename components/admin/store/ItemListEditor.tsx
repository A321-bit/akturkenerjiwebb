"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

export type ItemField<T> = {
  key: keyof T & string;
  label: string;
  type?: "text" | "textarea" | "custom";
  placeholder?: string;
  render?: (value: T[keyof T], set: (v: T[keyof T]) => void) => React.ReactNode;
};

// Sıralanabilir liste düzenleyici (SSS, markalar, adımlar, slaytlar...).
export default function ItemListEditor<T extends Record<string, unknown>>({
  items,
  onChange,
  fields,
  empty,
  addLabel,
  itemTitle,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  fields: ItemField<T>[];
  empty: T;
  addLabel: string;
  itemTitle?: (item: T, i: number) => string;
}) {
  function update(i: number, key: keyof T, value: unknown) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, [key]: value } : it)));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-xl border border-line bg-paper p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12.5px] font-semibold text-slate">{itemTitle ? itemTitle(item, i) : `#${i + 1}`}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1.5 text-slate hover:bg-ink/5 disabled:opacity-30" aria-label="Yukarı taşı">
                <ArrowUp size={15} />
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="rounded p-1.5 text-slate hover:bg-ink/5 disabled:opacity-30" aria-label="Aşağı taşı">
                <ArrowDown size={15} />
              </button>
              <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="rounded p-1.5 text-red-600 hover:bg-red-50" aria-label="Sil">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          {fields.map((f) => (
            <label key={f.key} className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-slate">{f.label}</span>
              {f.type === "custom" && f.render ? (
                f.render(item[f.key], (v) => update(i, f.key, v))
              ) : f.type === "textarea" ? (
                <textarea
                  rows={3}
                  value={String(item[f.key] ?? "")}
                  placeholder={f.placeholder}
                  onChange={(e) => update(i, f.key, e.target.value)}
                  className="admin-input"
                />
              ) : (
                <input
                  value={String(item[f.key] ?? "")}
                  placeholder={f.placeholder}
                  onChange={(e) => update(i, f.key, e.target.value)}
                  className="admin-input"
                />
              )}
            </label>
          ))}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, { ...empty }])}
        className="flex w-fit items-center gap-1.5 rounded-full border border-line px-4 py-2 text-[13px] font-semibold hover:border-ink"
      >
        <Plus size={15} /> {addLabel}
      </button>
    </div>
  );
}
