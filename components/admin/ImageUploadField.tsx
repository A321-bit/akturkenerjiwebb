"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, X } from "lucide-react";

export default function ImageUploadField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Yükleme başarısız.");
      setUploading(false);
      return;
    }
    onChange(body.url);
    setUploading(false);
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
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="text-[13px]"
      />
      {uploading && (
        <p className="flex items-center gap-1.5 text-[12.5px] text-slate-soft">
          <Loader2 size={13} className="animate-spin" /> Yükleniyor...
        </p>
      )}
      {error && <p className="text-[12.5px] text-red-600">{error}</p>}
    </div>
  );
}
