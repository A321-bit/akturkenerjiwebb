"use client";

import { useEffect, useState } from "react";
import ImageUploadField from "@/components/admin/ImageUploadField";
import ItemListEditor from "@/components/admin/store/ItemListEditor";
import { SaveBar } from "@/components/admin/store/fields";

type Slide = {
  id?: number;
  image: string;
  eyebrow: string;
  title: string;
  text: string;
  cta_label: string;
  cta_href: string;
  active: boolean;
};

const EMPTY: Slide = { image: "", eyebrow: "", title: "", text: "", cta_label: "", cta_href: "", active: true };

export default function AdminStoreSliderPage() {
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [initialIds, setInitialIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function apply(rows: (Slide & { id: number })[]) {
    if (!Array.isArray(rows)) return;
    setSlides(rows.map((r) => ({ ...EMPTY, ...r, eyebrow: r.eyebrow ?? "", text: r.text ?? "", cta_label: r.cta_label ?? "", cta_href: r.cta_href ?? "" })));
    setInitialIds(rows.map((r) => r.id));
  }

  useEffect(() => {
    fetch("/api/admin/store/slides")
      .then((r) => r.json())
      .then(apply);
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!slides) return;
    if (slides.some((s) => !s.image || !s.title.trim())) {
      setError("Her slaytta görsel ve başlık olmalı.");
      return;
    }
    setSaving(true);
    setError("");
    setDone(false);
    try {
      const keep = new Set(slides.map((s) => s.id).filter(Boolean));
      for (const id of initialIds) {
        if (!keep.has(id)) await fetch(`/api/admin/store/slides/${id}`, { method: "DELETE" });
      }
      for (const [i, s] of slides.entries()) {
        const body = JSON.stringify({
          image: s.image,
          eyebrow: s.eyebrow || null,
          title: s.title,
          text: s.text || null,
          cta_label: s.cta_label || null,
          cta_href: s.cta_href || null,
          active: s.active,
          sort_order: i,
        });
        const res = await fetch(s.id ? `/api/admin/store/slides/${s.id}` : "/api/admin/store/slides", {
          method: s.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Kaydedilemedi.");
      }
      const rows = await fetch("/api/admin/store/slides").then((r) => r.json());
      apply(rows);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="flex max-w-3xl flex-col gap-4">
      <p className="text-[13.5px] text-slate">
        Mağaza ana sayfasının en üstündeki dönen görseller. Sıralamayı oklarla değiştirin; en iyi görünüm için yatay (en az 1600 px genişlikte) görsel kullanın.
      </p>
      {slides === null ? (
        <p className="text-[13.5px] text-slate-soft">Yükleniyor...</p>
      ) : (
        <ItemListEditor<Slide>
          items={slides}
          onChange={setSlides}
          empty={EMPTY}
          addLabel="Slayt ekle"
          itemTitle={(s, i) => `Slayt ${i + 1}${s.active ? "" : " (gizli)"}`}
          fields={[
            {
              key: "image",
              label: "Görsel",
              type: "custom",
              render: (val, set) => <ImageUploadField value={(val as string) || null} onChange={(u) => set((u ?? "") as never)} />,
            },
            { key: "eyebrow", label: "Üst etiket (küçük yazı)", placeholder: "On Grid Paketler" },
            { key: "title", label: "Başlık", placeholder: "Faturanızı güneşle sıfıra yaklaştırın" },
            { key: "text", label: "Açıklama", type: "textarea" },
            { key: "cta_label", label: "Buton yazısı", placeholder: "Paketleri incele" },
            { key: "cta_href", label: "Buton bağlantısı", placeholder: "/magaza/on-grid-paketler" },
            {
              key: "active",
              label: "Durum",
              type: "custom",
              render: (val, set) => (
                <label className="flex items-center gap-2 text-[14px]">
                  <input type="checkbox" checked={Boolean(val)} onChange={(e) => set(e.target.checked as never)} /> Yayında
                </label>
              ),
            },
          ]}
        />
      )}
      {done && <p className="text-[13px] text-volt">Slider kaydedildi.</p>}
      <SaveBar saving={saving} error={error} label="Slider'ı kaydet" />
    </form>
  );
}
