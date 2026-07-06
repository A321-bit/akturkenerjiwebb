import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Service } from "@/lib/site-config";

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      href={`/hizmetlerimiz/${service.slug}`}
      className="group flex flex-col justify-between rounded-2xl border border-line bg-paper-raised p-6 transition-all hover:-translate-y-0.5 hover:border-sun/60 hover:shadow-[0_16px_40px_-24px_rgba(11,20,32,0.4)]"
    >
      <div>
        <p className="font-mono-data text-[11px] uppercase tracking-[0.14em] text-brand">
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
