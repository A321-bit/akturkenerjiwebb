"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { trackEvent } from "@/lib/track";
import { buildLeadAttributionFields } from "@/lib/attribution";
import { trackMetaLead } from "@/lib/meta-pixel";
import { trackGa4Lead } from "@/lib/ga4";
import { TURKISH_PROVINCES } from "@/lib/turkish-provinces";
import {
  Home,
  Trees,
  HardHat,
  Sprout,
  User,
  PhoneCall,
  MapPin,
  Loader2,
  CheckCircle2,
} from "lucide-react";

const needTypes = [
  { value: "Villa Çatı GES", label: "Villa / Ev Çatısı", icon: Home },
  { value: "Hobi Bahçesi", label: "Hobi Bahçesi / Arazi", icon: Trees },
  { value: "İnşaat / Müteahhitlik", label: "İşyeri / Müteahhitlik", icon: HardHat },
  { value: "Tarımsal Sulama", label: "Tarımsal Sulama", icon: Sprout },
] as const;

const billOptions = [
  "0 - 1.000 ₺",
  "1.000 - 3.000 ₺",
  "3.000 - 6.000 ₺",
  "6.000 ₺ üzeri",
  "Şebeke bağlantım yok",
];

const leadSchema = z.object({
  fullname: z.string().trim().min(3, "Ad soyad girin"),
  phone: z.string().trim().min(7, "Telefon numarası girin"),
  province: z.string().min(1, "İl seçin"),
  needType: z.string().min(1, "Bir seçenek işaretleyin"),
  billRange: z.string().min(1, "Bir seçenek işaretleyin"),
});

type LeadValues = z.infer<typeof leadSchema>;

export default function InstantLeadForm() {
  const [values, setValues] = useState<LeadValues>({
    fullname: "",
    phone: "",
    province: "",
    needType: "",
    billRange: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LeadValues, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = leadSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof LeadValues, string>> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as keyof LeadValues] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setStatus("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsed.data,
          source: "meta_landing",
          ...buildLeadAttributionFields("/teklif-al"),
        }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("sent");
      trackEvent("click", "/teklif-al", "lead_form_submit");
      trackMetaLead(parsed.data.needType);
      trackGa4Lead(parsed.data.needType);
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-paper-raised p-8 text-center sm:p-10"
      >
        <CheckCircle2 size={44} className="text-volt" />
        <p className="font-display text-xl font-semibold text-ink">Talebiniz alındı</p>
        <p className="max-w-sm text-[15px] text-slate">
          Uzman mühendisimiz en kısa sürede sizi arayarak size özel fiyat teklifini paylaşacak.
        </p>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-line bg-paper-raised p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)] sm:p-8"
    >
      <div>
        <p className="font-display text-[19px] font-semibold text-ink sm:text-[21px]">
          Ücretsiz keşif ve fiyat teklifi alın
        </p>
        <p className="mt-1 text-[13.5px] text-slate">
          4 bilgiyi bırakın, ekibimiz 15 dakika içinde sizi arasın.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="il-fullname" className="flex items-center gap-1.5 text-[13px] font-medium text-slate">
          <User size={14} /> Ad Soyad
        </label>
        <input
          id="il-fullname"
          type="text"
          autoComplete="name"
          required
          value={values.fullname}
          onChange={(e) => setValues((v) => ({ ...v, fullname: e.target.value }))}
          className="min-h-[52px] rounded-lg border border-line bg-paper px-3.5 py-3 text-[15px] outline-none focus:border-sun focus:ring-1 focus:ring-sun"
        />
        {errors.fullname && <p className="text-[12.5px] text-red-600">{errors.fullname}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="il-phone" className="flex items-center gap-1.5 text-[13px] font-medium text-slate">
          <PhoneCall size={14} /> Telefon Numarası
        </label>
        <input
          id="il-phone"
          type="tel"
          autoComplete="tel"
          placeholder="05xx xxx xx xx"
          required
          value={values.phone}
          onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
          className="min-h-[52px] rounded-lg border border-line bg-paper px-3.5 py-3 text-[15px] outline-none focus:border-sun focus:ring-1 focus:ring-sun"
        />
        {errors.phone && <p className="text-[12.5px] text-red-600">{errors.phone}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="il-province" className="flex items-center gap-1.5 text-[13px] font-medium text-slate">
          <MapPin size={14} /> İl
        </label>
        <select
          id="il-province"
          required
          value={values.province}
          onChange={(e) => setValues((v) => ({ ...v, province: e.target.value }))}
          className="min-h-[52px] rounded-lg border border-line bg-paper px-3.5 py-3 text-[15px] outline-none focus:border-sun focus:ring-1 focus:ring-sun"
        >
          <option value="" disabled>
            Seçin...
          </option>
          {TURKISH_PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {errors.province && <p className="text-[12.5px] text-red-600">{errors.province}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-[13px] font-medium text-slate">Sistemi nereye kuracaksınız?</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {needTypes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setValues((v) => ({ ...v, needType: value }))}
              className={`flex min-h-[52px] items-center gap-2.5 rounded-xl border p-3 text-left transition-colors hover:border-sun ${
                values.needType === value ? "border-sun bg-sun/10" : "border-line"
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Icon size={17} />
              </span>
              <span className="text-[13.5px] font-semibold text-ink">{label}</span>
            </button>
          ))}
        </div>
        {errors.needType && <p className="text-[12.5px] text-red-600">{errors.needType}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-[13px] font-medium text-slate">Aylık ortalama elektrik faturanız</p>
        <div className="grid gap-2">
          {billOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setValues((v) => ({ ...v, billRange: opt }))}
              className={`min-h-[46px] rounded-xl border p-3 text-left text-[14px] font-medium text-ink transition-colors hover:border-sun ${
                values.billRange === opt ? "border-sun bg-sun/10" : "border-line"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        {errors.billRange && <p className="text-[12.5px] text-red-600">{errors.billRange}</p>}
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-1 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-sun px-5 py-4 text-[15.5px] font-bold text-ink transition-colors hover:bg-sun-soft disabled:opacity-60"
      >
        {status === "sending" ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Gönderiliyor...
          </>
        ) : (
          "Ücretsiz Teklifimi Al"
        )}
      </button>
      {status === "error" && (
        <p className="text-center text-[13.5px] text-red-600">
          Bir sorun oluştu, lütfen tekrar deneyin.
        </p>
      )}
    </form>
  );
}
