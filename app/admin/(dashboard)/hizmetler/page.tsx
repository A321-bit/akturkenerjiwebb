"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Pencil } from "lucide-react";

type ServiceRow = { id: number; slug: string; title: string; eyebrow: string };

export default function AdminServicesPage() {
  const [items, setItems] = useState<ServiceRow[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/services")
      .then((r) => r.json())
      .then(setItems);
  }, []);

  async function refresh() {
    const res = await fetch("/api/admin/services");
    setItems(await res.json());
  }

  async function handleDelete(id: number) {
    if (!confirm("Bu hizmeti silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
            Hizmetler
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
            Hizmet Listesi
          </h1>
        </div>
        <Link
          href="/admin/hizmetler/yeni"
          className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper hover:bg-sun hover:text-ink"
        >
          <Plus size={16} /> Yeni Hizmet
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-paper-raised">
        {items === null ? (
          <p className="p-5 text-[13.5px] text-slate-soft">Yükleniyor...</p>
        ) : items.length === 0 ? (
          <p className="p-5 text-[13.5px] text-slate-soft">Henüz hizmet eklenmemiş.</p>
        ) : (
          <table className="w-full text-[14px]">
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3.5">
                    <p className="font-mono-data text-[11px] uppercase text-brand">
                      {item.eyebrow}
                    </p>
                    <p className="font-semibold text-ink">{item.title}</p>
                  </td>
                  <td className="w-24 px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/hizmetler/${item.id}`}
                        className="rounded-lg p-2 text-slate hover:bg-ink/5 hover:text-ink"
                        aria-label="Düzenle"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded-lg p-2 text-slate hover:bg-red-50 hover:text-red-600"
                        aria-label="Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
