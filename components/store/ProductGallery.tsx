"use client";

import Image from "next/image";
import { useState } from "react";

// Ürün galerisi: büyük görsel + küçük resimler. Görseller gerçek kurulum
// fotoğrafları (ölçek ve gerçek ortamı gösterir).
export default function ProductGallery({ images, alt, badge }: { images: string[]; alt: string; badge?: string }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) return null;

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-paper">
        <Image
          key={images[active]}
          src={images[active]}
          alt={alt}
          fill
          priority
          sizes="(min-width: 1024px) 560px, 100vw"
          className="object-cover"
        />
        {badge && (
          <span className="absolute right-3 top-3 rounded-full bg-[#e8562a] px-3 py-1 text-[14px] font-bold text-white">
            {badge}
          </span>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${i + 1}. görsel`}
              className={`relative aspect-[4/3] overflow-hidden rounded-xl border-2 bg-paper ${
                i === active ? "border-sun" : "border-transparent hover:border-line"
              }`}
            >
              <Image src={src} alt={`${alt} – görsel ${i + 1}`} fill sizes="140px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
