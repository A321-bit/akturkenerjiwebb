"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import ImageUploadField from "./ImageUploadField";
import MarkdownEditorField from "./MarkdownEditorField";

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
  seo_title: string;
  seo_description: string;
  seo_heading: string;
  guide_title: string;
  guide_content: string;
  faqs: { q: string; a: string }[];
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
        <MarkdownEditorField rows={10} value={values.description} onChange={(v) => set("description", v)} />
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

      <div className="mt-6 border-t border-line pt-6">
        <p className="font-display text-lg font-semibold">SEO ve sayfa içeriği</p>
        <p className="mt-1 text-[13px] text-slate">
          Boş bırakılan alanlarda sitedeki varsayılan metin kullanılır.
        </p>
      </div>
      <Field label={`Meta başlık (Google'da görünen başlık) — ${values.seo_title.length} karakter`}>
        <input value={values.seo_title} onChange={(e) => set("seo_title", e.target.value)} className="admin-input" />
        <span className="text-[12px] text-slate-soft">
          Sonuna &quot; | Aktürk Enerji&quot; otomatik eklenir, siz yazmayın. Google&apos;da görünen:{" "}
          <strong>{(values.seo_title || values.title) + " | Aktürk Enerji"}</strong>
        </span>
      </Field>
      <Field label={`Meta açıklama (Google'daki açıklama) — ${values.seo_description.length} karakter, ideal 140–160`}>
        <textarea
          rows={3}
          value={values.seo_description}
          onChange={(e) => set("seo_description", e.target.value)}
          className="admin-input"
        />
      </Field>
      <Field label="Sayfa ana başlığı (H1)">
        <input value={values.seo_heading} onChange={(e) => set("seo_heading", e.target.value)} className="admin-input" />
      </Field>
      <Field label="Rehber yazısı başlığı (H2)">
        <input value={values.guide_title} onChange={(e) => set("guide_title", e.target.value)} className="admin-input" />
      </Field>
      <Field label="Rehber yazısı (### alt başlık, - liste, tablo ve [link](/adres) kullanılabilir)">
        <MarkdownEditorField rows={24} value={values.guide_content} onChange={(v) => set("guide_content", v)} />
      </Field>

      <div className="flex flex-col gap-3">
        <span className="text-[13px] font-medium text-slate">Sık sorulan sorular</span>
        {values.faqs.map((f, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-line p-3">
            <input
              placeholder="Soru"
              value={f.q}
              onChange={(e) => set("faqs", values.faqs.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))}
              className="admin-input font-medium"
            />
            <textarea
              placeholder="Cevap"
              rows={3}
              value={f.a}
              onChange={(e) => set("faqs", values.faqs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))}
              className="admin-input"
            />
            <button
              type="button"
              onClick={() => set("faqs", values.faqs.filter((_, j) => j !== i))}
              className="self-end text-[12.5px] font-medium text-red-600 hover:underline"
            >
              Soruyu sil
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => set("faqs", [...values.faqs, { q: "", a: "" }])}
          className="self-start rounded-full border border-line px-4 py-2 text-[13px] font-semibold hover:border-ink"
        >
          + Soru ekle
        </button>
      </div>

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
