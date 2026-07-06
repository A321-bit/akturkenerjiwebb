"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, X } from "lucide-react";

export default function GalleryUploadField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList) {
    setUploading(true);
    setError("");
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Yükleme başarısız.");
        continue;
      }
      uploaded.push(body.url);
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
        type="file"
        accept="image/*"
        multiple
        disabled={uploading}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
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
