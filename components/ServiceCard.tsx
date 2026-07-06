"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Service } from "@/lib/site-config";
import CoverMedia from "@/components/CoverMedia";

export default function ServiceCard({ service }: { service: Service }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -6, y: px * 8 });
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
  }

  return (
    <Link
      ref={ref}
      href={`/hizmetlerimiz/${service.slug}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(0)`,
        transition: "transform 150ms ease-out",
      }}
      className="group flex flex-col justify-between rounded-2xl border border-line bg-paper-raised p-4 will-change-transform hover:border-sun/60 hover:shadow-[0_20px_44px_-24px_rgba(11,20,32,0.45)]"
    >
      <div>
        <CoverMedia
          src={service.image}
          alt={service.title}
          label={service.eyebrow}
          aspect="aspect-[16/11]"
          iconSize={40}
        />
        <p className="mt-4 font-mono-data text-[11px] uppercase tracking-[0.14em] text-brand">
          {service.eyebrow}
        </p>
        <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-ink">
          {service.title}
        </h3>
        <p className="mt-2.5 text-[14px] leading-relaxed text-slate">
          {service.summary}
        </p>
      </div>
      <div className="mt-5 flex items-center gap-1.5 text-[13.5px] font-semibold text-ink">
        Detayları gör
        <ArrowUpRight
          size={15}
          className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </div>
    </Link>
  );
}
