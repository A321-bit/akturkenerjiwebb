"use client";

import { usePagePath } from "@/lib/use-page-path";
import { trackEvent } from "@/lib/track";
import { trackGa4WhatsappClick, trackGa4CallClick } from "@/lib/ga4";

export default function TrackedContactLink({
  method,
  label,
  children,
  onClick,
  ...anchorProps
}: {
  method: "whatsapp" | "call";
  /** Admin istatistiklerinde ayrı sayılması için özel etiket (ör. mağaza ürün sayfası). */
  label?: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const pathname = usePagePath();
  return (
    <a
      {...anchorProps}
      onClick={(e) => {
        onClick?.(e);
        trackEvent("click", pathname, label ?? (method === "whatsapp" ? "whatsapp_button" : "call_button"));
        if (method === "whatsapp") trackGa4WhatsappClick();
        else trackGa4CallClick();
      }}
    >
      {children}
    </a>
  );
}
