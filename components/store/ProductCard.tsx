"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { whatsappLink, SITE_URL } from "@/lib/data";
import { discountPercent, formatTL, type StoreProduct } from "@/lib/store";
import { productHref } from "@/lib/store-details";
import { trackEvent } from "@/lib/track";
import { trackGa4WhatsappClick } from "@/lib/ga4";

export default function ProductCard({ product, whatsappNumber }: { product: StoreProduct; whatsappNumber: string }) {
  const discount = discountPercent(product);
  const priceText = product.price != null ? formatTL(product.price) : "Fiyat için sorun";
  const message = `Merhaba, *${product.name}* için sipariş vermek istiyorum.${
    product.price != null ? ` (Fiyat: ${priceText})` : ""
  }\n\nÜrün: ${SITE_URL}${productHref(product)}`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-paper-raised transition-shadow hover:border-sun/60 hover:shadow-[0_20px_44px_-24px_rgba(11,20,32,0.45)]">
      <Link href={productHref(product)} className="relative block aspect-[4/3] overflow-hidden bg-paper">
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
        {discount != null && (
          <span className="absolute right-3 top-3 rounded-full bg-[#e8562a] px-3 py-1 text-[13px] font-bold text-white">
            %{discount}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-[16.5px] font-semibold leading-snug text-ink">
          <Link href={productHref(product)} className="hover:text-brand">
            {product.name}
          </Link>
        </h3>

        <div className="mt-auto pt-4">
          {discount != null && product.listPrice != null && (
            <p className="text-[14px] text-slate-soft line-through">{formatTL(product.listPrice)}</p>
          )}
          <p className="font-display text-[20px] font-bold tracking-tight text-ink">{priceText}</p>
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
