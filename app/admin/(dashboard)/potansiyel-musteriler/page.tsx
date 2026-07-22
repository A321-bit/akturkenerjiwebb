"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  PhoneCall,
  MessageCircle,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  MessageSquareText,
} from "lucide-react";
import { whatsappLink, SITE_URL } from "@/lib/data";

type PotentialCustomerRow = {
  id: number;
  created_at: string;
  company_name: string;
  contact_person: string | null;
  phone: string | null;
  district: string | null;
  category: string | null;
  note: string | null;
  status: string;
};

const STATUSES = ["Aranmadı", "Arandı", "Görüşülüyor", "Olumlu", "Olumsuz"] as const;

const STATUS_STYLES: Record<string, string> = {
  Aranmadı: "bg-ink/5 text-slate border-line",
  Arandı: "bg-brand/10 text-brand border-brand/30",
  Görüşülüyor: "bg-sun/15 text-sun-soft border-sun/40",
  Olumsuz: "bg-red-50 text-red-600 border-red-200",
  Olumlu: "bg-volt/10 text-volt border-volt/30",
};

function telHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

function outreachHref(item: PotentialCustomerRow) {
  if (!item.phone) return null;
  const digits = item.phone.replace(/\D/g, "");
  const intl = digits.startsWith("90") ? digits : digits.startsWith("0") ? `90${digits.slice(1)}` : `90${digits}`;
  const message = `Merhaba, Aktürk Enerji'den arıyoruz. 1 Ocak 2026 itibarıyla 2.000 m² üzeri yeni binalarda enerji ihtiyacının en az %10'unun güneş enerjisi gibi yenilenebilir sistemlerle karşılanması yasal olarak zorunlu hale geldi. Projeleriniz için bu süreci anahtar teslim çözebiliyoruz — kısaca bilgi almak ister misiniz?\n\n${SITE_URL}/hizmetlerimiz/muteahhit-ges`;
  return whatsappLink(intl, message);
}

const emptyForm = {
  company_name: "",
  contact_person: "",
  phone: "",
  district: "",
  category: "",
  note: "",
};

export default function AdminPotentialCustomersPage() {
  const [items, setItems] = useState<PotentialCustomerRow[] | null>(null);
  const [activeStatus, setActiveStatus] = useState<string>("Tümü");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/potential-customers")
      .then((r) => r.json())
      .then(setItems);
  }, []);

  async function refresh() {
    const res = await fetch("/api/admin/potential-customers");
    setItems(await res.json());
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company_name.trim()) return;
    setSubmitting(true);
    await fetch("/api/admin/potential-customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm(emptyForm);
    setShowForm(false);
    setSubmitting(false);
    refresh();
  }

  async function handleDelete(id: number) {
    if (!confirm("Bu potansiyel müşteriyi silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/admin/potential-customers/${id}`, { method: "DELETE" });
    refresh();
  }

  async function handleStatusChange(id: number, status: string) {
    setItems((prev) => prev?.map((it) => (it.id === id ? { ...it, status } : it)) ?? prev);
    setSavingId(id);
    await fetch(`/api/admin/potential-customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSavingId(null);
  }

  function openNotes(item: PotentialCustomerRow) {
    if (expandedId === item.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(item.id);
    setNoteDraft(item.note ?? "");
  }

  async function saveNote(id: number) {
    setSavingId(id);
    await fetch(`/api/admin/potential-customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: noteDraft }),
    });
    setItems((prev) => prev?.map((it) => (it.id === id ? { ...it, note: noteDraft } : it)) ?? prev);
    setSavingId(null);
    setExpandedId(null);
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { Tümü: items?.length ?? 0 };
    for (const s of STATUSES) c[s] = items?.filter((it) => it.status === s).length ?? 0;
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return null;
    return activeStatus === "Tümü" ? items : items.filter((it) => it.status === activeStatus);
  }, [items, activeStatus]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
            Satış Avı
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
            Potansiyel Müşteriler {items ? `(${items.length})` : ""}
          </h1>
          <p className="mt-1 text-[13px] text-slate-soft">
            Müteahhit, bayilik ve kurumsal gibi kendi bulduğumuz B2B fırsatlar — web
            formundan gelen taleplerden ayrı, satış ekibi burada takip eder.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper hover:bg-sun hover:text-ink"
        >
          <Plus size={16} /> Yeni Ekle
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-5 grid gap-3 rounded-2xl border border-line bg-paper-raised p-5 sm:grid-cols-2"
        >
          <input
            required
            placeholder="Firma / Proje adı *"
            value={form.company_name}
            onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
            className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[13.5px] outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
          <input
            placeholder="İlgili kişi"
            value={form.contact_person}
            onChange={(e) => setForm((f) => ({ ...f, contact_person: e.target.value }))}
            className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[13.5px] outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
          <input
            placeholder="Telefon"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[13.5px] outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
          <input
            placeholder="İlçe"
            value={form.district}
            onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
            className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[13.5px] outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
          <input
            placeholder="Kategori (Müteahhit, Bayilik, Kurumsal...)"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[13.5px] outline-none focus:border-brand focus:ring-1 focus:ring-brand sm:col-span-2"
          />
          <textarea
            placeholder="Not / kaynak (ör. proje adı, teslim tarihi, nereden bulundu)"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            rows={2}
            className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[13.5px] outline-none focus:border-brand focus:ring-1 focus:ring-brand sm:col-span-2"
          />
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-ink px-4 py-2 text-[12.5px] font-semibold text-paper hover:bg-sun hover:text-ink disabled:opacity-60"
            >
              {submitting ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-full border border-line px-4 py-2 text-[12.5px] font-semibold text-ink hover:border-brand"
            >
              Vazgeç
            </button>
          </div>
        </form>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {["Tümü", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setActiveStatus(s)}
            className={`rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors ${
              activeStatus === s
                ? "border-ink bg-ink text-paper"
                : "border-line text-slate hover:border-brand"
            }`}
          >
            {s} {items && <span className="opacity-70">({counts[s] ?? 0})</span>}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-paper-raised">
        {filtered === null ? (
          <p className="p-5 text-[13.5px] text-slate-soft">Yükleniyor...</p>
        ) : filtered.length === 0 ? (
          <p className="p-5 text-[13.5px] text-slate-soft">Bu durumda kayıt yok.</p>
        ) : (
          <table className="w-full min-w-[980px] text-[13.5px]">
            <thead>
              <tr className="border-b border-line text-left text-[11.5px] uppercase tracking-[0.08em] text-slate-soft">
                <th className="px-5 py-3 font-medium">Tarih</th>
                <th className="px-5 py-3 font-medium">Firma / Proje</th>
                <th className="px-5 py-3 font-medium">İlgili Kişi</th>
                <th className="px-5 py-3 font-medium">Telefon</th>
                <th className="px-5 py-3 font-medium">İlçe</th>
                <th className="px-5 py-3 font-medium">Kategori</th>
                <th className="px-5 py-3 font-medium">Durum</th>
                <th className="w-28 px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <Fragment key={item.id}>
                  <tr className="border-b border-line last:border-0">
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate">
                      {new Date(item.created_at).toLocaleDateString("tr-TR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-ink">{item.company_name}</td>
                    <td className="px-5 py-3.5 text-slate">{item.contact_person ?? "—"}</td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      {item.phone ? (
                        <a
                          href={telHref(item.phone)}
                          className="flex items-center gap-1.5 font-semibold text-brand hover:underline"
                        >
                          <PhoneCall size={14} /> {item.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate">{item.district ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      {item.category ? (
                        <span className="rounded-full bg-ink/5 px-2.5 py-1 text-[11.5px] font-medium text-slate">
                          {item.category}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        disabled={savingId === item.id}
                        className={`rounded-full border px-3 py-1.5 text-[12.5px] font-semibold outline-none disabled:opacity-60 ${
                          STATUS_STYLES[item.status] ?? STATUS_STYLES.Aranmadı
                        }`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {outreachHref(item) && (
                          <a
                            href={outreachHref(item)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-2 text-slate hover:bg-[#25D366]/10 hover:text-[#25D366]"
                            aria-label="WhatsApp'tan ulaş"
                            title="Hazır mesajla WhatsApp'tan ulaş"
                          >
                            <MessageCircle size={16} />
                          </a>
                        )}
                        <button
                          onClick={() => openNotes(item)}
                          className={`rounded-lg p-2 hover:bg-ink/5 ${
                            item.note ? "text-brand" : "text-slate"
                          }`}
                          aria-label="Not ekle/düzenle"
                        >
                          <MessageSquareText size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg p-2 text-slate hover:bg-red-50 hover:text-red-600"
                          aria-label="Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                        {expandedId === item.id ? (
                          <ChevronUp size={16} className="text-slate-soft" />
                        ) : (
                          <ChevronDown size={16} className="text-slate-soft" />
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === item.id && (
                    <tr className="border-b border-line bg-ink/[0.02] last:border-0">
                      <td colSpan={8} className="px-5 py-4">
                        <label className="text-[12.5px] font-medium text-slate">
                          {item.company_name} için not
                        </label>
                        <textarea
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          rows={3}
                          placeholder="Proje adı, teslim tarihi, görüşme detayı, nereden bulundu vb."
                          className="mt-2 w-full max-w-2xl rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[13.5px] outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => saveNote(item.id)}
                            disabled={savingId === item.id}
                            className="rounded-full bg-ink px-4 py-2 text-[12.5px] font-semibold text-paper hover:bg-sun hover:text-ink disabled:opacity-60"
                          >
                            {savingId === item.id ? "Kaydediliyor..." : "Notu Kaydet"}
                          </button>
                          <button
                            onClick={() => setExpandedId(null)}
                            className="rounded-full border border-line px-4 py-2 text-[12.5px] font-semibold text-ink hover:border-brand"
                          >
                            Vazgeç
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
