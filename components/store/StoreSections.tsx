import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, BadgeCheck, MessageCircle, PhoneCall, Star, Truck, Wrench } from "lucide-react";
import type { StoreCategory, StoreTextItem } from "@/lib/store";
import type { GoogleReviews } from "@/lib/google-reviews";

export function CategoryTiles({ categories }: { categories: StoreCategory[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/magaza/${c.slug}`}
          className="group relative flex min-h-[150px] flex-col justify-end overflow-hidden rounded-2xl border border-line bg-ink p-4 text-paper sm:min-h-[180px]"
        >
          {c.image && (
            <Image
              src={c.image}
              alt={c.name}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover opacity-55 transition-transform duration-500 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
          <div className="relative">
            <p className="font-display text-[16px] font-semibold leading-tight sm:text-[17px]">{c.name}</p>
            <p className="mt-1 hidden text-[12.5px] text-paper/75 sm:block">{c.short}</p>
          </div>
          <ArrowUpRight
            size={18}
            className="absolute right-3 top-3 text-sun transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </Link>
      ))}
    </div>
  );
}

export function TrustStrip({ google, items: extra }: { google: GoogleReviews | null; items: StoreTextItem[] }) {
  const items = [
    google
      ? {
          icon: Star,
          title: `Google'da ${google.rating.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} puan`,
          text: `${google.count} müşteri yorumu`,
        }
      : { icon: Star, title: "Müşteri memnuniyeti", text: "Google yorumlarımız" },
    ...extra.map((it, i) => ({ icon: [BadgeCheck, Wrench, Truck][i % 3], ...it })),
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ icon: Icon, title, text }) => (
        <div key={title} className="flex items-start gap-3 rounded-2xl border border-line bg-paper-raised p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sun/15 text-ink">
            <Icon size={17} />
          </span>
          <span>
            <span className="block text-[14px] font-semibold text-ink">{title}</span>
            <span className="block text-[12.5px] text-slate">{text}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function HowToOrder({ steps: items, note }: { steps: StoreTextItem[]; note?: string }) {
  const steps = items.map((it, i) => ({ icon: [MessageCircle, PhoneCall, Wrench][i % 3], ...it }));
  return (
    <div className="rounded-2xl border border-line bg-paper-raised p-6 sm:p-8">
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Sipariş nasıl işler?</p>
      <div className={`mt-5 grid gap-6 ${steps.length === 4 ? "sm:grid-cols-4" : steps.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
        {steps.map(({ icon: Icon, title, text }, i) => (
          <div key={`${i}-${title}`}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sun">
                <Icon size={18} />
              </span>
              <span className="font-mono-data text-[12px] text-slate-soft">0{i + 1}</span>
            </div>
            <p className="mt-3 font-display text-[16px] font-semibold text-ink">{title}</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-slate">{text}</p>
          </div>
        ))}
      </div>
      {note && <p className="mt-6 border-t border-line pt-4 text-[12.5px] text-slate-soft">{note}</p>}
    </div>
  );
}
