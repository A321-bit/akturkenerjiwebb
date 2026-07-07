"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

type Slide = { type: "video"; embedUrl: string } | { type: "image"; src: string };

export default function MediaCarousel({
  images,
  videoUrl,
  title,
}: {
  images: string[];
  videoUrl?: string;
  title: string;
}) {
  const embedUrl = videoUrl ? getYouTubeEmbedUrl(videoUrl) : null;
  const slides: Slide[] = [
    ...(embedUrl ? [{ type: "video" as const, embedUrl }] : []),
    ...images.map((src) => ({ type: "image" as const, src })),
  ];
  const [index, setIndex] = useState(0);

  if (slides.length === 0) return null;

  function prev() {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }
  function next() {
    setIndex((i) => (i + 1) % slides.length);
  }

  const current = slides[index];

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-ink-soft sm:aspect-[16/9]">
        {current.type === "video" ? (
          <iframe
            src={current.embedUrl}
            title={`${title} - video`}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <Image src={current.src} alt={title} fill className="object-cover" />
        )}

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Önceki görsel"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink/70 text-paper transition-colors hover:bg-ink"
            >
              <ChevronLeft size={19} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Sonraki görsel"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink/70 text-paper transition-colors hover:bg-ink"
            >
              <ChevronRight size={19} />
            </button>
          </>
        )}
      </div>

      {slides.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {slides.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${i + 1}. görsele git`}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === index ? "border-sun" : "border-transparent"
              }`}
            >
              {s.type === "video" ? (
                <span className="flex h-full w-full items-center justify-center bg-ink text-paper">
                  <PlayCircle size={20} />
                </span>
              ) : (
                <Image src={s.src} alt="" fill className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
