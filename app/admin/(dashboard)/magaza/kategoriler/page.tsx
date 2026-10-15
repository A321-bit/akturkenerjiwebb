"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { categoryIcon } from "@/components/store/category-icons";

type Row = { id: number; slug: string; name: string; short: string; icon: string; sort_order: number; active: boolean; content: string | null };

export default function AdminStoreCategoriesPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const fetchRows = () => fetch("/api/admin/store/categories").then((r) => r.json());

  useEffect(() => {
    fetchRows().then(setRows);
    fetch("/api/admin/store/products")
      .then((r) => r.json())
      .then((ps: { category: string }[]) => {
        if (!Array.isArray(ps)) return;
        const c: Record<string, number> = {};
        for (const p of ps) c[p.category] = (c[p.category] ?? 0) + 1;
        setCounts(c);
      });
  }, []);

  async function toggle(r: Row) {
    setRows((rs) => rs?.map((x) => (x.id === r.id ? { ...x, active: !r.active } : x)) ?? null);
    await fetch(`/api/admin/store/categories/${r.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !r.active }),
    });
  }

  async function remove(r: Row) {
    if (counts[r.slug]) {
      alert(`Bu kategoride ${counts[r.slug]} ürün var. Önce ürünleri başka kategoriye taşıyın veya silin; ya da kategoriyi gizleyin.`);
      return;
    }
    if (!confirm(`"${r.name}" kategorisi silinsin mi?`)) return;
    await fetch(`/api/admin/store/categories/${r.id}`, { method: "DELETE" });
    fetchRows().then(setRows);
  }

  return (
    <div>
      <div className="flex justify-end">
        <Link
          href="/admin/magaza/kategoriler/yeni"
          className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper hover:bg-sun hover:text-ink"
        >
          <Plus size={16} /> Yeni Kategori
        </Link>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-paper-raised">
        {rows === null ? (
          <p className="p-5 text-[13.5px] text-slate-soft">Yükleniyor...</p>
        ) : (
          <table className="w-full text-[14px]">
            <tbody>
              {rows.map((r) => {
                const Icon = categoryIcon(r.icon);
                return (
                  <tr key={r.id} className={`border-b border-line last:border-0 ${r.active ? "" : "opacity-50"}`}>
                    <td className="w-12 px-4 py-3.5">
                      <Icon size={19} className="text-brand" />
                    </td>
                    <td className="py-3.5">
                      <p className="font-semibold text-ink">{r.name}</p>
                      <p className="text-[12px] text-slate">
                        {counts[r.slug] ?? 0} ürün · sıra {r.sort_order} · {r.content ? "✓ SEO yazısı var" : "— SEO yazısı yok"}
                        {!r.active && " · gizli"}
                      </p>
                    </td>
                    <td className="w-36 px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => toggle(r)} className="rounded-lg p-2 text-slate hover:bg-ink/5" title={r.active ? "Gizle" : "Yayınla"}>
                          {r.active ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <Link href={`/admin/magaza/kategoriler/${r.id}`} className="rounded-lg p-2 text-slate hover:bg-ink/5 hover:text-ink" title="Düzenle">
                          <Pencil size={16} />
                        </Link>
                        <button onClick={() => remove(r)} className="rounded-lg p-2 text-slate hover:bg-red-50 hover:text-red-600" title="Sil">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
