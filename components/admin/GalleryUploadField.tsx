"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImageUp, Loader2, X } from "lucide-react";
import { supabasePublic } from "@/lib/supabase";

export default function GalleryUploadField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    setUploading(true);
    setError("");
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
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

        uploaded.push(urlBody.publicUrl);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Yükleme başarısız.");
      }
    }
    onChange([...value, ...uploaded]);
    setUploading(false);
  }

  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((url, i) => (
            <div key={url + i} className="relative aspect-[4/3] overflow-hidden rounded-lg border border-line">
              <Image src={url} alt="" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-1 top-1 rounded-full bg-ink/80 p-1 text-paper"
                aria-label="Kaldır"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        disabled={uploading}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
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
            <ImageUp size={16} /> Görsel ekle (birden fazla seçebilirsiniz)
          </>
        )}
      </button>
      {error && <p className="text-[12.5px] text-red-600">{error}</p>}
    </div>
  );
}
