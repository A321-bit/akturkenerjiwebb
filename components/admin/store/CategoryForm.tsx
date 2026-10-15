"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploadField from "../ImageUploadField";
import MarkdownEditorField from "../MarkdownEditorField";
import { CATEGORY_ICONS } from "@/components/store/category-icons";
import { Field, SaveBar, Section, Toggle, slugify } from "./fields";

export type CategoryFormValues = {
  id?: number;
  slug: string;
  name: string;
  short: string;
  intro: string;
  content: string;
  image: string | null;
  icon: string;
  seo_title: string;
  seo_description: string;
  sort_order: number;
  active: boolean;
};

export default function CategoryForm({ initial }: { initial: CategoryFormValues }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) {
    setV((s) => ({ ...s, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (initial.id && initial.slug !== v.slug && !confirm("Kategorinin adresi (URL) değişecek. Eski adres çalışmayacak. Devam edilsin mi?")) return;
    setSaving(true);
    setError("");
    const payload = {
      ...v,
      content: v.content.trim() || null,
      seo_title: v.seo_title.trim() || null,
      seo_description: v.seo_description.trim() || null,
    };
    const res = await fetch(v.id ? `/api/admin/store/categories/${v.id}` : "/api/admin/store/categories", {
      method: v.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg: string = body.error ?? "Kaydedilemedi.";
      setError(msg.includes("duplicate") ? "Bu URL (slug) başka bir kategoride kullanılıyor." : msg);
      setSaving(false);
      return;
    }
    router.push("/admin/magaza/kategoriler");
    router.refresh();
  }

  const SelectedIcon = CATEGORY_ICONS[v.icon]?.icon;

  return (
    <form onSubmit={submit} className="flex max-w-3xl flex-col gap-5">
      <Section title="Temel bilgiler">
        <Field label="Kategori adı">
          <input
            required
            value={v.name}
            onChange={(e) => {
              set("name", e.target.value);
              if (!slugTouched) set("slug", slugify(e.target.value));
            }}
            className="admin-input"
          />
        </Field>
        <Field label="URL (slug)" hint={`Sayfa adresi: /magaza/${v.slug || "..."}`}>
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
        <Field label="Kısa açıklama" hint="Kategori rafında ve kutucuklarda adın altında görünür.">
          <input value={v.short} onChange={(e) => set("short", e.target.value)} className="admin-input" />
        </Field>
        <Field label="Giriş metni" hint="Raf banner'ında ve uzun yazı yokken kategori sayfasının altında görünür; meta açıklama olarak da kullanılır.">
          <textarea rows={3} value={v.intro} onChange={(e) => set("intro", e.target.value)} className="admin-input" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Menü ikonu">
            <div className="flex items-center gap-2">
              {SelectedIcon && <SelectedIcon size={20} className="text-brand" />}
              <select value={v.icon} onChange={(e) => set("icon", e.target.value)} className="admin-input">
                {Object.entries(CATEGORY_ICONS).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </Field>
          <Field label="Sıra" hint="Menüde ve ana sayfada küçük sayı önce.">
            <input type="number" value={v.sort_order} onChange={(e) => set("sort_order", Number(e.target.value) || 0)} className="admin-input" />
          </Field>
        </div>
        <Toggle checked={v.active} onChange={(x) => set("active", x)} label="Yayında (kapalıysa kategori ve ürünleri gizlenir)" />
      </Section>

      <Section title="Kategori görseli" desc="Ana sayfadaki kategori rafının sol banner'ı.">
        <ImageUploadField value={v.image} onChange={(url) => set("image", url)} />
      </Section>

      <Section title="Kategori SEO yazısı" desc="Kategori sayfasında ürünlerin altında &quot;… Hakkında&quot; başlığıyla görünür.">
        <MarkdownEditorField value={v.content} onChange={(x) => set("content", x)} required={false} rows={18} />
      </Section>

      <Section title="SEO" desc="Boş bırakılırsa otomatik oluşturulur.">
        <Field label="Sayfa başlığı (title)" hint={`Boşsa: "${v.name || "Kategori"} ve Fiyatları | Aktürk Enerji"`}>
          <input value={v.seo_title} onChange={(e) => set("seo_title", e.target.value)} className="admin-input" />
        </Field>
        <Field label="Meta açıklama" hint={`${v.seo_description.length} karakter (ideal 140–160)`}>
          <textarea rows={3} value={v.seo_description} onChange={(e) => set("seo_description", e.target.value)} className="admin-input" />
        </Field>
      </Section>

      <SaveBar saving={saving} error={error} onCancel={() => router.push("/admin/magaza/kategoriler")} />
    </form>
  );
}
