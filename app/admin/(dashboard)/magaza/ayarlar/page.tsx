"use client";

import { useEffect, useState } from "react";
import FileUploadField from "@/components/admin/FileUploadField";
import MarkdownEditorField from "@/components/admin/MarkdownEditorField";
import ItemListEditor from "@/components/admin/store/ItemListEditor";
import { Field, SaveBar, Section } from "@/components/admin/store/fields";

type Item = { title: string; text: string };
type Settings = {
  prices_updated: string;
  price_note: string;
  featured_title: string;
  featured_subtitle: string;
  brands_title: string;
  brands: { name: string; logo: string }[];
  faqs: { q: string; a: string }[];
  trust_items: Item[];
  order_steps: Item[];
  about_title: string;
  about_content: string;
  footer_text: string;
};

export default function AdminStoreSettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/admin/store/settings")
      .then((r) => r.json())
      .then((d) => d && !d.error && setS(d));
  }, []);

  if (!s) return <p className="text-[13.5px] text-slate-soft">Yükleniyor...</p>;

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setS((x) => (x ? { ...x, [key]: value } : x));
    setDone(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/store/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Kaydedilemedi.");
      return;
    }
    setDone(true);
  }

  return (
    <form onSubmit={save} className="flex max-w-3xl flex-col gap-5">
      <Section title="Fiyat bilgisi">
        <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
          <Field label="Fiyat güncelleme tarihi">
            <input value={s.prices_updated} onChange={(e) => set("prices_updated", e.target.value)} className="admin-input" placeholder="15.10.2026" />
          </Field>
          <Field label="Fiyat notu" hint="{tarih} yazan yere yandaki tarih gelir. &quot;Sipariş nasıl işler?&quot; kutusunun altında görünür.">
            <textarea rows={2} value={s.price_note} onChange={(e) => set("price_note", e.target.value)} className="admin-input" />
          </Field>
        </div>
      </Section>

      <Section title="Ana sayfa başlıkları">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Öne çıkan ürünler başlığı">
            <input value={s.featured_title} onChange={(e) => set("featured_title", e.target.value)} className="admin-input" />
          </Field>
          <Field label="Öne çıkan ürünler alt yazısı">
            <input value={s.featured_subtitle} onChange={(e) => set("featured_subtitle", e.target.value)} className="admin-input" />
          </Field>
        </div>
      </Section>

      <Section title="Markalar şeridi" desc="Ana sayfada kayan logolar. Logoyu şeffaf arka planlı PNG/SVG/WebP olarak yükleyin.">
        <Field label="Şerit başlığı">
          <input value={s.brands_title} onChange={(e) => set("brands_title", e.target.value)} className="admin-input" />
        </Field>
        <ItemListEditor
          items={s.brands}
          onChange={(v) => set("brands", v)}
          empty={{ name: "", logo: "" }}
          addLabel="Marka ekle"
          itemTitle={(b, i) => b.name || `Marka ${i + 1}`}
          fields={[
            { key: "name", label: "Marka adı" },
            {
              key: "logo",
              label: "Logo",
              type: "custom",
              render: (val, setVal) => (
                <FileUploadField
                  value={(val as string) || null}
                  onChange={(u) => setVal((u ?? "") as never)}
                  accept="image/png,image/svg+xml,image/webp,image/jpeg"
                  label="Logo yükle"
                  preview="image"
                />
              ),
            },
          ]}
        />
      </Section>

      <Section title="Sık sorulan sorular" desc="Mağaza ana sayfasının en altında görünür.">
        <ItemListEditor
          items={s.faqs}
          onChange={(v) => set("faqs", v)}
          empty={{ q: "", a: "" }}
          addLabel="Soru ekle"
          itemTitle={(f, i) => f.q || `Soru ${i + 1}`}
          fields={[
            { key: "q", label: "Soru" },
            { key: "a", label: "Cevap", type: "textarea" },
          ]}
        />
      </Section>

      <Section title="Güven kartları" desc="Kategori sayfalarında ve Hakkımızda'da görünen kısa kartlar. İlk kart her zaman Google puanınızdır (otomatik).">
        <ItemListEditor
          items={s.trust_items}
          onChange={(v) => set("trust_items", v)}
          empty={{ title: "", text: "" }}
          addLabel="Kart ekle"
          itemTitle={(t, i) => t.title || `Kart ${i + 1}`}
          fields={[
            { key: "title", label: "Başlık" },
            { key: "text", label: "Alt yazı" },
          ]}
        />
      </Section>

      <Section title="Sipariş nasıl işler?" desc="Adım adım sipariş süreci (3 adım önerilir).">
        <ItemListEditor
          items={s.order_steps}
          onChange={(v) => set("order_steps", v)}
          empty={{ title: "", text: "" }}
          addLabel="Adım ekle"
          itemTitle={(t, i) => `Adım ${i + 1}`}
          fields={[
            { key: "title", label: "Başlık" },
            { key: "text", label: "Açıklama", type: "textarea" },
          ]}
        />
      </Section>

      <Section title="Mağaza Hakkımızda sayfası" desc="/magaza/hakkimizda">
        <Field label="Başlık">
          <input value={s.about_title} onChange={(e) => set("about_title", e.target.value)} className="admin-input" />
        </Field>
        <MarkdownEditorField value={s.about_content} onChange={(v) => set("about_content", v)} required={false} rows={12} />
      </Section>

      <Section title="Sayfa altı (footer)">
        <Field label="Mağaza tanıtım yazısı">
          <textarea rows={2} value={s.footer_text} onChange={(e) => set("footer_text", e.target.value)} className="admin-input" />
        </Field>
      </Section>

      {done && <p className="text-[13px] text-volt">Ayarlar kaydedildi; mağazaya yansıdı.</p>}
      <SaveBar saving={saving} error={error} label="Ayarları kaydet" />
    </form>
  );
}
