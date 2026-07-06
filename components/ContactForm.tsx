"use client";

import { useState } from "react";
import { ArrowUpRight, CheckCircle2, Loader2 } from "lucide-react";

const interestOptions = [
  "Villa / Müstakil Ev",
  "Müteahhit / Toplu Proje",
  "Tarımsal Sulama",
  "Hobi Bahçesi",
  "Karavan",
  "Diğer",
];

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-paper-raised p-10 text-center">
        <CheckCircle2 size={36} className="text-volt" />
        <p className="font-display text-lg font-semibold">Talebiniz alındı</p>
        <p className="max-w-sm text-[14.5px] text-slate">
          En kısa sürede sizinle iletişime geçeceğiz. Daha hızlı yanıt için
          WhatsApp&apos;tan da yazabilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-line bg-paper-raised p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-[13px] font-medium text-slate">
            Ad Soyad
          </label>
          <input
            id="name"
            name="name"
            required
            className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[14.5px] outline-none focus:border-sun focus:ring-1 focus:ring-sun"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-[13px] font-medium text-slate">
            Telefon
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[14.5px] outline-none focus:border-sun focus:ring-1 focus:ring-sun"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-[13px] font-medium text-slate">
            E-posta
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[14.5px] outline-none focus:border-sun focus:ring-1 focus:ring-sun"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="city" className="text-[13px] font-medium text-slate">
            İl / İlçe
          </label>
          <input
            id="city"
            name="city"
            className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[14.5px] outline-none focus:border-sun focus:ring-1 focus:ring-sun"
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="interest" className="text-[13px] font-medium text-slate">
            İlgilendiğiniz Hizmet
          </label>
          <select
            id="interest"
            name="interest"
            className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[14.5px] outline-none focus:border-sun focus:ring-1 focus:ring-sun"
          >
            {interestOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="message" className="text-[13px] font-medium text-slate">
            Mesajınız
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            placeholder="Örneğin: çatı tipi, aylık fatura tutarı, ilçe..."
            className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[14.5px] outline-none focus:border-sun focus:ring-1 focus:ring-sun"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="group mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-[14.5px] font-semibold text-paper transition-colors hover:bg-sun hover:text-ink disabled:opacity-60 sm:w-auto"
      >
        {status === "sending" ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Gönderiliyor...
          </>
        ) : (
          <>
            Ücretsiz Keşif Talep Et
            <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </>
        )}
      </button>
      {status === "error" && (
        <p className="mt-3 text-[13.5px] text-red-600">
          Bir sorun oluştu, lütfen tekrar deneyin ya da doğrudan WhatsApp&apos;tan yazın.
        </p>
      )}
    </form>
  );
}
