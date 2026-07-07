"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import MarkdownEditorField from "./MarkdownEditorField";

export type BlogPostFormValues = {
  id?: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  content: string;
  published_at: string;
};

export default function BlogPostForm({ initial }: { initial: BlogPostFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof BlogPostFormValues>(key: K, value: BlogPostFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const url = values.id ? `/api/admin/blog/${values.id}` : "/api/admin/blog";
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
    router.push("/admin/blog");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex max-w-3xl flex-col gap-4">
      <Field label="Slug (URL)">
        <input required value={values.slug} onChange={(e) => set("slug", e.target.value)} className="admin-input" />
      </Field>
      <Field label="Başlık">
        <input required value={values.title} onChange={(e) => set("title", e.target.value)} className="admin-input" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Kategori">
          <input
            required
            value={values.category}
            onChange={(e) => set("category", e.target.value)}
            className="admin-input"
          />
        </Field>
        <Field label="Yayın tarihi">
          <input
            type="date"
            required
            value={values.published_at}
            onChange={(e) => set("published_at", e.target.value)}
            className="admin-input"
          />
        </Field>
      </div>
      <Field label="Kısa açıklama (meta açıklama olarak da kullanılır)">
        <textarea
          required
          rows={2}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          className="admin-input"
        />
      </Field>
      <Field label="İçerik (araç çubuğundan görsel ve bağlantı ekleyebilirsiniz)">
        <MarkdownEditorField value={values.content} onChange={(v) => set("content", v)} />
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
