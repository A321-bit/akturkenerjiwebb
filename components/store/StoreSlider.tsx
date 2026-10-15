"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { StoreSlide } from "@/lib/store";

const INTERVAL = 5000;

// Mağaza ana sayfasındaki dönen görsel alanı: kendiliğinden döner, üzerine
// gelince durur, ok/nokta ve mobilde parmakla kaydırma ile geçilir.
export default function StoreSlider({ slides }: { slides: StoreSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2) return;
    const t = setTimeout(() => go(index + 1), INTERVAL);
    return () => clearTimeout(t);
  }, [index, paused, count, go]);

  if (count === 0) return null;

  return (
    <div
      className="relative h-full min-h-[360px] overflow-hidden rounded-2xl bg-ink sm:min-h-[360px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
      aria-roledescription="carousel"
    >
      {slides.map((s, i) => (
        <div
          key={s.title}
          className={`absolute inset-0 transition-opacity duration-700 ${i === index ? "opacity-100" : "pointer-events-none opacity-0"}`}
          aria-hidden={i !== index}
        >
          <Image
            src={s.image}
            alt={s.title}
            fill
            priority={i === 0}
            sizes="(min-width: 1024px) 860px, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/60 to-ink/10 sm:bg-gradient-to-r sm:from-ink/90 sm:via-ink/55 sm:to-transparent" />
          <div className="relative flex h-full max-w-lg flex-col justify-end p-6 pb-12 text-paper sm:justify-center sm:p-10">
            {s.eyebrow && (
              <p className="font-mono-data text-[11.5px] uppercase tracking-[0.18em] text-sun-soft">{s.eyebrow}</p>
            )}
            <p className="mt-2 font-display text-2xl font-semibold leading-tight tracking-tight sm:text-[2.1rem]">{s.title}</p>
            {s.text && <p className="mt-3 text-[14.5px] leading-relaxed text-paper/80">{s.text}</p>}
            {s.cta && (
              <Link
                href={s.cta.href}
                tabIndex={i === index ? 0 : -1}
                className="mt-5 inline-flex w-fit items-center rounded-full bg-sun px-5 py-2.5 text-[14px] font-bold text-ink transition-colors hover:bg-sun-soft"
              >
                {s.cta.label}
              </Link>
            )}
          </div>
        </div>
      ))}

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Önceki"
            onClick={() => go(index - 1)}
            className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-paper/15 text-paper backdrop-blur hover:bg-paper/30 sm:flex"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Sonraki"
            onClick={() => go(index + 1)}
            className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-paper/15 text-paper backdrop-blur hover:bg-paper/30 sm:flex"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((s, i) => (
              <button
                key={s.title}
                type="button"
                aria-label={`${i + 1}. görsel`}
                onClick={() => go(i)}
                className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-sun" : "w-2 bg-paper/50 hover:bg-paper/80"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
