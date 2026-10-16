"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Pencil, Percent, Plus, Star, Trash2 } from "lucide-react";

type Row = {
  id: number;
  slug: string;
  category: string;
  name: string;
  price: number | null;
  list_price: number | null;
  price_usd: number | null;
  list_price_usd: number | null;
  image: string | null;
  featured: boolean;
  active: boolean;
  sort_order: number;
  datasheet: string | null;
  content: string | null;
  cost_usd: number | null;
  margin_pct: number | null;
  list_margin_pct: number | null;
};
type Cat = { slug: string; name: string; margin_pct: number | null };

const tl = (n: number | null) => (n == null ? "—" : n.toLocaleString("tr-TR") + " TL");

export default function AdminStoreProductsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [cats, setCats] = useState<Cat[]>([]);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [percent, setPercent] = useState("");
  const [roundTo, setRoundTo] = useState(1000);
  const [includeList, setIncludeList] = useState(true);
  const [msg, setMsg] = useState("");
  const [marginIn, setMarginIn] = useState("");
  const [listMarginIn, setListMarginIn] = useState("");
  const [marginMsg, setMarginMsg] = useState("");

  const fetchRows = () => fetch("/api/admin/store/products").then((r) => r.json());

  useEffect(() => {
    fetchRows().then(setRows);
    fetch("/api/admin/store/categories")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setCats(d));
  }, []);

  const reload = () => fetchRows().then(setRows);

  const visible = useMemo(() => (rows ?? []).filter((r) => !filter || r.category === filter), [rows, filter]);
  const catName = (slug: string) => cats.find((c) => c.slug === slug)?.name ?? slug;

  async function patch(id: number, body: Partial<Row>) {
    setRows((rs) => rs?.map((r) => (r.id === id ? { ...r, ...body } : r)) ?? null);
    await fetch(`/api/admin/store/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async function remove(r: Row) {
    if (!confirm(`"${r.name}" kalıcı olarak silinsin mi? (Geçici gizlemek için göz ikonunu kullanabilirsiniz.)`)) return;
    await fetch(`/api/admin/store/products/${r.id}`, { method: "DELETE" });
    reload();
  }

  function toggleSel(id: number) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  const allSelected = visible.length > 0 && visible.every((r) => selected.has(r.id));

  async function bulkPrice() {
    const p = Number(percent.replace(",", "."));
    if (!p || selected.size === 0) return;
    if (!confirm(`${selected.size} ürünün fiyatı %${p > 0 ? "+" : ""}${p} değişecek. Onaylıyor musunuz?`)) return;
    const res = await fetch("/api/admin/store/products/bulk-price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ percent: p, ids: [...selected], roundTo, includeList }),
    });
    const body = await res.json().catch(() => ({}));
    setMsg(
      res.ok
        ? `${body.updated} ürünün fiyatı güncellendi.${body.skipped ? ` ${body.skipped} ürün maliyetten fiyatlandığı için atlandı (kâr marjıyla değişir).` : ""}`
        : body.error ?? "Güncellenemedi.",
    );
    setPercent("");
    reload();
  }

  async function bulkMargin() {
    if (selected.size === 0) return;
    const parse = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));
    const m = parse(marginIn);
    const lm = parse(listMarginIn);
    if ((m !== null && !Number.isFinite(m)) || (lm !== null && !Number.isFinite(lm))) return;
    const text = [
      m === null ? "ürüne özel kâr marjı kalkacak" : `kâr marjı %${m}`,
      lm === null ? "ürüne özel üstü çizili marjı kalkacak" : `üstü çizili fiyat marjı %${lm}`,
    ].join(", ");
    if (!confirm(`${selected.size} üründe ${text} olacak (boş olanlarda kategori/genel değer geçerli olur). Onaylıyor musunuz?`)) return;
    const res = await fetch("/api/admin/store/products/bulk-margin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected], margin_pct: m, list_margin_pct: lm }),
    });
    const body = await res.json().catch(() => ({}));
    setMarginMsg(res.ok ? `${body.updated} ürünün marjı kaydedildi; ${body.repriced} ürünün fiyatı yeniden hesaplandı.` : body.error ?? "Güncellenemedi.");
    reload();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="admin-input w-auto">
          <option value="">Tüm kategoriler ({rows?.length ?? 0})</option>
          {cats.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name} ({rows?.filter((r) => r.category === c.slug).length ?? 0})
            </option>
          ))}
        </select>
        <Link
          href="/admin/magaza/urunler/yeni"
          className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper hover:bg-sun hover:text-ink"
        >
          <Plus size={16} /> Yeni Ürün
        </Link>
      </div>

      {/* Toplu fiyat */}
      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-paper-raised p-4">
        <div className="flex items-center gap-2 text-[13.5px] font-semibold text-ink">
          <Percent size={16} className="text-brand" /> Toplu fiyat güncelle
          <span className="font-normal text-slate">({selected.size} ürün seçili)</span>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-[12px] text-slate">Değişim (%)</span>
          <input value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="ör. 5 veya -10" className="admin-input w-32" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[12px] text-slate">Yuvarla</span>
          <select value={roundTo} onChange={(e) => setRoundTo(Number(e.target.value))} className="admin-input w-auto">
            <option value={1}>Yuvarlama yok</option>
            <option value={100}>100 TL</option>
            <option value={1000}>1.000 TL</option>
            <option value={5000}>5.000 TL</option>
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2.5 text-[13px]">
          <input type="checkbox" checked={includeList} onChange={(e) => setIncludeList(e.target.checked)} /> Üstü çizili fiyat da değişsin
        </label>
        <button
          type="button"
          onClick={bulkPrice}
          disabled={!percent || selected.size === 0}
          className="rounded-full bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper hover:bg-sun hover:text-ink disabled:opacity-40"
        >
          Uygula
        </button>
        {msg && <p className="w-full text-[13px] text-volt">{msg}</p>}
      </div>

      {/* Toplu kâr marjı */}
      <div className="mt-3 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-paper-raised p-4">
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-2 text-[13.5px] font-semibold text-ink">
            <Percent size={16} className="text-brand" /> Toplu kâr marjı
            <span className="font-normal text-slate">({selected.size} ürün seçili)</span>
          </span>
          <span className="text-[12px] text-slate-soft">Yalnızca alış maliyeti girilmiş ürünlerin fiyatını değiştirir. Boş bırakıp uygularsanız ürün marjı kalkar.</span>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-[12px] text-slate">Kâr marjı (%)</span>
          <input value={marginIn} onChange={(e) => setMarginIn(e.target.value)} placeholder="ör. 25" className="admin-input w-32" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[12px] text-slate">Üstü çizili marjı (%)</span>
          <input value={listMarginIn} onChange={(e) => setListMarginIn(e.target.value)} placeholder="ör. 65" className="admin-input w-32" />
        </label>
        <button
          type="button"
          onClick={bulkMargin}
          disabled={selected.size === 0}
          className="rounded-full bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper hover:bg-sun hover:text-ink disabled:opacity-40"
        >
          Marjı uygula
        </button>
        {marginMsg && <p className="w-full text-[13px] text-volt">{marginMsg}</p>}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-paper-raised">
        {rows === null ? (
          <p className="p-5 text-[13.5px] text-slate-soft">Yükleniyor...</p>
        ) : visible.length === 0 ? (
          <p className="p-5 text-[13.5px] text-slate-soft">Bu kategoride ürün yok.</p>
        ) : (
          <table className="w-full min-w-[760px] text-[14px]">
            <thead>
              <tr className="border-b border-line text-left text-[12px] text-slate">
                <th className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => setSelected(allSelected ? new Set() : new Set(visible.map((r) => r.id)))}
                    aria-label="Tümünü seç"
                  />
                </th>
                <th className="px-2 py-2.5">Ürün</th>
                <th className="px-2 py-2.5 text-right">Fiyat</th>
                <th className="px-2 py-2.5 text-center">İçerik</th>
                <th className="w-40 px-4 py-2.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} className={`border-b border-line last:border-0 ${r.active ? "" : "opacity-50"}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSel(r.id)} aria-label="Seç" />
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-3">
                      <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-paper">
                        {r.image && <Image src={r.image} alt="" fill sizes="64px" className="object-cover" unoptimized />}
                      </span>
                      <span>
                        <span className="block font-semibold text-ink">{r.name}</span>
                        <span className="block text-[12px] text-slate">
                          {catName(r.category)} · sıra {r.sort_order}
                          {!r.active && " · gizli"}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-2 py-3 text-right">
                    {r.list_price != null && r.price != null && r.list_price > r.price && (
                      <span className="block text-[12px] text-slate-soft line-through">{tl(r.list_price)}</span>
                    )}
                    <span className="font-semibold">{tl(r.price)}</span>
                    {r.price_usd != null && (
                      <span className="block text-[12px] text-slate">{Number(r.price_usd).toLocaleString("tr-TR")} USD</span>
                    )}
                    {r.cost_usd != null && (
                      <span className="block text-[11.5px] text-slate-soft" title="Alış (KDV hariç) · kâr marjı">
                        alış {Number(r.cost_usd).toLocaleString("tr-TR")} $ · marj{" "}
                        {r.margin_pct != null
                          ? `%${Number(r.margin_pct).toLocaleString("tr-TR")}`
                          : cats.find((c) => c.slug === r.category)?.margin_pct != null
                            ? `%${Number(cats.find((c) => c.slug === r.category)!.margin_pct).toLocaleString("tr-TR")} (kat.)`
                            : "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-center text-[12px] text-slate">
                    <span title="SEO makalesi">{r.content ? "✓ Açıklama" : "— Açıklama"}</span>
                    <br />
                    <span title="Datasheet PDF">{r.datasheet ? "✓ Datasheet" : "— Datasheet"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => patch(r.id, { featured: !r.featured })}
                        className={`rounded-lg p-2 hover:bg-ink/5 ${r.featured ? "text-sun" : "text-slate-soft"}`}
                        title={r.featured ? "Çok Tercih Edilenlerden çıkar" : "Çok Tercih Edilenlere ekle"}
                      >
                        <Star size={16} className={r.featured ? "fill-sun" : ""} />
                      </button>
                      <button
                        onClick={() => patch(r.id, { active: !r.active })}
                        className="rounded-lg p-2 text-slate hover:bg-ink/5"
                        title={r.active ? "Gizle (yayından kaldır)" : "Yayınla"}
                      >
                        {r.active ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <Link href={`/admin/magaza/urunler/${r.id}`} className="rounded-lg p-2 text-slate hover:bg-ink/5 hover:text-ink" title="Düzenle">
                        <Pencil size={16} />
                      </Link>
                      <button onClick={() => remove(r)} className="rounded-lg p-2 text-slate hover:bg-red-50 hover:text-red-600" title="Sil">
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
      <p className="mt-3 text-[12.5px] text-slate-soft">
        ★ = Çok Tercih Edilen Paketler rafında göster · 👁 = yayında / gizli. Değişiklikler mağazaya hemen yansır.
      </p>
    </div>
  );
}
