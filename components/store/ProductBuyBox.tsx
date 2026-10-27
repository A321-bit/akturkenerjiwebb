"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { whatsappLink } from "@/lib/data";
import { formatTL, type StoreProductOption } from "@/lib/store";
import TrackedContactLink from "@/components/TrackedContactLink";
import { trackMetaProduct } from "@/lib/meta-pixel";

// Ürün sayfasındaki fiyat ve sipariş kutusu. Seçenekli üründe (ör. kablo
// uzunluğu, montaj setinde panel sayısı) seçilen seçeneğin fiyatı gösterilir ve
// WhatsApp sipariş mesajına seçenek ile fiyatı yazılır.
export default function ProductBuyBox({
  productId,
  name,
  url,
  price,
  listPrice,
  options,
  whatsappNumber,
  phoneHref,
  phoneDisplay,
}: {
  productId: number;
  name: string;
  url: string;
  price?: number;
  listPrice?: number;
  options: StoreProductOption[];
  whatsappNumber: string;
  phoneHref: string;
  phoneDisplay: string;
}) {
  const cheapest = options.reduce(
    (best, o, i) => (o.price != null && (best < 0 || o.price < (options[best].price ?? Infinity)) ? i : best),
    -1,
  );
  const [selected, setSelected] = useState(cheapest >= 0 ? cheapest : 0);
  const option = options.length ? options[selected] : undefined;
  const shownPrice = option ? option.price : price;
  const shownList = option ? option.listPrice : listPrice;
  const discount =
    shownPrice && shownList && shownList > shownPrice ? Math.round(((shownList - shownPrice) / shownList) * 100) : null;

  // Meta katalog reklamları: ürüne bakanlar ve WhatsApp'tan sipariş vermeye başlayanlar.
  useEffect(() => {
    trackMetaProduct("ViewContent", { id: productId, name, price });
  }, [productId, name, price]);

  const message = `Merhaba, *${name}*${option ? ` (${option.label})` : ""} için sipariş vermek istiyorum.${
    shownPrice != null ? ` (Fiyat: ${formatTL(shownPrice)})` : ""
  }\n\nÜrün: ${url}`;

  return (
    <div className="mt-5 rounded-2xl border border-line bg-paper-raised p-5">
      {options.length > 0 && (
        <div className="mb-4">
          <p className="text-[13px] font-semibold text-slate">Seçenek</p>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Seçenek">
            {options.map((o, i) => (
              <button
                key={o.label}
                type="button"
                role="radio"
                aria-checked={i === selected}
                onClick={() => setSelected(i)}
                className={`rounded-full border px-4 py-2 text-[14px] font-semibold transition-colors ${
                  i === selected ? "border-ink bg-ink text-paper" : "border-line text-ink hover:border-ink"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {discount != null && shownList != null && (
        <div className="flex items-center gap-2">
          <span className="text-[15px] text-slate-soft line-through">{formatTL(shownList)}</span>
          <span className="rounded-full bg-[#e8562a] px-2.5 py-0.5 text-[12.5px] font-bold text-white">%{discount} indirim</span>
        </div>
      )}
      <p className="mt-1 font-display text-[2rem] font-bold leading-tight tracking-tight text-ink">
        {shownPrice != null ? formatTL(shownPrice) : "Fiyat için sorun"}
      </p>
      <p className="text-[13px] font-medium text-slate">KDV Dahil</p>

      <TrackedContactLink
        method="whatsapp"
        label="store_whatsapp_product"
        onClick={() => trackMetaProduct("AddToCart", { id: productId, name, price: shownPrice })}
        href={whatsappLink(whatsappNumber, message)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 text-[16px] font-bold text-white transition-transform hover:scale-[1.02]"
      >
        <MessageCircle size={19} fill="currentColor" />
        WhatsApp&apos;tan Sipariş Ver
      </TrackedContactLink>
      <TrackedContactLink
        method="call"
        label="store_call_product"
        href={phoneHref}
        className="mt-2.5 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full border border-line px-5 text-[15px] font-semibold text-ink hover:border-ink"
      >
        <Phone size={17} /> Bizi Arayın: {phoneDisplay}
      </TrackedContactLink>
    </div>
  );
}
