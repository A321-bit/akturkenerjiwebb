"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { z } from "zod";
import { Zap, X, User, PhoneCall, MapPin, Wrench, Loader2, CheckCircle2 } from "lucide-react";
import { trackEvent } from "@/lib/track";
import { TURKISH_PROVINCES } from "@/lib/turkish-provinces";
import { whatsappLink } from "@/lib/data";
import { buildLeadAttributionFields } from "@/lib/attribution";

const quoteSchema = z.object({
  fullname: z.string().trim().min(3, "Ad soyad girin"),
  phone: z.string().trim().min(7, "Telefon numarası girin"),
  province: z.string().min(1, "İl seçin"),
  purpose: z.string().trim().min(2, "Kurulum amacını belirtin"),
});

type QuoteValues = z.infer<typeof quoteSchema>;

const variantStyles = {
  red: {
    button:
      "bg-red-600 shadow-[0_10px_30px_-8px_rgba(220,38,38,0.55)] hover:bg-red-700 text-white",
    accent: "text-red-600",
    input: "focus:border-red-500 focus:ring-red-500",
    submit: "bg-red-600 hover:bg-red-700 text-white",
  },
  sun: {
    button: "bg-sun shadow-[0_10px_30px_-8px_rgba(238,162,58,0.6)] hover:bg-sun-soft text-ink",
    accent: "text-brand",
    input: "focus:border-sun focus:ring-sun",
    submit: "bg-sun hover:bg-sun-soft text-ink",
  },
} as const;

export default function QuoteModal({
  defaultPurpose = "",
  label = "Teklif Al",
  className = "",
  variant = "red",
  redirectTo = "whatsapp",
  whatsappNumber,
  onOpen,
}: {
  defaultPurpose?: string;
  label?: string;
  className?: string;
  variant?: "red" | "sun";
  redirectTo?: "whatsapp" | "iletisim" | "none";
  whatsappNumber: string;
  onOpen?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const styles = variantStyles[variant];
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<QuoteValues>({
    fullname: "",
    phone: "",
    province: "",
    purpose: defaultPurpose,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof QuoteValues, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  function openModal() {
    setValues((v) => ({ ...v, purpose: defaultPurpose }));
    setStatus("idle");
    setErrors({});
    setOpen(true);
    trackEvent("click", pathname ?? "/", "quote_button_open");
    onOpen?.();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = quoteSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof QuoteValues, string>> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as keyof QuoteValues] = issue.message;
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
          needType: parsed.data.purpose,
          fullname: parsed.data.fullname,
          phone: parsed.data.phone,
          province: parsed.data.province,
          source: "quick_quote",
          ...buildLeadAttributionFields(pathname ?? "/"),
        }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("sent");
      trackEvent("click", pathname ?? "/", "quote_form_submit");

      if (redirectTo === "whatsapp") {
        const message = `Merhaba, ben ${parsed.data.fullname}. ${parsed.data.purpose} hakkında bilgi almak istiyorum. Telefon: ${parsed.data.phone}`;
        window.open(whatsappLink(whatsappNumber, message), "_blank", "noopener,noreferrer");
      } else if (redirectTo === "iletisim") {
        setTimeout(() => {
          router.push("/iletisim");
        }, 1400);
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={`group inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-bold transition-transform hover:scale-[1.03] ${styles.button} ${className}`}
      >
        <Zap size={17} fill="currentColor" />
        {label}
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-ink/70 px-4 py-8 backdrop-blur-sm sm:items-center"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
          <div className="relative my-auto w-full max-w-md rounded-2xl border border-line bg-paper p-6 shadow-2xl sm:p-7">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Kapat"
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate hover:bg-ink/5 hover:text-ink"
            >
              <X size={18} />
            </button>

            {status === "sent" ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle2 size={40} className="text-volt" />
                <p className="font-display text-lg font-semibold text-ink">Teklif talebiniz alındı</p>
                <p className="max-w-xs text-[14px] text-slate">
                  {redirectTo === "whatsapp"
                    ? "WhatsApp'a yönlendiriliyorsunuz. Açılmadıysa aşağıdaki butona dokunun."
                    : redirectTo === "iletisim"
                    ? "Birazdan iletişim sayfasına yönlendirileceksiniz."
                    : "Ekibimiz en kısa sürede sizi arayarak size özel fiyat teklifini paylaşacak."}
                </p>
                {redirectTo === "whatsapp" && (
                  <a
                    href={whatsappLink(
                      whatsappNumber,
                      `Merhaba, ben ${values.fullname}. ${values.purpose} hakkında bilgi almak istiyorum. Telefon: ${values.phone}`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 rounded-full bg-ink px-5 py-2.5 text-[13.5px] font-semibold text-paper hover:bg-sun hover:text-ink"
                  >
                    WhatsApp&apos;ı Aç
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-full border border-line px-5 py-2.5 text-[13.5px] font-semibold text-ink hover:border-brand"
                >
                  Kapat
                </button>
              </div>
            ) : (
              <>
                <p className={`pr-8 font-mono-data text-[11px] uppercase tracking-[0.14em] ${styles.accent}`}>
                  Hızlı Teklif
                </p>
                <h3 className="mt-1.5 font-display text-xl font-semibold text-ink">
                  Sizi hemen arayalım
                </h3>
                <p className="mt-1.5 text-[13.5px] text-slate">
                  4 bilgiyi bırakın, ekibimiz size özel fiyat teklifiyle dönsün.
                </p>

                <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="q-fullname" className="flex items-center gap-1.5 text-[13px] font-medium text-slate">
                      <User size={14} /> Ad Soyad
                    </label>
                    <input
                      id="q-fullname"
                      type="text"
                      autoComplete="name"
                      required
                      value={values.fullname}
                      onChange={(e) => setValues((v) => ({ ...v, fullname: e.target.value }))}
                      className={`min-h-[48px] rounded-lg border border-line bg-paper px-3.5 py-3 text-[15px] outline-none focus:ring-1 ${styles.input}`}
                    />
                    {errors.fullname && <p className="text-[12.5px] text-red-600">{errors.fullname}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="q-phone" className="flex items-center gap-1.5 text-[13px] font-medium text-slate">
                      <PhoneCall size={14} /> Telefon Numarası
                    </label>
                    <input
                      id="q-phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="05xx xxx xx xx"
                      required
                      value={values.phone}
                      onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
                      className={`min-h-[48px] rounded-lg border border-line bg-paper px-3.5 py-3 text-[15px] outline-none focus:ring-1 ${styles.input}`}
                    />
                    {errors.phone && <p className="text-[12.5px] text-red-600">{errors.phone}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="q-province" className="flex items-center gap-1.5 text-[13px] font-medium text-slate">
                      <MapPin size={14} /> İl
                    </label>
                    <select
                      id="q-province"
                      required
                      value={values.province}
                      onChange={(e) => setValues((v) => ({ ...v, province: e.target.value }))}
                      className={`min-h-[48px] rounded-lg border border-line bg-paper px-3.5 py-3 text-[15px] outline-none focus:ring-1 ${styles.input}`}
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
                    <label htmlFor="q-purpose" className="flex items-center gap-1.5 text-[13px] font-medium text-slate">
                      <Wrench size={14} /> Kurulum Amacı
                    </label>
                    <input
                      id="q-purpose"
                      type="text"
                      required
                      value={values.purpose}
                      onChange={(e) => setValues((v) => ({ ...v, purpose: e.target.value }))}
                      className={`min-h-[48px] rounded-lg border border-line bg-paper px-3.5 py-3 text-[15px] outline-none focus:ring-1 ${styles.input}`}
                    />
                    {errors.purpose && <p className="text-[12.5px] text-red-600">{errors.purpose}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className={`mt-1 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-[15px] font-bold transition-colors disabled:opacity-60 ${styles.submit}`}
                  >
                    {status === "sending" ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Gönderiliyor...
                      </>
                    ) : (
                      "Beni Arayın"
                    )}
                  </button>
                  {status === "error" && (
                    <p className="text-center text-[13px] text-red-600">
                      Bir sorun oluştu, lütfen tekrar deneyin ya da doğrudan WhatsApp&apos;tan yazın.
                    </p>
                  )}
                </form>
              </>
            )}
          </div>
          </div>,
          document.body
        )}
    </>
  );
}
