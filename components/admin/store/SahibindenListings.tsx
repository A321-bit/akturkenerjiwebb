"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export type ListingItem = { slug: string; name: string; category: string; pick: number; title: string; description: string; price: string };

function CopyBox({ label, value, rows, onChange }: { label: string; value: string; rows?: number; onChange: (v: string) => void }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-semibold">{label}</span>
        {rows == null && <span className="text-[12px] text-slate">{value.length}/60</span>}
        <span className="flex-1" />
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          }}
          className="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-[12.5px] font-semibold text-paper hover:bg-sun hover:text-ink"
        >
          {done ? <Check size={14} /> : <Copy size={14} />} {done ? "Kopyalandı" : "Kopyala"}
        </button>
      </div>
      {rows ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="admin-input font-mono text-[12.5px] leading-relaxed" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className="admin-input" />
      )}
    </div>
  );
}

// Sahibinden ilanı: paket seç → başlık / açıklama / fiyat kopyala. Düzenleme yalnızca
// bu ekranda geçerlidir (kaydedilmez); metin ürün verisinden her açılışta yeniden üretilir.
export default function SahibindenListings({ items }: { items: ListingItem[] }) {
  const [slug, setSlug] = useState(items[0]?.slug ?? "");
  const item = items.find((x) => x.slug === slug);
  const [edits, setEdits] = useState<Record<string, { title?: string; description?: string }>>({});
  const cur = item ? { title: edits[slug]?.title ?? item.title, description: edits[slug]?.description ?? item.description } : null;
  const set = (k: "title" | "description", v: string) => setEdits((e) => ({ ...e, [slug]: { ...e[slug], [k]: v } }));

  const picks = items.filter((x) => x.pick >= 0);
  const rest = items.filter((x) => x.pick < 0);

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Sahibinden İlanları</h1>
        <p className="mt-1 text-[13.5px] text-slate">
          Paketi seçin; başlık, açıklama ve fiyat hazır. &quot;Kopyala&quot; ile sahibinden.com ilan formuna yapıştırın. Açıklamada
          sahibinden kuralları gereği web adresi, e-posta ve telefon yer almaz. Metin paket içeriği değiştikçe kendiliğinden güncellenir.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {picks.map((x) => (
          <button
            key={x.slug}
            type="button"
            onClick={() => setSlug(x.slug)}
            className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold ${x.slug === slug ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}
          >
            {x.pick + 1}. {x.name.replace(/ Güneş Paneli| Paketi| Paket\b/g, "")}
          </button>
        ))}
        <select value={picks.some((x) => x.slug === slug) ? "" : slug} onChange={(e) => e.target.value && setSlug(e.target.value)} className="admin-input w-auto">
          <option value="">Diğer paketler…</option>
          {rest.map((x) => (
            <option key={x.slug} value={x.slug}>
              {x.category} · {x.name}
            </option>
          ))}
        </select>
      </div>

      {item && cur && (
        <section className="flex flex-col gap-4 rounded-2xl border border-line bg-paper-raised p-5">
          <p className="text-[12.5px] text-slate">{item.category}</p>
          <CopyBox label="İlan başlığı" value={cur.title} onChange={(v) => set("title", v)} />
          <CopyBox label="Fiyat (KDV dahil)" value={item.price.replace(" TL", "")} rows={undefined} onChange={() => {}} />
          <CopyBox label="Açıklama" value={cur.description} rows={24} onChange={(v) => set("description", v)} />
          <p className="text-[12px] text-slate">
            Fotoğraf: ürün sayfasındaki görselleri ve paylaşım kartını kullanabilirsiniz (
            <a href={`/social/urun/${item.slug}?f=sq&fiyat=1`} target="_blank" rel="noreferrer" className="text-brand underline">
              fiyatlı kare görseli aç
            </a>
            ).
          </p>
        </section>
      )}
    </div>
  );
}
