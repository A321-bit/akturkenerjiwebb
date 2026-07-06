"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

type Settings = {
  name: string;
  short_name: string;
  founded_year: number;
  city: string;
  country: string;
  description: string;
  phone_display: string;
  phone_href: string;
  whatsapp_number: string;
  email: string;
  address_line: string;
  maps_embed_url: string;
  working_hours: string;
  instagram: string;
  linkedin: string;
  youtube: string;
  facebook: string;
  stats: { label: string; value: string }[];
};

type Testimonial = { id: number; name: string; role: string; quote: string; sort_order: number };

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then(setSettings);
    fetch("/api/admin/testimonials")
      .then((r) => r.json())
      .then(setTestimonials);
  }, []);

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  }

  function setStat(i: number, field: "label" | "value", value: string) {
    setSettings((s) => {
      if (!s) return s;
      const stats = [...s.stats];
      stats[i] = { ...stats[i], [field]: value };
      return { ...s, stats };
    });
  }

  function addStat() {
    setSettings((s) => (s ? { ...s, stats: [...s.stats, { label: "", value: "" }] } : s));
  }

  function removeStat(i: number) {
    setSettings((s) => (s ? { ...s, stats: s.stats.filter((_, idx) => idx !== i) } : s));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function addTestimonial() {
    const res = await fetch("/api/admin/testimonials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", role: "", quote: "", sort_order: testimonials.length }),
    });
    const created = await res.json();
    setTestimonials((t) => [...t, created]);
  }

  async function updateTestimonial(id: number, field: keyof Testimonial, value: string) {
    setTestimonials((t) => t.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }

  async function saveTestimonial(t: Testimonial) {
    await fetch(`/api/admin/testimonials/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(t),
    });
  }

  async function deleteTestimonial(id: number) {
    if (!confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    setTestimonials((t) => t.filter((item) => item.id !== id));
  }

  if (!settings) {
    return <p className="text-[13.5px] text-slate-soft">Yükleniyor...</p>;
  }

  return (
    <div>
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Site Ayarları</p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
        Şirket Bilgileri & İçerik
      </h1>

      <form onSubmit={handleSave} className="mt-6 flex max-w-2xl flex-col gap-4">
        <Section title="Kurumsal Bilgiler">
          <Field label="Şirket adı">
            <input value={settings.name} onChange={(e) => set("name", e.target.value)} className="admin-input" />
          </Field>
          <Field label="Kısa isim">
            <input
              value={settings.short_name}
              onChange={(e) => set("short_name", e.target.value)}
              className="admin-input"
            />
          </Field>
          <Field label="Şirket açıklaması (meta açıklama / hakkımızda özeti)">
            <textarea
              rows={3}
              value={settings.description}
              onChange={(e) => set("description", e.target.value)}
              className="admin-input"
            />
          </Field>
        </Section>

        <Section title="İletişim">
          <Field label="Telefon (görünen, örn. 0 (312) 988 03 88)">
            <input
              value={settings.phone_display}
              onChange={(e) => set("phone_display", e.target.value)}
              className="admin-input"
            />
          </Field>
          <Field label="Telefon (tel: linki, örn. tel:+903129880388)">
            <input
              value={settings.phone_href}
              onChange={(e) => set("phone_href", e.target.value)}
              className="admin-input"
            />
          </Field>
          <Field label="WhatsApp numarası (ülke kodlu, boşluksuz, örn. 905335591469)">
            <input
              value={settings.whatsapp_number}
              onChange={(e) => set("whatsapp_number", e.target.value)}
              className="admin-input"
            />
          </Field>
          <Field label="E-posta">
            <input value={settings.email} onChange={(e) => set("email", e.target.value)} className="admin-input" />
          </Field>
          <Field label="Açık adres">
            <input
              value={settings.address_line}
              onChange={(e) => set("address_line", e.target.value)}
              className="admin-input"
            />
          </Field>
          <Field label="Google Maps linki">
            <input
              value={settings.maps_embed_url}
              onChange={(e) => set("maps_embed_url", e.target.value)}
              className="admin-input"
            />
          </Field>
          <Field label="Çalışma saatleri">
            <input
              value={settings.working_hours}
              onChange={(e) => set("working_hours", e.target.value)}
              className="admin-input"
            />
          </Field>
        </Section>

        <Section title="Sosyal Medya">
          <Field label="Instagram">
            <input
              value={settings.instagram}
              onChange={(e) => set("instagram", e.target.value)}
              className="admin-input"
            />
          </Field>
          <Field label="LinkedIn">
            <input
              value={settings.linkedin}
              onChange={(e) => set("linkedin", e.target.value)}
              className="admin-input"
            />
          </Field>
          <Field label="YouTube">
            <input value={settings.youtube} onChange={(e) => set("youtube", e.target.value)} className="admin-input" />
          </Field>
          <Field label="Facebook">
            <input
              value={settings.facebook}
              onChange={(e) => set("facebook", e.target.value)}
              className="admin-input"
            />
          </Field>
        </Section>

        <Section title="Anasayfa İstatistikleri">
          {settings.stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={stat.label}
                onChange={(e) => setStat(i, "label", e.target.value)}
                placeholder="Etiket (örn. Tamamlanan proje)"
                className="admin-input flex-1"
              />
              <input
                value={stat.value}
                onChange={(e) => setStat(i, "value", e.target.value)}
                placeholder="Değer (örn. 500+)"
                className="admin-input flex-1"
              />
              <button
                type="button"
                onClick={() => removeStat(i)}
                className="rounded-lg p-2 text-slate hover:bg-red-50 hover:text-red-600"
                aria-label="Sil"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addStat}
            className="flex w-fit items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[13px] font-medium text-ink hover:border-brand"
          >
            <Plus size={14} /> İstatistik ekle
          </button>
        </Section>

        <div className="mt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[14.5px] font-semibold text-paper hover:bg-sun hover:text-ink disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            Kaydet
          </button>
          {saved && <span className="text-[13px] text-volt">Kaydedildi.</span>}
        </div>
      </form>

      <div className="mt-12 max-w-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Müşteri Yorumları</h2>
          <button
            onClick={addTestimonial}
            className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[13px] font-medium text-ink hover:border-brand"
          >
            <Plus size={14} /> Yorum ekle
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-4">
          {testimonials.map((t) => (
            <div key={t.id} className="rounded-2xl border border-line bg-paper-raised p-4">
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={t.name}
                  onChange={(e) => updateTestimonial(t.id, "name", e.target.value)}
                  onBlur={() => saveTestimonial(t)}
                  placeholder="Müşteri adı"
                  className="admin-input"
                />
                <input
                  value={t.role}
                  onChange={(e) => updateTestimonial(t.id, "role", e.target.value)}
                  onBlur={() => saveTestimonial(t)}
                  placeholder="Unvan (örn. Villa Sahibi, Çankaya)"
                  className="admin-input"
                />
              </div>
              <textarea
                value={t.quote}
                onChange={(e) => updateTestimonial(t.id, "quote", e.target.value)}
                onBlur={() => saveTestimonial(t)}
                placeholder="Yorum metni"
                rows={2}
                className="admin-input mt-2 w-full"
              />
              <button
                onClick={() => deleteTestimonial(t.id)}
                className="mt-2 flex items-center gap-1.5 text-[12.5px] text-red-600"
              >
                <Trash2 size={13} /> Sil
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-paper-raised p-5">
      <p className="mb-3 text-[13px] font-semibold text-ink">{title}</p>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-medium text-slate">{label}</span>
      {children}
    </label>
  );
}
