"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImageUp, Loader2, X } from "lucide-react";
import { supabasePublic } from "@/lib/supabase";

export default function ImageUploadField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const urlRes = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name }),
      });
      const urlBody = await urlRes.json().catch(() => ({}));
      if (!urlRes.ok) throw new Error(urlBody.error ?? "Yükleme başlatılamadı.");

      const { error: uploadError } = await supabasePublic.storage
        .from("media")
        .uploadToSignedUrl(urlBody.path, urlBody.token, file);
      if (uploadError) throw uploadError;

      onChange(urlBody.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yükleme başarısız.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {value && (
        <div className="relative h-32 w-52 overflow-hidden rounded-lg border border-line">
          <Image src={value} alt="" fill className="object-cover" unoptimized />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-1.5 top-1.5 rounded-full bg-ink/80 p-1 text-paper"
            aria-label="Görseli kaldır"
          >
            <X size={13} />
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="hidden"
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="flex min-h-[46px] w-fit items-center gap-2 rounded-lg border-2 border-dashed border-brand/40 bg-brand/5 px-4 py-2.5 text-[13.5px] font-semibold text-brand transition-colors hover:border-brand hover:bg-brand/10 disabled:opacity-60"
      >
        {uploading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Yükleniyor...
          </>
        ) : (
          <>
            <ImageUp size={16} /> {value ? "Görseli değiştir" : "Görsel seç"}
          </>
        )}
      </button>
      {error && <p className="text-[12.5px] text-red-600">{error}</p>}
    </div>
  );
}
