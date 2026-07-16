"use client";

import { useRef, useState } from "react";
import { User, MapPin, PhoneCall, FileText, Paperclip, Loader2, CheckCircle2 } from "lucide-react";
import { supabasePublic } from "@/lib/supabase";

type Values = {
  fullname: string;
  address: string;
  phone: string;
  description: string;
};

export default function JobApplicationForm() {
  const [values, setValues] = useState<Values>({
    fullname: "",
    address: "",
    phone: "",
    description: "",
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!values.fullname.trim() || !values.phone.trim()) {
      setError("Ad soyad ve telefon numarası zorunludur.");
      return;
    }
    setError("");
    setStatus("sending");
    try {
      let cvUrl: string | null = null;
      if (cvFile) {
        const urlRes = await fetch("/api/job-application/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: cvFile.name }),
        });
        const urlBody = await urlRes.json().catch(() => ({}));
        if (!urlRes.ok) throw new Error(urlBody.error ?? "CV yüklenemedi.");

        const { error: uploadError } = await supabasePublic.storage
          .from("media")
          .uploadToSignedUrl(urlBody.path, urlBody.token, cvFile);
        if (uploadError) throw uploadError;
        cvUrl = urlBody.publicUrl;
      }

      const res = await fetch("/api/job-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, cvUrl }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bir sorun oluştu.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 size={36} className="text-volt" />
        <p className="font-display text-[16px] font-semibold text-ink">Başvurunuz alındı</p>
        <p className="max-w-sm text-[13.5px] text-slate">
          Uygun bir proje açıldığında sizinle iletişime geçeceğiz.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 grid gap-3.5 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ja-fullname" className="flex items-center gap-1.5 text-[13px] font-medium text-slate">
          <User size={14} /> Ad Soyad
        </label>
        <input
          id="ja-fullname"
          type="text"
          autoComplete="name"
          required
          value={values.fullname}
          onChange={(e) => setValues((v) => ({ ...v, fullname: e.target.value }))}
          className="min-h-[46px] rounded-lg border border-line bg-paper px-3.5 py-3 text-[14.5px] outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ja-phone" className="flex items-center gap-1.5 text-[13px] font-medium text-slate">
          <PhoneCall size={14} /> Telefon
        </label>
        <input
          id="ja-phone"
          type="tel"
          autoComplete="tel"
          placeholder="05xx xxx xx xx"
          required
          value={values.phone}
          onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
          className="min-h-[46px] rounded-lg border border-line bg-paper px-3.5 py-3 text-[14.5px] outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label htmlFor="ja-address" className="flex items-center gap-1.5 text-[13px] font-medium text-slate">
          <MapPin size={14} /> Adres
        </label>
        <input
          id="ja-address"
          type="text"
          autoComplete="street-address"
          value={values.address}
          onChange={(e) => setValues((v) => ({ ...v, address: e.target.value }))}
          className="min-h-[46px] rounded-lg border border-line bg-paper px-3.5 py-3 text-[14.5px] outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label htmlFor="ja-description" className="flex items-center gap-1.5 text-[13px] font-medium text-slate">
          <FileText size={14} /> Açıklama
        </label>
        <textarea
          id="ja-description"
          rows={3}
          placeholder="Hangi pozisyonla ilgilendiğinizi ve deneyiminizi kısaca anlatın"
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          className="rounded-lg border border-line bg-paper px-3.5 py-3 text-[14.5px] outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="flex items-center gap-1.5 text-[13px] font-medium text-slate">
          <Paperclip size={14} /> CV Yükle (opsiyonel)
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex min-h-[46px] w-fit items-center gap-2 rounded-lg border-2 border-dashed border-brand/40 bg-brand/5 px-4 py-2.5 text-[13.5px] font-semibold text-brand transition-colors hover:border-brand hover:bg-brand/10"
        >
          <Paperclip size={16} />
          {cvFile ? cvFile.name : "PDF/Word dosyası seç"}
        </button>
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={status === "sending"}
          className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-[14.5px] font-semibold text-paper transition-colors hover:bg-sun hover:text-ink disabled:opacity-60 sm:w-auto"
        >
          {status === "sending" ? (
            <>
              <Loader2 size={17} className="animate-spin" /> Gönderiliyor...
            </>
          ) : (
            "Başvuruyu Gönder"
          )}
        </button>
        {error && <p className="mt-2 text-[12.5px] text-red-600">{error}</p>}
      </div>
    </form>
  );
}
