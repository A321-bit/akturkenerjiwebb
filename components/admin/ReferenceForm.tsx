"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import ImageUploadField from "./ImageUploadField";
import GalleryUploadField from "./GalleryUploadField";

const KNOWN_CATEGORIES = ["Villa", "Müteahhit", "Tarım", "Telekomünikasyon", "Hobi Bahçesi", "Karavan", "Fabrika"];

export type ReferenceFormValues = {
  id?: number;
  slug: string;
  title: string;
  category: string;
  location: string;
  address: string | null;
  capacity: string;
  year: string;
  summary: string;
  description: string | null;
  image: string | null;
  gallery: string[];
  video_url: string | null;
  sort_order: number;
};

export default function ReferenceForm({ initial }: { initial: ReferenceFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [customCategory, setCustomCategory] = useState(
    initial.category && !KNOWN_CATEGORIES.includes(initial.category)
  );

  function set<K extends keyof ReferenceFormValues>(key: K, value: ReferenceFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const url = values.id ? `/api/admin/references/${values.id}` : "/api/admin/references";
    const method = values.id ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Kaydedilemedi.");
      setSaving(false);
      return;
    }
    router.push("/admin/referanslar");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex max-w-2xl flex-col gap-4">
      <Field label="Slug (URL)">
        <input required value={values.slug} onChange={(e) => set("slug", e.target.value)} className="admin-input" />
      </Field>
      <Field label="Proje adı">
        <input required value={values.title} onChange={(e) => set("title", e.target.value)} className="admin-input" />
      </Field>
      <Field label="Kategori">
        {customCategory ? (
          <div className="flex gap-2">
            <input
              required
              autoFocus
              placeholder="Yeni kategori adı"
              value={values.category}
              onChange={(e) => set("category", e.target.value)}
              className="admin-input"
            />
            <button
              type="button"
              onClick={() => {
                setCustomCategory(false);
                set("category", KNOWN_CATEGORIES[0]);
              }}
              className="shrink-0 rounded-lg border border-line px-3 text-[13px] font-medium text-slate hover:text-ink"
            >
              Listeden seç
            </button>
          </div>
        ) : (
          <select
            required
            value={values.category}
            onChange={(e) => {
              if (e.target.value === "__custom__") {
                setCustomCategory(true);
                set("category", "");
              } else {
                set("category", e.target.value);
              }
            }}
            className="admin-input"
          >
            <option value="" disabled>
              Seçin...
            </option>
            {KNOWN_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value="__custom__">+ Yeni kategori ekle</option>
          </select>
        )}
      </Field>
      <Field label="Konum (örn. Çankaya, Ankara)">
        <input
          required
          value={values.location}
          onChange={(e) => set("location", e.target.value)}
          className="admin-input"
        />
      </Field>
      <Field label="Açık adres (opsiyonel)">
        <input
          value={values.address ?? ""}
          onChange={(e) => set("address", e.target.value || null)}
          className="admin-input"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Kurulu güç (örn. 10 kWp)">
          <input
            required
            value={values.capacity}
            onChange={(e) => set("capacity", e.target.value)}
            className="admin-input"
          />
        </Field>
        <Field label="Yıl">
          <input required value={values.year} onChange={(e) => set("year", e.target.value)} className="admin-input" />
        </Field>
      </div>
      <Field label="Kısa özet">
        <textarea
          required
          rows={2}
          value={values.summary}
          onChange={(e) => set("summary", e.target.value)}
          className="admin-input"
        />
      </Field>
      <Field label="Uzun açıklama (sayfa içi metin)">
        <textarea
          rows={6}
          value={values.description ?? ""}
          onChange={(e) => set("description", e.target.value || null)}
          className="admin-input"
        />
      </Field>
      <Field label="Kapak görseli">
        <ImageUploadField value={values.image} onChange={(url) => set("image", url)} />
      </Field>
      <Field label="Drone / saha galerisi (birden fazla görsel seçebilirsiniz)">
        <GalleryUploadField value={values.gallery} onChange={(urls) => set("gallery", urls)} />
      </Field>
      <Field label="Drone videosu (YouTube linki, opsiyonel)">
        <input
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={values.video_url ?? ""}
          onChange={(e) => set("video_url", e.target.value || null)}
          className="admin-input"
        />
      </Field>
      <Field label="Sıra (küçük sayı önce gösterilir)">
        <input
          type="number"
          value={values.sort_order}
          onChange={(e) => set("sort_order", Number(e.target.value))}
          className="admin-input"
        />
      </Field>

      {error && <p className="text-[13px] text-red-600">{error}</p>}

      <div className="mt-2 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[14.5px] font-semibold text-paper hover:bg-sun hover:text-ink disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : null}
          Kaydet
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-slate">{label}</span>
      {children}
    </label>
  );
}
