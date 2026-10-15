"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2, X } from "lucide-react";
import { supabasePublic } from "@/lib/supabase";

// Dosyayı olduğu gibi (işlemeden, filigransız) yükler: datasheet PDF'i,
// marka logosu (SVG/PNG) gibi. Fotoğraflar için ImageUploadField kullanılır.
export default function FileUploadField({
  value,
  onChange,
  accept = "application/pdf",
  label = "Dosya seç",
  preview = "link",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  accept?: string;
  label?: string;
  preview?: "link" | "image";
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
        body: JSON.stringify({ filename: file.name.toLowerCase() }),
      });
      const urlBody = await urlRes.json().catch(() => ({}));
      if (!urlRes.ok) throw new Error(urlBody.error ?? "Yükleme başlatılamadı.");
      const { error: uploadError } = await supabasePublic.storage
        .from("media")
        .uploadToSignedUrl(urlBody.path, urlBody.token, file, { contentType: file.type || undefined });
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
        <div className="flex items-center gap-2">
          {preview === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-12 max-w-[160px] rounded border border-line bg-white object-contain p-1" />
          ) : (
            <a href={value} target="_blank" rel="noopener noreferrer" className="max-w-[320px] truncate text-[13px] text-brand underline">
              {value.split("/").pop()}
            </a>
          )}
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-full bg-ink/80 p-1 text-paper"
            aria-label="Dosyayı kaldır"
          >
            <X size={12} />
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
        className="hidden"
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="flex min-h-[42px] w-fit items-center gap-2 rounded-lg border-2 border-dashed border-brand/40 bg-brand/5 px-4 py-2 text-[13.5px] font-semibold text-brand transition-colors hover:border-brand hover:bg-brand/10 disabled:opacity-60"
      >
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
        {uploading ? "Yükleniyor..." : value ? "Değiştir" : label}
      </button>
      {error && <p className="text-[12.5px] text-red-600">{error}</p>}
    </div>
  );
}
