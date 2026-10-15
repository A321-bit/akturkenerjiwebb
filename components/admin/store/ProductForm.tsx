"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploadField from "../ImageUploadField";
import GalleryUploadField from "../GalleryUploadField";
import MarkdownEditorField from "../MarkdownEditorField";
import FileUploadField from "../FileUploadField";
import { Field, SaveBar, Section, Toggle, slugify } from "./fields";

export type ProductFormValues = {
  id?: number;
  slug: string;
  category: string;
  name: string;
  power: string;
  price: number | null;
  list_price: number | null;
  price_usd: number | null;
  list_price_usd: number | null;
  install_included: boolean;
  image: string | null;
  gallery: string[];
  contents: string[];
  content: string;
  datasheet: string | null;
  featured: boolean;
  active: boolean;
  sort_order: number;
  seo_title: string;
  seo_description: string;
};

const tl = (n: number) => n.toLocaleString("tr-TR") + " TL";
const usdText = (n: number | null) => (n == null ? "" : String(n).replace(".", ","));
/** "1.250,50" / "1250.5" / "1250,5" → 1250.5 */
function parseUsd(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const norm = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t;
  const n = Number(norm);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

export default function ProductForm({
  initial,
  categories,
  lowest30,
  pricing,
}: {
  initial: ProductFormValues;
  categories: { slug: string; name: string }[];
  /** Son 30 günün en düşük satış fiyatı (fiyat geçmişinden). */
  lowest30?: number | null;
  /** Mağaza Ayarları'ndaki USD kuru ve TL yuvarlama basamağı. */
  pricing: { rate: number | null; round: number };
}) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [contentsText, setContentsText] = useState(initial.contents.join("\n"));
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [usdIn, setUsdIn] = useState(usdText(initial.price_usd));
  const [listUsdIn, setListUsdIn] = useState(usdText(initial.list_price_usd));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setV((s) => ({ ...s, [key]: value }));
  }
  const num = (s: string) => (s.trim() === "" ? null : Math.round(Number(s.replace(/\./g, "").replace(",", "."))));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...v,
      price_usd: parseUsd(usdIn),
      list_price_usd: parseUsd(listUsdIn),
      contents: contentsText.split("\n").map((x) => x.trim()).filter(Boolean),
      content: v.content.trim() || null,
      seo_title: v.seo_title.trim() || null,
      seo_description: v.seo_description.trim() || null,
    };
    const res = await fetch(v.id ? `/api/admin/store/products/${v.id}` : "/api/admin/store/products", {
      method: v.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg: string = body.error ?? "Kaydedilemedi.";
      setError(msg.includes("duplicate") ? "Bu URL (slug) başka bir üründe kullanılıyor." : msg);
      setSaving(false);
      return;
    }
    router.push("/admin/magaza");
    router.refresh();
  }

  const toTl = (usd: number | null) =>
    usd != null && pricing.rate ? Math.max(pricing.round, Math.round((usd * pricing.rate) / pricing.round) * pricing.round) : null;
  const usd = parseUsd(usdIn);
  const listUsd = parseUsd(listUsdIn);
  // USD girildiyse TL fiyat kurla hesaplanır; girilmediyse TL elle yazılır.
  const shownPrice = usd != null ? toTl(usd) : v.price;
  const shownList = listUsd != null ? toTl(listUsd) : v.list_price;
  const discount = shownPrice && shownList && shownList > shownPrice ? Math.round(((shownList - shownPrice) / shownList) * 100) : null;
  const rateText = pricing.rate ? pricing.rate.toLocaleString("tr-TR", { maximumFractionDigits: 4 }) : null;

  return (
    <form onSubmit={submit} className="flex max-w-3xl flex-col gap-5">
      <Section title="Temel bilgiler">
        <Field label="Ürün adı">
          <input
            required
            value={v.name}
            onChange={(e) => {
              set("name", e.target.value);
              if (!slugTouched) set("slug", slugify(e.target.value));
            }}
            className="admin-input"
            placeholder="10 kW On Grid Güneş Paneli Paketi"
          />
        </Field>
        <Field label="URL (slug)" hint={`Sayfa adresi: /magaza/${v.category || "kategori"}/${v.slug || "..."}`}>
          <input
            required
            value={v.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", slugify(e.target.value));
            }}
            className="admin-input"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kategori">
            <select required value={v.category} onChange={(e) => set("category", e.target.value)} className="admin-input">
              <option value="">Seçin</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Güç etiketi" hint="Kartta görselin üstünde görünür (ör. 10 kW).">
            <input value={v.power} onChange={(e) => set("power", e.target.value)} className="admin-input" placeholder="10 kW" />
          </Field>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <Toggle checked={v.active} onChange={(x) => set("active", x)} label="Yayında" />
          <Toggle checked={v.featured} onChange={(x) => set("featured", x)} label="Çok Tercih Edilenlerde göster" />
          <Toggle checked={v.install_included} onChange={(x) => set("install_included", x)} label="Kurulum dahil" />
        </div>
        <Field label="Sıra" hint="Küçük sayı önce gösterilir.">
          <input type="number" value={v.sort_order} onChange={(e) => set("sort_order", Number(e.target.value) || 0)} className="admin-input w-32" />
        </Field>
      </Section>

      <Section
        title="Fiyat"
        desc={rateText ? `Fiyatı USD (KDV dahil) girin; TL fiyat kurla otomatik hesaplanır. Güncel kur: 1 USD = ${rateText} TL` : undefined}
      >
        {!rateText && (
          <p className="rounded-lg bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
            USD kuru girilmemiş. Önce Mağaza Ayarları → Döviz kuru bölümünden kuru girin; o zamana kadar TL fiyat elle yazılabilir.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Satış fiyatı (USD, KDV dahil)" hint={usd != null && shownPrice ? `= ${tl(shownPrice)} (sitede görünen)` : "Boş bırakılırsa aşağıdaki TL fiyat kullanılır."}>
            <input inputMode="decimal" value={usdIn} onChange={(e) => setUsdIn(e.target.value)} className="admin-input" placeholder="ör. 6.700" />
          </Field>
          <Field label="Üstü çizili eski fiyat (USD)" hint={listUsd != null && shownList ? `= ${tl(shownList)}${discount ? ` · kartta %${discount} indirim` : ""}` : "İndirim yoksa boş bırakın."}>
            <input inputMode="decimal" value={listUsdIn} onChange={(e) => setListUsdIn(e.target.value)} className="admin-input" />
          </Field>
        </div>
        {(usd == null || listUsd == null) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {usd == null ? (
              <Field label="Satış fiyatı (TL, elle)" hint={v.price ? tl(v.price) : "Boşsa \"Fiyat için sorun\" yazar."}>
                <input inputMode="numeric" value={v.price ?? ""} onChange={(e) => set("price", num(e.target.value))} className="admin-input" />
              </Field>
            ) : (
              <div />
            )}
            {listUsd == null && (
              <Field label="Üstü çizili fiyat (TL, elle)" hint={v.list_price ? tl(v.list_price) : undefined}>
                <input inputMode="numeric" value={v.list_price ?? ""} onChange={(e) => set("list_price", num(e.target.value))} className="admin-input" />
              </Field>
            )}
          </div>
        )}
        <p className="rounded-lg bg-sun/10 px-3 py-2.5 text-[12.5px] leading-relaxed text-ink">
          <strong>Yasal not:</strong> Üstü çizili fiyat, indirimden önceki <strong>son 30 günde uygulanan en düşük fiyat</strong> olmalı.
          {lowest30 != null && (
            <>
              {" "}Bu ürünün son 30 gündeki en düşük TL satış fiyatı: <strong>{tl(lowest30)}</strong> (kur değişimleri dahil).
            </>
          )}
        </p>
      </Section>

      <Section title="Görseller">
        <Field label="Ana görsel (kartta ve galeride ilk sırada)">
          <ImageUploadField value={v.image} onChange={(url) => set("image", url)} />
        </Field>
        <Field label="Galeri (ürün sayfasında ana görselin yanında)">
          <GalleryUploadField value={v.gallery} onChange={(urls) => set("gallery", urls)} />
        </Field>
      </Section>

      <Section title="Paket içeriği ve datasheet">
        <Field label="Paket içeriği" hint="Her satıra bir madde. Ürün açıklaması yazılmadıysa ürün sayfasında liste olarak gösterilir.">
          <textarea rows={6} value={contentsText} onChange={(e) => setContentsText(e.target.value)} className="admin-input" />
        </Field>
        <Field label="Teknik datasheet (PDF)" hint="Yüklenince ürün sayfasında &quot;Datasheet İndir&quot; butonu çıkar.">
          <FileUploadField value={v.datasheet} onChange={(url) => set("datasheet", url)} accept="application/pdf" label="PDF yükle" />
        </Field>
      </Section>

      <Section title="Ürün açıklaması (SEO makalesi)" desc="Ürün sayfasındaki &quot;Ürün Açıklaması&quot; sekmesi. Başlıklar için ## kullanın; S.S.S. de buraya yazılabilir.">
        <MarkdownEditorField value={v.content} onChange={(x) => set("content", x)} required={false} rows={18} />
      </Section>

      <Section title="SEO" desc="Boş bırakılırsa otomatik oluşturulur.">
        <Field label="Sayfa başlığı (title)" hint={`Boşsa: "${v.name || "Ürün adı"} Fiyatı | Aktürk Enerji"`}>
          <input value={v.seo_title} onChange={(e) => set("seo_title", e.target.value)} className="admin-input" />
        </Field>
        <Field label="Meta açıklama" hint={`${v.seo_description.length} karakter (ideal 140–160)`}>
          <textarea rows={3} value={v.seo_description} onChange={(e) => set("seo_description", e.target.value)} className="admin-input" />
        </Field>
      </Section>

      <SaveBar saving={saving} error={error} onCancel={() => router.push("/admin/magaza")} />
    </form>
  );
}
