"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

export type VideoFormValues = {
  id?: number;
  title: string;
  youtube_url: string;
  sort_order: number;
};

export default function VideoForm({ initial }: { initial: VideoFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof VideoFormValues>(key: K, value: VideoFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  const embedUrl = values.youtube_url ? getYouTubeEmbedUrl(values.youtube_url) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!getYouTubeEmbedUrl(values.youtube_url)) {
      setError("Geçerli bir YouTube linki girin.");
      return;
    }
    setSaving(true);
    setError("");
    const url = values.id ? `/api/admin/videos/${values.id}` : "/api/admin/videos";
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
    router.push("/admin/videolar");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex max-w-xl flex-col gap-4">
      <Field label="Başlık">
        <input required value={values.title} onChange={(e) => set("title", e.target.value)} className="admin-input" />
      </Field>
      <Field label="YouTube linki">
        <input
          required
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={values.youtube_url}
          onChange={(e) => set("youtube_url", e.target.value)}
          className="admin-input"
        />
      </Field>
      {embedUrl && (
        <div className="aspect-video w-full overflow-hidden rounded-xl border border-line">
          <iframe src={embedUrl} title="Önizleme" className="h-full w-full border-0" allowFullScreen />
        </div>
      )}
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
