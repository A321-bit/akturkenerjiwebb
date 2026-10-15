"use client";

import { useEffect, useState } from "react";
import { Check, EyeOff, Star, Trash2 } from "lucide-react";
import StoreAdminNav from "@/components/admin/store/StoreAdminNav";

type ReviewRow = {
  id: number;
  created_at: string;
  product_slug: string;
  name: string;
  city: string | null;
  rating: number;
  comment: string;
  approved: boolean;
};

export default function AdminReviewsPage() {
  const [items, setItems] = useState<ReviewRow[] | null>(null);
  const [error, setError] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});
  const productName = (slug: string) => names[slug] ?? slug;

  async function fetchReviews() {
    const res = await fetch("/api/admin/reviews");
    const body = await res.json().catch(() => null);
    return { ok: res.ok && Array.isArray(body), body };
  }

  function apply({ ok, body }: { ok: boolean; body: unknown }) {
    if (!ok) {
      setError((body as { error?: string } | null)?.error ?? "Yorumlar yüklenemedi.");
      setItems([]);
      return;
    }
    setError("");
    setItems(body as ReviewRow[]);
  }

  const load = () => fetchReviews().then(apply);

  useEffect(() => {
    fetchReviews().then(apply);
    fetch("/api/admin/store/products")
      .then((r) => r.json())
      .then((rows: { slug: string; name: string }[]) => {
        if (Array.isArray(rows)) setNames(Object.fromEntries(rows.map((p) => [p.slug, p.name])));
      });
  }, []);

  async function setApproved(id: number, approved: boolean) {
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    });
    load();
  }

  async function remove(id: number) {
    if (!confirm("Bu yorum kalıcı olarak silinsin mi?")) return;
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    load();
  }

  const pending = items?.filter((r) => !r.approved).length ?? 0;

  return (
    <div>
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Mağaza</p>
      <h1 className="mb-4 mt-1 font-display text-2xl font-semibold tracking-tight">Ürün Yorumları</h1>
      <StoreAdminNav />
      <p className="mt-1 text-[14px] text-slate">
        Müşterilerin yazdığı yorumlar onaylanana kadar sitede görünmez.{" "}
        {pending > 0 && <strong className="text-ink">{pending} yorum onay bekliyor.</strong>}
      </p>

      {error && <p className="mt-4 text-[14px] text-red-600">{error}</p>}
      {items && items.length === 0 && !error && <p className="mt-6 text-[14px] text-slate">Henüz yorum yok.</p>}

      <div className="mt-6 flex flex-col gap-3">
        {items?.map((r) => (
          <div
            key={r.id}
            className={`rounded-2xl border p-5 ${r.approved ? "border-line bg-paper-raised" : "border-sun/50 bg-sun/5"}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] font-semibold text-brand">{productName(r.product_slug)}</p>
              <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${r.approved ? "bg-volt/10 text-volt" : "bg-sun/20 text-ink"}`}>
                {r.approved ? "Yayında" : "Onay bekliyor"}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={15} className={n <= r.rating ? "fill-sun text-sun" : "fill-line text-line"} />
                ))}
              </span>
              <span className="text-[13.5px] font-semibold text-ink">{r.name}</span>
              {r.city && <span className="text-[13px] text-slate">· {r.city}</span>}
              <span className="text-[12.5px] text-slate-soft">· {new Date(r.created_at).toLocaleDateString("tr-TR")}</span>
            </div>
            <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-ink">{r.comment}</p>
            <div className="mt-3 flex gap-2">
              {r.approved ? (
                <button onClick={() => setApproved(r.id, false)} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[13px] font-semibold hover:border-ink">
                  <EyeOff size={14} /> Yayından kaldır
                </button>
              ) : (
                <button onClick={() => setApproved(r.id, true)} className="inline-flex items-center gap-1.5 rounded-full bg-volt px-3 py-1.5 text-[13px] font-semibold text-white hover:opacity-90">
                  <Check size={14} /> Onayla ve yayınla
                </button>
              )}
              <button onClick={() => remove(r.id)} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[13px] font-semibold text-red-600 hover:border-red-600">
                <Trash2 size={14} /> Sil
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
