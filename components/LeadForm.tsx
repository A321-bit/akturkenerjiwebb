"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { z } from "zod";
import { trackEvent } from "@/lib/track";
import { buildLeadAttributionFields } from "@/lib/attribution";
import {
  Home,
  Trees,
  HardHat,
  Sprout,
  User,
  PhoneCall,
  Mail,
  Loader2,
  CheckCircle2,
  Check,
} from "lucide-react";

const needTypes = [
  { value: "Villa Çatı GES", label: "Villa Çatı GES", icon: Home },
  { value: "Hobi Bahçesi", label: "Hobi Bahçesi", icon: Trees },
  { value: "İnşaat / Müteahhitlik", label: "İnşaat / Müteahhitlik", icon: HardHat },
  { value: "Tarımsal Sulama", label: "Tarımsal Sulama", icon: Sprout },
] as const;

const billOptions = [
  "0 - 1.000 ₺",
  "1.000 - 3.000 ₺",
  "3.000 - 6.000 ₺",
  "6.000 ₺ üzeri",
  "Şebeke bağlantım yok",
];

const steps = ["İhtiyaç", "Detay", "İletişim"];

const leadSchema = z.object({
  needType: z.string().min(1, "Bir ihtiyaç türü seçin"),
  billRange: z.string().min(1, "Bir seçenek işaretleyin"),
  fullname: z.string().trim().min(3, "Ad soyad girin"),
  phone: z.string().trim().min(7, "Telefon numarası girin"),
  email: z.union([z.literal(""), z.string().trim().email("Geçerli bir e-posta girin")]),
});

type LeadFormValues = z.infer<typeof leadSchema>;

export default function LeadForm() {
  const pathname = usePathname();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<LeadFormValues>({
    needType: "",
    billRange: "",
    fullname: "",
    phone: "",
    email: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormValues, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  function selectNeed(value: string) {
    setValues((v) => ({ ...v, needType: value }));
    setStep(1);
  }

  function selectBill(value: string) {
    setValues((v) => ({ ...v, billRange: value }));
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = leadSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof LeadFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as keyof LeadFormValues] = issue.message;
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
          ...buildLeadAttributionFields(pathname ?? "/"),
        }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("sent");
      trackEvent("click", pathname ?? "/", "lead_form_submit");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-paper-raised p-10 text-center">
        <CheckCircle2 size={40} className="text-volt" />
        <p className="font-display text-lg font-semibold">Teklif talebiniz alındı</p>
        <p className="max-w-sm text-[14.5px] text-slate">
          Uzman mühendisimiz 15 dakika içinde sizi arayacak.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-paper-raised p-6 sm:p-8">
      <div className="flex items-center gap-2">
        {steps.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2 last:flex-none">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono-data text-[12.5px] font-semibold transition-colors ${
                i <= step ? "bg-ink text-paper" : "border border-line text-slate-soft"
              }`}
            >
              {i < step ? <Check size={15} /> : i + 1}
            </div>
            <span className="hidden text-[12.5px] font-medium text-slate sm:block">{label}</span>
            {i < steps.length - 1 && (
              <div className={`h-px flex-1 transition-colors ${i < step ? "bg-ink" : "bg-line"}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-8">
        {step === 0 && (
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <p className="font-display text-[17px] font-semibold text-ink">
                Hangi ihtiyacınız için teklif almak istiyorsunuz?
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {needTypes.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => selectNeed(value)}
                    className={`flex min-h-[68px] items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:border-sun ${
                      values.needType === value ? "border-sun bg-sun/10" : "border-line"
                    }`}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                      <Icon size={20} />
                    </span>
                    <span className="text-[14.5px] font-semibold text-ink">{label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

        {step === 1 && (
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <p className="font-display text-[17px] font-semibold text-ink">
                Aylık ortalama elektrik faturanız ne kadar?
              </p>
              <div className="mt-5 grid gap-2.5">
                {billOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => selectBill(opt)}
                    className={`min-h-[52px] rounded-xl border p-3.5 text-left text-[14.5px] font-medium text-ink transition-colors hover:border-sun ${
                      values.billRange === opt ? "border-sun bg-sun/10" : "border-line"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setStep(0)}
                className="mt-5 text-[13px] font-medium text-slate hover:text-ink"
              >
                ← Geri dön
              </button>
            </motion.div>
          )}

        {step === 2 && (
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <p className="font-display text-[17px] font-semibold text-ink">
                Sizi arayabilmemiz için iletişim bilgilerinizi bırakın
              </p>
              <div className="mt-5 grid gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="fullname" className="flex items-center gap-1.5 text-[13px] font-medium text-slate">
                    <User size={14} /> Ad Soyad
                  </label>
                  <input
                    id="fullname"
                    name="fullname"
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
                  <label htmlFor="phone" className="flex items-center gap-1.5 text-[13px] font-medium text-slate">
                    <PhoneCall size={14} /> Telefon Numarası
                  </label>
                  <input
                    id="phone"
                    name="phone"
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
                  <label htmlFor="email" className="flex items-center gap-1.5 text-[13px] font-medium text-slate">
                    <Mail size={14} /> E-posta (opsiyonel)
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={values.email}
                    onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
                    className="min-h-[52px] rounded-lg border border-line bg-paper px-3.5 py-3 text-[15px] outline-none focus:border-sun focus:ring-1 focus:ring-sun"
                  />
                  {errors.email && <p className="text-[12.5px] text-red-600">{errors.email}</p>}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="mt-5 text-[13px] font-medium text-slate hover:text-ink"
              >
                ← Geri dön
              </button>

              <button
                type="submit"
                disabled={status === "sending"}
                className="mt-4 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-sun px-5 py-4 text-[15px] font-bold text-ink transition-colors hover:bg-sun-soft disabled:opacity-60"
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
                <p className="mt-3 text-center text-[13.5px] text-red-600">
                  Bir sorun oluştu, lütfen tekrar deneyin ya da doğrudan WhatsApp&apos;tan yazın.
                </p>
              )}
            </motion.div>
        )}
      </form>
    </div>
  );
}
