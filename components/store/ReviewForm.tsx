"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Star } from "lucide-react";

// Ürün yorumu formu. Gönderilen yorum admin onayından sonra yayınlanır.
export default function ReviewForm({ productSlug }: { productSlug: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Lütfen 1 ile 5 arasında yıldız seçin.");
      return;
    }
    setStatus("sending");
    setError("");
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productSlug, name, city, rating, comment, website }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("error");
      setError(body.error ?? "Yorum gönderilemedi.");
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-volt/30 bg-volt/10 p-5">
        <CheckCircle2 size={22} className="shrink-0 text-volt" />
        <p className="text-[14.5px] text-ink">
          Teşekkürler! Yorumunuz alındı; kontrol edildikten sonra bu sayfada yayınlanacak.
        </p>
      </div>
    );
  }

  const input = "rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[14.5px] outline-none focus:border-brand";

  return (
    <form onSubmit={submit} className="rounded-2xl border border-line bg-paper-raised p-5 sm:p-6">
      <p className="font-display text-[17px] font-semibold text-ink">Bu paketi değerlendirin</p>

      <div className="mt-3 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} yıldız`}
            onMouseEnter={() => setHover(n)}
            onClick={() => setRating(n)}
            className="p-0.5"
          >
            <Star size={28} className={(hover || rating) >= n ? "fill-sun text-sun" : "fill-line text-line"} />
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input required placeholder="Adınız Soyadınız" value={name} onChange={(e) => setName(e.target.value)} className={input} maxLength={60} />
        <input placeholder="Şehir (isteğe bağlı)" value={city} onChange={(e) => setCity(e.target.value)} className={input} maxLength={40} />
      </div>
      <textarea
        required
        rows={4}
        placeholder="Paket ve kurulum hakkındaki deneyiminizi yazın"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className={`${input} mt-3 w-full`}
        maxLength={1500}
      />
      {/* Bot tuzağı: gerçek kullanıcılar görmez */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="hidden"
        aria-hidden
      />

      {error && <p className="mt-3 text-[13.5px] text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[14.5px] font-semibold text-paper hover:bg-sun hover:text-ink disabled:opacity-60"
      >
        {status === "sending" && <Loader2 size={16} className="animate-spin" />}
        Yorumu Gönder
      </button>
      <p className="mt-2 text-[12px] text-slate-soft">Yorumlar kontrol edildikten sonra yayınlanır.</p>
    </form>
  );
}
