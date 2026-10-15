"use client";

import Image from "next/image";
import { MessageCircle, Wrench, Package } from "lucide-react";
import { whatsappLink, SITE_URL } from "@/lib/data";
import { formatTL, type StoreProduct } from "@/lib/store";
import { trackEvent } from "@/lib/track";
import { trackGa4WhatsappClick } from "@/lib/ga4";

export default function ProductCard({ product, whatsappNumber }: { product: StoreProduct; whatsappNumber: string }) {
  const hasPrice = product.priceMin != null;
  const priceText = hasPrice
    ? product.priceMax && product.priceMax !== product.priceMin
      ? `${formatTL(product.priceMin!)} – ${formatTL(product.priceMax)}`
      : formatTL(product.priceMin!)
    : "Fiyat için sorun";
  const message = `Merhaba, *${product.name}* için sipariş vermek istiyorum.${hasPrice ? ` (Fiyat: ${priceText})` : ""}\n\nSayfa: ${SITE_URL}/magaza/${product.category}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-paper-raised transition-shadow hover:border-sun/60 hover:shadow-[0_20px_44px_-24px_rgba(11,20,32,0.45)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-paper">
        {product.image && (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-3 py-1 font-mono-data text-[12px] font-semibold text-paper backdrop-blur">
          {product.power}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-[16.5px] font-semibold leading-snug text-ink">{product.name}</h3>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {product.specs.map((s) => (
            <span key={s} className="rounded-md bg-paper px-2 py-1 text-[12px] font-medium text-slate">
              {s}
            </span>
          ))}
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium ${
              product.installIncluded ? "bg-volt/10 text-volt" : "bg-sun/15 text-ink"
            }`}
          >
            {product.installIncluded ? <Wrench size={12} /> : <Package size={12} />}
            {product.installIncluded ? "Kurulum dahil" : "Kurulumsuz paket"}
          </span>
        </div>

        <div className="mt-auto pt-5">
          <p className="font-display text-[19px] font-bold tracking-tight text-ink">{priceText}</p>
          {hasPrice && <p className="text-[12px] text-slate-soft">KDV dahil</p>}
          <a
            href={whatsappLink(whatsappNumber, message)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackEvent("click", `/magaza/${product.category}`, "store_whatsapp_order");
              trackGa4WhatsappClick();
            }}
            className="mt-3 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 text-[14px] font-bold text-white transition-transform hover:scale-[1.02]"
          >
            <MessageCircle size={17} fill="currentColor" />
            WhatsApp&apos;tan Sipariş
          </a>
        </div>
      </div>
    </article>
  );
}
