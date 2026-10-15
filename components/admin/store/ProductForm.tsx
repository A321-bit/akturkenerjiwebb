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

export default function ProductForm({
  initial,
  categories,
  lowest30,
}: {
  initial: ProductFormValues;
  categories: { slug: string; name: string }[];
  /** Son 30 günün en düşük satış fiyatı (fiyat geçmişinden). */
  lowest30?: number | null;
}) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [contentsText, setContentsText] = useState(initial.contents.join("\n"));
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
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

  const discount = v.price && v.list_price && v.list_price > v.price ? Math.round(((v.list_price - v.price) / v.list_price) * 100) : null;

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

      <Section title="Fiyat" desc="Fiyatlar KDV dahil, TL olarak girilir.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Satış fiyatı (TL)" hint={v.price ? tl(v.price) : "Boş bırakılırsa \"Fiyat için sorun\" yazar."}>
            <input inputMode="numeric" value={v.price ?? ""} onChange={(e) => set("price", num(e.target.value))} className="admin-input" />
          </Field>
          <Field label="Üstü çizili eski fiyat (TL)" hint={discount ? `Kartta %${discount} indirim görünür.` : "İndirim yoksa boş bırakın."}>
            <input inputMode="numeric" value={v.list_price ?? ""} onChange={(e) => set("list_price", num(e.target.value))} className="admin-input" />
          </Field>
        </div>
        <p className="rounded-lg bg-sun/10 px-3 py-2.5 text-[12.5px] leading-relaxed text-ink">
          <strong>Yasal not:</strong> Üstü çizili fiyat, indirimden önceki <strong>son 30 günde uygulanan en düşük fiyat</strong> olmalı.
          {lowest30 != null && (
            <>
              {" "}Bu ürünün son 30 gündeki en düşük satış fiyatı: <strong>{tl(lowest30)}</strong>.
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
