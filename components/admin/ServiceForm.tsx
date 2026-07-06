"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import ImageUploadField from "./ImageUploadField";

export type ServiceFormValues = {
  id?: number;
  slug: string;
  eyebrow: string;
  title: string;
  summary: string;
  description: string;
  bullets: string[];
  audience: string;
  image: string | null;
  sort_order: number;
};

export default function ServiceForm({ initial }: { initial: ServiceFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [bulletsText, setBulletsText] = useState(initial.bullets.join("\n"));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof ServiceFormValues>(key: K, value: ServiceFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = { ...values, bullets: bulletsText.split("\n").map((b) => b.trim()).filter(Boolean) };
    const url = values.id ? `/api/admin/services/${values.id}` : "/api/admin/services";
    const method = values.id ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Kaydedilemedi.");
      setSaving(false);
      return;
    }
    router.push("/admin/hizmetler");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 max-w-2xl">
      <Field label="Slug (URL, örn. villa-cati-ges)">
        <input
          required
          value={values.slug}
          onChange={(e) => set("slug", e.target.value)}
          className="admin-input"
        />
      </Field>
      <Field label="Kategori etiketi (örn. Konut)">
        <input
          required
          value={values.eyebrow}
          onChange={(e) => set("eyebrow", e.target.value)}
          className="admin-input"
        />
      </Field>
      <Field label="Başlık">
        <input required value={values.title} onChange={(e) => set("title", e.target.value)} className="admin-input" />
      </Field>
      <Field label="Kısa özet (liste/meta açıklaması için)">
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
          required
          rows={8}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          className="admin-input"
        />
      </Field>
      <Field label="Madde listesi (her satır bir madde)">
        <textarea
          rows={4}
          value={bulletsText}
          onChange={(e) => setBulletsText(e.target.value)}
          className="admin-input"
        />
      </Field>
      <Field label="Hedef kitle">
        <input
          required
          value={values.audience}
          onChange={(e) => set("audience", e.target.value)}
          className="admin-input"
        />
      </Field>
      <Field label="Kapak görseli">
        <ImageUploadField value={values.image} onChange={(url) => set("image", url)} />
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
