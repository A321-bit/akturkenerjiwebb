"use client";

import { useEffect, useState } from "react";
import { Download, PhoneCall, Trash2 } from "lucide-react";

type LeadRow = {
  id: number;
  created_at: string;
  fullname: string;
  phone: string;
  email: string | null;
  province: string | null;
  need_type: string;
  bill_range: string | null;
  source: string;
};

function telHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

export default function AdminLeadsPage() {
  const [items, setItems] = useState<LeadRow[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/leads")
      .then((r) => r.json())
      .then(setItems);
  }, []);

  async function refresh() {
    const res = await fetch("/api/admin/leads");
    setItems(await res.json());
  }

  async function handleDelete(id: number) {
    if (!confirm("Bu talebi silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/admin/leads/${id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Talepler</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
            Gelen Teklif Talepleri {items ? `(${items.length})` : ""}
          </h1>
        </div>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download, not a page navigation */}
        <a
          href="/api/admin/leads/export"
          className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper hover:bg-sun hover:text-ink"
        >
          <Download size={16} /> Excel&apos;e Aktar
        </a>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-paper-raised">
        {items === null ? (
          <p className="p-5 text-[13.5px] text-slate-soft">Yükleniyor...</p>
        ) : items.length === 0 ? (
          <p className="p-5 text-[13.5px] text-slate-soft">Henüz gelen bir talep yok.</p>
        ) : (
          <table className="w-full min-w-[860px] text-[13.5px]">
            <thead>
              <tr className="border-b border-line text-left text-[11.5px] uppercase tracking-[0.08em] text-slate-soft">
                <th className="px-5 py-3 font-medium">Tarih</th>
                <th className="px-5 py-3 font-medium">Ad Soyad</th>
                <th className="px-5 py-3 font-medium">Telefon</th>
                <th className="px-5 py-3 font-medium">İl</th>
                <th className="px-5 py-3 font-medium">İhtiyaç</th>
                <th className="px-5 py-3 font-medium">Fatura</th>
                <th className="px-5 py-3 font-medium">Kaynak</th>
                <th className="w-20 px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-line last:border-0">
                  <td className="whitespace-nowrap px-5 py-3.5 text-slate">
                    {new Date(item.created_at).toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-ink">{item.fullname}</p>
                    {item.email && <p className="text-[12px] text-slate-soft">{item.email}</p>}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <a
                      href={telHref(item.phone)}
                      className="flex items-center gap-1.5 font-semibold text-brand hover:underline"
                    >
                      <PhoneCall size={14} /> {item.phone}
                    </a>
                  </td>
                  <td className="px-5 py-3.5 text-slate">{item.province ?? "—"}</td>
                  <td className="px-5 py-3.5 text-ink">{item.need_type}</td>
                  <td className="px-5 py-3.5 text-slate">{item.bill_range ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-full bg-ink/5 px-2.5 py-1 text-[11.5px] font-medium text-slate">
                      {item.source}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg p-2 text-slate hover:bg-red-50 hover:text-red-600"
                      aria-label="Sil"
                    >
                      <Trash2 size={16} />
                    </button>
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
