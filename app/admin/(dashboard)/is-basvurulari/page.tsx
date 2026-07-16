"use client";

import { useEffect, useState } from "react";
import { PhoneCall, FileText, Trash2 } from "lucide-react";

type JobApplicationRow = {
  id: number;
  created_at: string;
  fullname: string;
  address: string | null;
  phone: string;
  description: string | null;
  cv_url: string | null;
};

function telHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

export default function AdminJobApplicationsPage() {
  const [items, setItems] = useState<JobApplicationRow[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/job-applications")
      .then((r) => r.json())
      .then(setItems);
  }, []);

  async function refresh() {
    const res = await fetch("/api/admin/job-applications");
    setItems(await res.json());
  }

  async function handleDelete(id: number) {
    if (!confirm("Bu başvuruyu silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/admin/job-applications/${id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <div>
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
        İnsan Kaynakları
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
        Gelen İş Başvuruları {items ? `(${items.length})` : ""}
      </h1>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-paper-raised">
        {items === null ? (
          <p className="p-5 text-[13.5px] text-slate-soft">Yükleniyor...</p>
        ) : items.length === 0 ? (
          <p className="p-5 text-[13.5px] text-slate-soft">Henüz gelen bir başvuru yok.</p>
        ) : (
          <table className="w-full min-w-[860px] text-[13.5px]">
            <thead>
              <tr className="border-b border-line text-left text-[11.5px] uppercase tracking-[0.08em] text-slate-soft">
                <th className="px-5 py-3 font-medium">Tarih</th>
                <th className="px-5 py-3 font-medium">Ad Soyad</th>
                <th className="px-5 py-3 font-medium">Telefon</th>
                <th className="px-5 py-3 font-medium">Adres</th>
                <th className="px-5 py-3 font-medium">Açıklama</th>
                <th className="px-5 py-3 font-medium">CV</th>
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
                  <td className="px-5 py-3.5 font-semibold text-ink">{item.fullname}</td>
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <a
                      href={telHref(item.phone)}
                      className="flex items-center gap-1.5 font-semibold text-brand hover:underline"
                    >
                      <PhoneCall size={14} /> {item.phone}
                    </a>
                  </td>
                  <td className="max-w-[200px] px-5 py-3.5 text-slate">{item.address ?? "—"}</td>
                  <td className="max-w-[260px] px-5 py-3.5 text-slate">{item.description ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    {item.cv_url ? (
                      <a
                        href={item.cv_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 font-semibold text-brand hover:underline"
                      >
                        <FileText size={14} /> CV
                      </a>
                    ) : (
                      "—"
                    )}
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
