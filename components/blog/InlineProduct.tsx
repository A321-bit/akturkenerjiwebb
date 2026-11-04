"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { whatsappLink, SITE_URL } from "@/lib/data";
import { discountPercent, formatTL, priceLabel, type StoreProduct } from "@/lib/store";
import { productHref } from "@/lib/store-details";
import { trackEvent } from "@/lib/track";
import { trackGa4WhatsappClick } from "@/lib/ga4";

// Blog yazısının arasına giren ürün kartı: okurken konuyla ilgili paketi reklam gibi gösterir.
export default function InlineProduct({ product, whatsappNumber }: { product: StoreProduct; whatsappNumber: string }) {
  const href = productHref(product);
  const discount = discountPercent(product);
  const hasOptions = product.options.length > 1;
  const message = `Merhaba, blog yazınızda gördüğüm *${product.name}* hakkında bilgi almak istiyorum.\n\nÜrün: ${SITE_URL}${href}`;

  return (
    <aside className="not-prose my-10 overflow-hidden rounded-2xl border border-sun/50 bg-paper-raised shadow-[0_18px_40px_-28px_rgba(11,20,32,0.5)]">
      <div className="flex items-center justify-between border-b border-line bg-sun/10 px-4 py-2">
        <span className="font-mono-data text-[11px] font-semibold uppercase tracking-[0.12em] text-ink">Bu yazıyla ilgili paket</span>
        <Link href={`/magaza/${product.category}`} className="text-[12px] font-medium text-slate hover:text-ink">
          Tümünü gör
        </Link>
      </div>
      <div className="flex flex-col sm:flex-row">
        <Link
          href={href}
          onClick={() => trackEvent("click", href, "blog_product_inline")}
          className="relative block aspect-[16/9] shrink-0 bg-paper sm:aspect-auto sm:w-[38%]"
        >
          {product.image && (
            <Image src={product.image} alt={product.name} fill sizes="(min-width: 640px) 320px, 100vw" className="object-cover" />
          )}
          {discount != null && (
            <span className="absolute right-3 top-3 rounded-full bg-[#e8562a] px-3 py-1 text-[13px] font-bold text-white">%{discount}</span>
          )}
        </Link>
        <div className="flex flex-1 flex-col p-5">
          {product.power && <span className="font-mono-data text-[12px] font-semibold text-brand">{product.power}</span>}
          <Link
            href={href}
            onClick={() => trackEvent("click", href, "blog_product_inline")}
            className="mt-1 font-display text-[18px] font-semibold leading-snug text-ink hover:text-brand"
          >
            {product.name}
          </Link>
          {product.contents.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-[13px] text-slate">
              {product.contents.slice(0, 2).map((c) => (
                <li key={c} className="line-clamp-1">· {c}</li>
              ))}
            </ul>
          )}
          <div className="mt-auto pt-4">
            {discount != null && product.listPrice != null && !hasOptions && (
              <p className="text-[13px] text-slate-soft line-through">{formatTL(product.listPrice)}</p>
            )}
            <p className="font-display text-[20px] font-bold tracking-tight text-ink">{priceLabel(product)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={href}
                onClick={() => trackEvent("click", href, "blog_product_inline")}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full bg-ink px-4 text-[13.5px] font-semibold text-paper hover:bg-brand"
              >
                Paketi incele <ArrowRight size={15} />
              </Link>
              <a
                href={whatsappLink(whatsappNumber, message)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackEvent("click", href, "store_whatsapp_blog");
                  trackGa4WhatsappClick();
                }}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full bg-[#25D366] px-4 text-[13.5px] font-bold text-white"
              >
                <MessageCircle size={15} fill="currentColor" /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
