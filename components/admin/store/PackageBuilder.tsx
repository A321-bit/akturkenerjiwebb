"use client";

import { useMemo, useState } from "react";
import { Plus, Save, Search, Trash2, Link2, Check } from "lucide-react";
import { wattOf, type CostItem, type PackageLine, type ProductPackage } from "@/lib/package-builder";
import { usdToTl, type PricingSettings } from "@/lib/store-pricing";

export type LinkableProduct = {
  id: number;
  name: string;
  category: string;
  active: boolean;
  costUsd: number | null;
  priceUsd: number | null;
  price: number | null;
  margin: number | null;
};

type Row = { itemId: string | null; name: string; qty: string; unit: string };
type Draft = { id: number | null; name: string; note: string; productId: number | null; rows: Row[] };

const money = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " $";
const tl = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString("tr-TR") + " TL");
/** "1.250,50" / "1250.5" / "1250,5" → 1250.5; boşsa null. */
function parse(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
const text = (n: number | null) => (n == null ? "" : String(Math.round(n * 100) / 100).replace(".", ","));
const norm = (s: string) => s.toLocaleLowerCase("tr").replace(/\s+/g, " ");
const srcLabel = (it: CostItem) => `${it.source ?? "—"}${it.discount_pct ? ` · %${it.discount_pct} iskonto` : ""}`;

export default function PackageBuilder({
  initialItems,
  initialPackages,
  products,
  pricing,
}: {
  initialItems: CostItem[];
  initialPackages: ProductPackage[];
  products: LinkableProduct[];
  pricing: PricingSettings;
}) {
  const [items, setItems] = useState(initialItems);
  const [packages, setPackages] = useState(initialPackages);
  const [prods, setProds] = useState(products);
  const [tab, setTab] = useState<"paket" | "karsilastir" | "liste">("paket");
  const [msg, setMsg] = useState("");
  const vat = 1 + pricing.vatPct / 100;
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const mergeItems = (list: CostItem[]) => setItems((cur) => { const m = new Map(cur.map((i) => [i.id, i])); for (const i of list) m.set(i.id, i); return [...m.values()]; });

  async function call(payload: object) {
    const r = await fetch("/api/admin/paket", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg(d.error ?? `Hata (${r.status})`); return null; }
    return d;
  }

  // Aynı ürün kodunun birden çok listede bulunduğu gruplar.
  const conflicts = useMemo(() => {
    const g = new Map<string, CostItem[]>();
    for (const it of items) if (it.code) g.set(it.code, [...(g.get(it.code) ?? []), it]);
    return [...g.values()].filter((x) => x.length > 1).map((x) => x.sort((a, b) => (a.source ?? "").localeCompare(b.source ?? "")));
  }, [items]);
  const pending = conflicts.filter((g) => g.every((i) => i.active)).length;
  const missing = items.filter((i) => i.active && i.cost_usd == null).length;

  const tabs = [
    { k: "paket" as const, label: "Paketler" },
    { k: "karsilastir" as const, label: `Fiyat karşılaştırma${pending ? ` (${pending} seçim bekliyor)` : ""}` },
    { k: "liste" as const, label: `Maliyet listesi${missing ? ` (${missing} fiyatı eksik)` : ""}` },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">Paket Oluştur</h2>
          <p className="text-[13px] text-slate">Maliyetler USD, KDV dahil (%{pricing.vatPct}) gösterilir. Kur: {pricing.rate ? `${pricing.rate} TL` : "girilmemiş"}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)} className={`rounded-full px-4 py-2 text-[13px] font-semibold ${tab === t.k ? "bg-ink text-paper" : "bg-ink/5 text-slate hover:text-ink"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {msg && <p className="mb-3 rounded-lg bg-sun/15 px-3 py-2 text-[13px] text-ink" onClick={() => setMsg("")}>{msg}</p>}

      {tab === "paket" && (
        <Packages
          items={items}
          byId={byId}
          packages={packages}
          setPackages={setPackages}
          prods={prods}
          setProds={setProds}
          pricing={pricing}
          vat={vat}
          call={call}
          mergeItems={mergeItems}
          setMsg={setMsg}
        />
      )}
      {tab === "karsilastir" && <Compare conflicts={conflicts} vat={vat} call={call} mergeItems={mergeItems} />}
      {tab === "liste" && <CostList items={items} vat={vat} call={call} mergeItems={mergeItems} />}
    </div>
  );
}

type Call = (payload: object) => Promise<Record<string, unknown> | null>;

function Packages({
  items, byId, packages, setPackages, prods, setProds, pricing, vat, call, mergeItems, setMsg,
}: {
  items: CostItem[];
  byId: Map<string, CostItem>;
  packages: ProductPackage[];
  setPackages: React.Dispatch<React.SetStateAction<ProductPackage[]>>;
  prods: LinkableProduct[];
  setProds: React.Dispatch<React.SetStateAction<LinkableProduct[]>>;
  pricing: PricingSettings;
  vat: number;
  call: Call;
  mergeItems: (l: CostItem[]) => void;
  setMsg: (m: string) => void;
}) {
  const empty: Draft = { id: null, name: "", note: "", productId: null, rows: [] };
  const [d, setD] = useState<Draft>(empty);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [custom, setCustom] = useState({ name: "", cost: "" });

  const open = (p: ProductPackage) =>
    setD({ id: p.id, name: p.name, note: p.note ?? "", productId: p.product_id, rows: p.lines.map((l) => ({ itemId: l.itemId, name: l.name, qty: String(l.qty).replace(".", ","), unit: text(l.unitUsd != null ? l.unitUsd * vat : null) })) });
  const setRow = (i: number, k: keyof Row, v: string) => setD((s) => ({ ...s, rows: s.rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)) }));
  const addItem = (it: CostItem) =>
    setD((s) => ({ ...s, rows: [...s.rows, { itemId: it.id, name: it.name, qty: "1", unit: text(it.cost_usd != null ? it.cost_usd * vat : null) }] }));

  const results = useMemo(() => {
    const words = norm(q).split(" ").filter(Boolean);
    if (!words.length) return [];
    return items.filter((i) => i.active && words.every((w) => norm(`${i.name} ${i.code ?? ""} ${i.grp ?? ""}`).includes(w))).slice(0, 30);
  }, [q, items]);

  // Satırlar: birim KDV dahil girilir, KDV hariç saklanır.
  const lines: PackageLine[] = d.rows.map((r) => {
    const inc = parse(r.unit);
    return { itemId: r.itemId, name: r.name.trim(), qty: parse(r.qty) ?? 0, unitUsd: inc != null ? Math.round((inc / vat) * 10000) / 10000 : null };
  });
  const totalExcl = lines.reduce((t, l) => t + l.qty * (l.unitUsd ?? 0), 0);
  const totalIncl = totalExcl * vat;
  const kwp = lines.reduce((t, l) => t + l.qty * wattOf(l.name), 0) / 1000;
  const blanks = lines.filter((l) => l.unitUsd == null).length;
  const product = prods.find((p) => p.id === d.productId) ?? null;
  const newPriceUsd = product?.margin != null && totalExcl > 0 ? Math.round(totalExcl * vat * (1 + product.margin / 100) * 100) / 100 : null;

  async function save(): Promise<ProductPackage | null> {
    if (!d.name.trim()) { setMsg("Pakete bir isim verin."); return null; }
    setBusy(true);
    const r = await call({ action: "savePackage", pkg: { id: d.id, name: d.name, note: d.note, product_id: d.productId, lines } });
    setBusy(false);
    if (!r) return null;
    const pkg = r.pkg as ProductPackage;
    setPackages((ps) => [pkg, ...ps.filter((p) => p.id !== pkg.id)]);
    setD((s) => ({ ...s, id: pkg.id }));
    const learned = (r.learned as CostItem[]) ?? [];
    if (learned.length) mergeItems(learned);
    setMsg(`Paket kaydedildi.${learned.length ? ` ${learned.length} kalemin eksik maliyeti listeye işlendi.` : ""}`);
    return pkg;
  }

  async function link() {
    if (!product) return;
    if (blanks) { setMsg("Maliyeti boş satır var; ürüne bağlamadan önce bütün satırların maliyetini girin."); return; }
    const before = `şu an alış ${money(product.costUsd)}, satış ${money(product.priceUsd)} (${tl(product.price)})`;
    const after = newPriceUsd != null
      ? `yeni alış ${money(Math.round(totalExcl * 100) / 100)} (KDV hariç), satış ${money(newPriceUsd)} (${tl(usdToTl(newPriceUsd, pricing))}), marj %${product.margin}`
      : `yeni alış ${money(Math.round(totalExcl * 100) / 100)}; marj tanımlı olmadığı için satış fiyatı değişmez`;
    if (!confirm(`"${product.name}" ürününe bağlanacak ve sitedeki fiyatı güncellenecek.\n\n${before}\n${after}\n\nOnaylıyor musunuz?`)) return;
    const pkg = await save();
    if (!pkg) return;
    setBusy(true);
    const r = await call({ action: "link", id: pkg.id, productId: product.id });
    setBusy(false);
    if (!r) return;
    const p = r.product as { id: number; cost_usd: number | null; price_usd: number | null; price: number | null };
    setProds((ps) => ps.map((x) => (x.id === p.id ? { ...x, costUsd: p.cost_usd != null ? Number(p.cost_usd) : null, priceUsd: p.price_usd != null ? Number(p.price_usd) : null, price: p.price } : x)));
    setPackages((ps) => ps.map((x) => (x.id === pkg.id ? { ...x, product_id: p.id, linked_at: r.linked_at as string } : x)));
    setMsg(`Bağlandı: ${product.name} · yeni satış ${money(p.price_usd != null ? Number(p.price_usd) : null)} (${tl(p.price)}).`);
  }

  async function remove() {
    if (!d.id || !confirm(`"${d.name}" paketi silinsin mi? (Bağlı ürünün fiyatı değişmez.)`)) return;
    if (await call({ action: "deletePackage", id: d.id })) {
      setPackages((ps) => ps.filter((p) => p.id !== d.id));
      setD(empty);
    }
  }

  async function saveToCatalog(i: number) {
    const l = lines[i];
    if (!l.itemId) return;
    const r = await call({ action: "saveItem", item: { id: l.itemId, name: byId.get(l.itemId)?.name ?? l.name, cost_usd: l.unitUsd } });
    if (r) { mergeItems([r.item as CostItem]); setMsg(`"${l.name}" maliyeti listeye kaydedildi.`); }
  }

  async function addCustom() {
    const inc = parse(custom.cost);
    if (!custom.name.trim()) return;
    const r = await call({ action: "saveItem", item: { name: custom.name, cost_usd: inc != null ? inc / vat : null } });
    if (!r) return;
    const it = r.item as CostItem;
    mergeItems([it]);
    addItem(it);
    setCustom({ name: "", cost: "" });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-2">
        <button onClick={() => setD(empty)} className="flex w-full items-center gap-2 rounded-xl bg-brand px-3 py-2.5 text-[13.5px] font-semibold text-paper hover:bg-brand-deep">
          <Plus size={16} /> Yeni paket
        </button>
        {packages.map((p) => (
          <button key={p.id} onClick={() => open(p)} className={`block w-full rounded-xl border px-3 py-2 text-left text-[13px] ${d.id === p.id ? "border-brand bg-brand/5" : "border-line bg-paper-raised hover:border-ink/30"}`}>
            <span className="font-semibold">{p.name}</span>
            <span className="block text-[11.5px] text-slate">{p.lines.length} kalem{p.product_id ? ` · ${prods.find((x) => x.id === p.product_id)?.name ?? "ürün"}e bağlı` : ""}</span>
          </button>
        ))}
        {!packages.length && <p className="text-[12.5px] text-slate">Henüz paket yok.</p>}
      </aside>

      <section className="min-w-0 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-[12.5px] font-semibold text-slate">Paket adı
            <input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="Örn. 10 kW On Grid Güneş Paneli" className="admin-input mt-1" />
          </label>
          <label className="text-[12.5px] font-semibold text-slate">Not
            <input value={d.note} onChange={(e) => setD({ ...d, note: e.target.value })} placeholder="İsteğe bağlı" className="admin-input mt-1" />
          </label>
        </div>

        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead className="bg-paper-raised text-left text-[11.5px] uppercase tracking-wide text-slate">
              <tr><th className="px-3 py-2">Kalem</th><th className="w-20 px-2 py-2">Adet</th><th className="w-36 px-2 py-2">Birim (KDV dahil)</th><th className="w-32 px-2 py-2 text-right">Toplam (KDV dahil)</th><th className="w-10" /></tr>
            </thead>
            <tbody>
              {d.rows.map((r, i) => {
                const it = r.itemId ? byId.get(r.itemId) : undefined;
                const catIncl = it?.cost_usd != null ? it.cost_usd * vat : null;
                const l = lines[i];
                const differs = it && l.unitUsd != null && (it.cost_usd == null || Math.abs(l.unitUsd - it.cost_usd) > 0.005);
                return (
                  <tr key={i} className="border-t border-line align-top">
                    <td className="px-3 py-2">
                      <input value={r.name} onChange={(e) => setRow(i, "name", e.target.value)} className="w-full bg-transparent font-medium outline-none" />
                      <span className="block text-[11.5px] text-slate">{it ? srcLabel(it) : "Listede yok"}{catIncl != null && differs ? ` · listede ${money(catIncl)}` : ""}</span>
                      {differs && (
                        it!.cost_usd == null
                          ? <span className="text-[11.5px] text-brand">Kaydedince bu maliyet listeye işlenecek.</span>
                          : <button onClick={() => saveToCatalog(i)} className="text-[11.5px] font-semibold text-brand hover:underline">Bu fiyatı listeye kaydet</button>
                      )}
                    </td>
                    <td className="px-2 py-2"><input inputMode="decimal" value={r.qty} onChange={(e) => setRow(i, "qty", e.target.value)} className="admin-input" /></td>
                    <td className="px-2 py-2"><input inputMode="decimal" value={r.unit} onChange={(e) => setRow(i, "unit", e.target.value)} placeholder="fiyat girin" className={`admin-input ${l.unitUsd == null ? "border-sun" : ""}`} /></td>
                    <td className="px-2 py-2 text-right font-semibold">{l.unitUsd != null ? money(l.qty * l.unitUsd * vat) : "—"}</td>
                    <td className="px-2 py-2"><button onClick={() => setD((s) => ({ ...s, rows: s.rows.filter((_, j) => j !== i) }))} className="text-slate hover:text-red-600" aria-label="Satırı sil"><Trash2 size={15} /></button></td>
                  </tr>
                );
              })}
              {!d.rows.length && <tr><td colSpan={5} className="px-3 py-6 text-center text-slate">Aşağıdan ürün arayıp pakete ekleyin.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-line bg-paper-raised p-4">
          <label className="flex items-center gap-2 rounded-lg border border-line bg-paper px-3"><Search size={15} className="text-slate" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ürün ara: 635Wp, Castor 20, solar kablo, konnektör…" className="w-full bg-transparent py-2 text-[13.5px] outline-none" />
          </label>
          {results.length > 0 && (
            <ul className="mt-2 max-h-72 divide-y divide-line overflow-y-auto rounded-lg border border-line bg-paper">
              {results.map((it) => (
                <li key={it.id}>
                  <button onClick={() => addItem(it)} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] hover:bg-brand/5">
                    <span className="min-w-0"><span className="block truncate font-medium">{it.name}</span><span className="text-[11.5px] text-slate">{it.code ? `${it.code} · ` : ""}{srcLabel(it)}</span></span>
                    <span className={`shrink-0 font-semibold ${it.cost_usd == null ? "text-sun" : ""}`}>{it.cost_usd != null ? money(it.cost_usd * vat) : "fiyat yok"}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]">
            <span className="text-slate">Listede olmayan kalem (pano, işçilik, proje…):</span>
            <input value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} placeholder="Kalem adı" className="admin-input w-56" />
            <input inputMode="decimal" value={custom.cost} onChange={(e) => setCustom({ ...custom, cost: e.target.value })} placeholder="KDV dahil $" className="admin-input w-28" />
            <button onClick={addCustom} className="rounded-lg bg-ink px-3 py-2 font-semibold text-paper hover:bg-brand">Listeye ve pakete ekle</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-paper-raised p-4 text-[13.5px]">
            <p className="mb-2 font-semibold">Toplam maliyet</p>
            <dl className="space-y-1">
              <div className="flex justify-between"><dt className="text-slate">KDV hariç</dt><dd>{money(totalExcl)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate">KDV (%{pricing.vatPct})</dt><dd>{money(totalIncl - totalExcl)}</dd></div>
              <div className="flex justify-between border-t border-line pt-1 text-[15px] font-bold"><dt>KDV dahil</dt><dd>{money(totalIncl)}</dd></div>
              <div className="flex justify-between text-slate"><dt>TL karşılığı</dt><dd>{pricing.rate ? tl(Math.round(totalIncl * pricing.rate)) : "kur yok"}</dd></div>
              {kwp > 0 && <div className="flex justify-between text-slate"><dt>Panel gücü</dt><dd>{kwp.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} kWp · {money(totalIncl / kwp)}/kWp</dd></div>}
              {blanks > 0 && <p className="pt-1 text-[12.5px] text-sun">{blanks} satırın maliyeti boş, toplama girmedi.</p>}
            </dl>
          </div>

          <div className="rounded-xl border border-line bg-paper-raised p-4 text-[13.5px]">
            <p className="mb-2 font-semibold">Mağaza ürününe bağla</p>
            <select value={d.productId ?? ""} onChange={(e) => setD({ ...d, productId: e.target.value ? Number(e.target.value) : null })} className="admin-input">
              <option value="">Ürün seçin…</option>
              {[...new Set(prods.map((p) => p.category))].map((c) => (
                <optgroup key={c} label={c}>
                  {prods.filter((p) => p.category === c).map((p) => <option key={p.id} value={p.id}>{p.name}{p.active ? "" : " (pasif)"}</option>)}
                </optgroup>
              ))}
            </select>
            {product && (
              <dl className="mt-3 space-y-1">
                <div className="flex justify-between"><dt className="text-slate">Şu anki alış (KDV hariç)</dt><dd>{money(product.costUsd)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate">Şu anki satış</dt><dd>{money(product.priceUsd)} · {tl(product.price)}</dd></div>
                <div className="flex justify-between border-t border-line pt-1"><dt className="text-slate">Yeni alış (KDV hariç)</dt><dd className="font-semibold">{money(totalExcl)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate">Yeni satış {product.margin != null ? `(marj %${product.margin})` : ""}</dt><dd className="font-semibold">{newPriceUsd != null ? `${money(newPriceUsd)} · ${tl(usdToTl(newPriceUsd, pricing))}` : "marj yok, değişmez"}</dd></div>
              </dl>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button disabled={busy} onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper hover:bg-brand disabled:opacity-50"><Save size={16} /> Paketi kaydet</button>
          <button disabled={busy || !product || !d.rows.length} onClick={link} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-[13.5px] font-semibold text-paper hover:bg-brand-deep disabled:opacity-50"><Link2 size={16} /> Kaydet ve ürüne bağla</button>
          {d.id && <button disabled={busy} onClick={remove} className="ml-auto inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold text-red-600 hover:bg-red-50"><Trash2 size={16} /> Sil</button>}
        </div>
      </section>
    </div>
  );
}

function Compare({ conflicts, vat, call, mergeItems }: { conflicts: CostItem[][]; vat: number; call: Call; mergeItems: (l: CostItem[]) => void }) {
  const [onlyPending, setOnlyPending] = useState(true);
  const [q, setQ] = useState("");
  const list = conflicts.filter((g) => (!onlyPending || g.every((i) => i.active)) && (!q || norm(g.map((i) => `${i.name} ${i.code}`).join(" ")).includes(norm(q))));
  async function choose(id: string) {
    const r = await call({ action: "choose", id });
    if (r) mergeItems(r.items as CostItem[]);
  }
  return (
    <div>
      <p className="mb-3 text-[13px] text-slate">Aynı ürün kodu iki listede de var. Uygulanacak fiyatı seçin; diğeri pasife alınır ve paket aramasında görünmez. Seçimi sonradan değiştirebilirsiniz.</p>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-[13px]">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ara…" className="admin-input w-56" />
        <label className="flex items-center gap-2"><input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} /> Sadece seçim bekleyenler</label>
        <span className="text-slate">{list.length} ürün</span>
      </div>
      <div className="space-y-3">
        {list.slice(0, 150).map((g) => {
          const costs = g.map((i) => i.cost_usd).filter((c): c is number => c != null);
          const min = costs.length ? Math.min(...costs) : null;
          const decided = !g.every((i) => i.active);
          return (
            <div key={g[0].code} className="rounded-xl border border-line bg-paper-raised p-3">
              <p className="mb-2 text-[13px] font-semibold">{g[0].name} <span className="font-mono-data text-[11.5px] font-normal text-slate">{g[0].code}</span></p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {g.map((it) => {
                  const chosen = decided && it.active;
                  return (
                    <div key={it.id} className={`rounded-lg border p-3 text-[13px] ${chosen ? "border-brand bg-brand/5" : decided ? "border-line opacity-60" : "border-line bg-paper"}`}>
                      <p className="text-[11.5px] font-semibold uppercase tracking-wide text-brand">{it.source}</p>
                      <p className="text-[12px] text-slate">{it.discount_pct != null ? `%${it.discount_pct} iskonto` : "iskonto yok"} · liste {money(it.list)}{it.currency !== "USD" ? ` ${it.currency}` : ""}</p>
                      <p className="mt-1">Alış KDV hariç: <strong>{money(it.cost_usd)}</strong></p>
                      <p>KDV dahil: <strong>{money(it.cost_usd != null ? it.cost_usd * vat : null)}</strong>{min != null && it.cost_usd === min && costs.length > 1 ? <span className="ml-1 rounded bg-volt/20 px-1.5 text-[11px] font-semibold">en ucuz</span> : null}</p>
                      {it.name !== g[0].name && <p className="mt-1 text-[11.5px] text-slate">{it.name}</p>}
                      {chosen ? (
                        <p className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand"><Check size={14} /> Uygulanıyor</p>
                      ) : (
                        <button onClick={() => choose(it.id)} className="mt-2 rounded-lg bg-ink px-3 py-1.5 text-[12.5px] font-semibold text-paper hover:bg-brand">Bunu uygula</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {list.length > 150 && <p className="text-[12.5px] text-slate">İlk 150 gösteriliyor; aramayı daraltın.</p>}
        {!list.length && <p className="text-[13px] text-slate">Seçim bekleyen ürün yok.</p>}
      </div>
    </div>
  );
}

function CostList({ items, vat, call, mergeItems }: { items: CostItem[]; vat: number; call: Call; mergeItems: (l: CostItem[]) => void }) {
  const [q, setQ] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [edit, setEdit] = useState<Record<string, string>>({});
  const words = norm(q).split(" ").filter(Boolean);
  const list = items
    .filter((i) => (!onlyMissing || (i.active && i.cost_usd == null)) && words.every((w) => norm(`${i.name} ${i.code ?? ""} ${i.grp ?? ""} ${i.source ?? ""}`).includes(w)))
    .sort((a, b) => Number(b.active) - Number(a.active) || (a.grp ?? "").localeCompare(b.grp ?? "") || a.name.localeCompare(b.name));
  async function saveCost(it: CostItem) {
    const v = edit[it.id];
    if (v === undefined) return;
    const inc = parse(v);
    const r = await call({ action: "saveItem", item: { id: it.id, name: it.name, cost_usd: inc != null ? inc / vat : null } });
    if (r) { mergeItems([r.item as CostItem]); setEdit((e) => { const n = { ...e }; delete n[it.id]; return n; }); }
  }
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-[13px]">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ara: ürün, kod, grup, liste…" className="admin-input w-72" />
        <label className="flex items-center gap-2"><input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} /> Sadece fiyatı eksik olanlar</label>
        <span className="text-slate">{list.length} kalem</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead className="bg-paper-raised text-left text-[11.5px] uppercase tracking-wide text-slate">
            <tr><th className="px-3 py-2">Kalem</th><th className="px-2 py-2">Liste / iskonto</th><th className="px-2 py-2 text-right">Alış KDV hariç</th><th className="w-40 px-2 py-2">KDV dahil (düzenle)</th></tr>
          </thead>
          <tbody>
            {list.slice(0, 300).map((it) => (
              <tr key={it.id} className={`border-t border-line ${it.active ? "" : "opacity-50"}`}>
                <td className="px-3 py-2"><span className="font-medium">{it.name}</span><span className="block text-[11.5px] text-slate">{it.code ? `${it.code} · ` : ""}{it.grp ?? ""}{it.active ? "" : " · pasif (diğer liste seçildi)"}</span></td>
                <td className="px-2 py-2 text-[12px] text-slate">{it.source}<br />{it.discount_pct != null ? `%${it.discount_pct}` : ""} {it.list != null ? `· liste ${money(it.list)}` : ""}{it.manual ? " · elle girildi" : ""}</td>
                <td className="px-2 py-2 text-right">{money(it.cost_usd)}</td>
                <td className="px-2 py-2">
                  <input
                    inputMode="decimal"
                    value={edit[it.id] ?? text(it.cost_usd != null ? it.cost_usd * vat : null)}
                    onChange={(e) => setEdit({ ...edit, [it.id]: e.target.value })}
                    onBlur={() => saveCost(it)}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                    placeholder="fiyat girin"
                    className={`admin-input ${it.cost_usd == null ? "border-sun" : ""}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.length > 300 && <p className="mt-2 text-[12.5px] text-slate">İlk 300 gösteriliyor; aramayı daraltın.</p>}
    </div>
  );
}
