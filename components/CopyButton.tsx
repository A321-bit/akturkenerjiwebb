"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      title="Kopyala"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {
          // Pano izni yoksa sessizce geç; IBAN zaten ekranda yazılı.
        }
      }}
      className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-semibold transition-colors ${
        done ? "border-volt/40 bg-volt/10 text-volt" : "border-line text-slate hover:border-ink hover:text-ink"
      }`}
    >
      {done ? <Check size={13} /> : <Copy size={13} />}
      {done ? "Kopyalandı" : "Kopyala"}
    </button>
  );
}
