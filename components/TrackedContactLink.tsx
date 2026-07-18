"use client";

import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/track";
import { trackGa4WhatsappClick, trackGa4CallClick } from "@/lib/ga4";

export default function TrackedContactLink({
  method,
  children,
  ...anchorProps
}: {
  method: "whatsapp" | "call";
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const pathname = usePathname();
  return (
    <a
      {...anchorProps}
      onClick={() => {
        trackEvent("click", pathname ?? "/", method === "whatsapp" ? "whatsapp_button" : "call_button");
        if (method === "whatsapp") trackGa4WhatsappClick();
        else trackGa4CallClick();
      }}
    >
      {children}
    </a>
  );
}
