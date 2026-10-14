import { Star, ArrowUpRight } from "lucide-react";
import type { GoogleReviews as GoogleReviewsData } from "@/lib/google-reviews";
import Reveal from "@/components/Reveal";

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`5 üzerinden ${value.toLocaleString("tr-TR")}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? "fill-sun text-sun" : "fill-line text-line"}
        />
      ))}
    </span>
  );
}

// Hero, form yanı gibi yerler için tek satırlık puan rozeti.
export function GoogleRatingBadge({
  data,
  tone = "dark",
}: {
  data: GoogleReviewsData;
  tone?: "dark" | "light";
}) {
  return (
    <a
      href={data.mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 text-[13.5px] ${
        tone === "dark" ? "text-slate-soft hover:text-paper" : "text-slate hover:text-ink"
      }`}
    >
      <Stars value={data.rating} />
      <span>
        <strong className={tone === "dark" ? "text-paper" : "text-ink"}>
          {data.rating.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        </strong>{" "}
        · Google&apos;da {data.count} yorum
      </span>
    </a>
  );
}

export default function GoogleReviews({ data }: { data: GoogleReviewsData }) {
  const reviews = data.reviews.slice(0, 5);

  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
              Müşteri Yorumları
            </p>
            <h2 className="mt-2 max-w-xl font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Müşterilerimiz Google&apos;da ne diyor?
            </h2>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-paper-raised px-5 py-3">
            <span className="font-display text-3xl font-semibold">
              {data.rating.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
            <span className="flex flex-col gap-1">
              <Stars value={data.rating} size={16} />
              <span className="text-[12.5px] text-slate">{data.count} Google yorumu</span>
            </span>
          </div>
        </div>
      </Reveal>

      {reviews.length > 0 && (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <Reveal key={`${r.author}-${i}`} delay={(i % 3) * 60} className="h-full">
              <figure className="flex h-full flex-col rounded-2xl border border-line bg-paper-raised p-6">
                <Stars value={r.rating} />
                <blockquote className="mt-3 line-clamp-[8] text-[14.5px] leading-relaxed text-ink">
                  &ldquo;{r.text}&rdquo;
                </blockquote>
                <figcaption className="mt-auto flex items-center gap-3 border-t border-line pt-4 text-[13px] text-slate">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 font-semibold text-brand">
                    {r.author.charAt(0).toLocaleUpperCase("tr-TR")}
                  </span>
                  <span>
                    {r.authorUrl ? (
                      <a href={r.authorUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink hover:text-brand">
                        {r.author}
                      </a>
                    ) : (
                      <span className="font-semibold text-ink">{r.author}</span>
                    )}
                    <br />
                    {r.relativeTime} · Google
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[14px] font-semibold">
        <a href={data.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-ink hover:text-brand">
          Tüm yorumları Google&apos;da okuyun <ArrowUpRight size={15} />
        </a>
        <a href={data.writeReviewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-slate hover:text-brand">
          Siz de yorum yazın <ArrowUpRight size={15} />
        </a>
      </div>
    </section>
  );
}
