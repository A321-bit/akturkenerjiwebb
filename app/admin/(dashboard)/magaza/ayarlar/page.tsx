"use client";

import { useEffect, useState } from "react";
import FileUploadField from "@/components/admin/FileUploadField";
import MarkdownEditorField from "@/components/admin/MarkdownEditorField";
import ItemListEditor from "@/components/admin/store/ItemListEditor";
import { Field, SaveBar, Section } from "@/components/admin/store/fields";

type Item = { title: string; text: string };
type Settings = {
  usd_rate: number | string | null;
  usd_rate_updated_at: string | null;
  price_round: number;
  vat_pct: number | string | null;
  default_margin_pct: number | string | null;
  default_list_margin_pct: number | string | null;
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
  const [done, setDone] = useState("");
  const [tcmb, setTcmb] = useState("");

  useEffect(() => {
    fetch("/api/admin/store/settings")
      .then((r) => r.json())
      .then((d) => d && !d.error && setS(d));
  }, []);

  if (!s) return <p className="text-[13.5px] text-slate-soft">Yükleniyor...</p>;

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setS((x) => (x ? { ...x, [key]: value } : x));
    setDone("");
  }

  async function fetchTcmb() {
    setTcmb("Getiriliyor...");
    const r = await fetch("/api/admin/store/usd-rate");
    const b = await r.json().catch(() => ({}));
    if (!r.ok) {
      setTcmb(b.error ?? "Kur alınamadı.");
      return;
    }
    set("usd_rate", String(b.rate).replace(".", ","));
    setTcmb(`TCMB ${b.date} döviz satış kuru: ${b.rate}. Kaydet'e basınca tüm fiyatlar bu kurla güncellenir.`);
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
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Kaydedilemedi.");
      return;
    }
    setS((x) => (x ? { ...x, usd_rate: body.usd_rate, usd_rate_updated_at: body.usd_rate_updated_at } : x));
    setTcmb("");
    setS((x) => (x ? { ...x, vat_pct: body.vat_pct, default_margin_pct: body.default_margin_pct, default_list_margin_pct: body.default_list_margin_pct } : x));
    setDone(body.repriced ? `Ayarlar kaydedildi; ${body.repriced} ürünün fiyatı güncellendi.` : "Ayarlar kaydedildi; mağazaya yansıdı.");
  }

  return (
    <form onSubmit={save} className="flex max-w-3xl flex-col gap-5">
      <Section title="Döviz kuru" desc="Ürün fiyatları USD girilir; sitede bu kurla TL'ye çevrilip gösterilir. Kuru değiştirip kaydedince bütün ürünlerin TL fiyatı otomatik güncellenir.">
        <div className="grid gap-4 sm:grid-cols-[220px_200px_1fr] sm:items-end">
          <Field label="1 USD kaç TL?">
            <input
              inputMode="decimal"
              value={s.usd_rate == null ? "" : String(s.usd_rate).replace(".", ",")}
              onChange={(e) => set("usd_rate", e.target.value)}
              className="admin-input"
              placeholder="ör. 49,42"
            />
          </Field>
          <Field label="TL fiyat yuvarlama">
            <select value={s.price_round} onChange={(e) => set("price_round", Number(e.target.value))} className="admin-input">
              <option value={1}>Yuvarlama yok</option>
              <option value={10}>10 TL</option>
              <option value={100}>100 TL</option>
              <option value={1000}>1.000 TL</option>
            </select>
          </Field>
          <button type="button" onClick={fetchTcmb} className="h-[46px] w-fit rounded-full border border-line px-4 text-[13.5px] font-semibold hover:border-ink">
            TCMB kurunu getir
          </button>
        </div>
        {tcmb && <p className="text-[12.5px] text-brand">{tcmb}</p>}
        {s.usd_rate_updated_at && (
          <p className="text-[12px] text-slate-soft">Kur en son {new Date(s.usd_rate_updated_at).toLocaleString("tr-TR")} tarihinde değişti.</p>
        )}
      </Section>

      <Section
        title="Kâr marjı"
        desc="Alış maliyeti girilmiş ürünlerde satış fiyatı = alış (KDV hariç) × (1 + KDV) × (1 + kâr marjı). Öncelik: ürün marjı → kategori marjı → buradaki genel marj. Alış fiyatları ve marjlar sitede gösterilmez."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Genel kâr marjı (%)" hint="Ürün ve kategoride marj yoksa uygulanır. Boş bırakılabilir.">
            <input
              inputMode="decimal"
              value={s.default_margin_pct == null ? "" : String(s.default_margin_pct).replace(".", ",")}
              onChange={(e) => set("default_margin_pct", e.target.value)}
              className="admin-input"
              placeholder="ör. 20"
            />
          </Field>
          <Field label="Genel üstü çizili fiyat marjı (%)" hint="Üstü çizili fiyat = alış (KDV dahil) × (1 + bu oran). Boş bırakılabilir.">
            <input
              inputMode="decimal"
              value={s.default_list_margin_pct == null ? "" : String(s.default_list_margin_pct).replace(".", ",")}
              onChange={(e) => set("default_list_margin_pct", e.target.value)}
              className="admin-input"
            />
          </Field>
          <Field label="KDV oranı (%)" hint="Alış fiyatlarına eklenen KDV.">
            <input
              inputMode="decimal"
              value={s.vat_pct == null ? "" : String(s.vat_pct).replace(".", ",")}
              onChange={(e) => set("vat_pct", e.target.value)}
              className="admin-input"
            />
          </Field>
        </div>
      </Section>

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

      {done && <p className="text-[13px] text-volt">{done}</p>}
      <SaveBar saving={saving} error={error} label="Ayarları kaydet" />
    </form>
  );
}
