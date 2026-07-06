"use client";

import { usePathname } from "next/navigation";
import { site, whatsappLink } from "@/lib/site-config";
import { MessageCircle, Phone } from "lucide-react";
import { trackEvent } from "@/lib/track";

export default function FloatingActions() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-7 sm:right-7">
      <a
        href={site.contact.phoneHref}
        aria-label="Hemen ara"
        onClick={() => trackEvent("click", pathname ?? "/", "call_button")}
        className="flex items-center gap-2 rounded-full bg-ink px-5 py-3.5 text-paper shadow-[0_10px_32px_rgba(0,0,0,0.35)] ring-2 ring-sun/40 transition-transform hover:scale-105"
      >
        <Phone size={20} fill="currentColor" className="text-sun" />
        <span className="text-[14px] font-semibold whitespace-nowrap">Hemen Ara</span>
      </a>
      <a
        href={whatsappLink("Merhaba, Aktürk Enerji'den güneş enerjisi sistemleri hakkında bilgi almak istiyorum.")}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp'tan yazın"
        onClick={() => trackEvent("click", pathname ?? "/", "whatsapp_button")}
        className="flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3.5 text-white shadow-[0_10px_32px_rgba(0,0,0,0.35)] ring-2 ring-white/40 transition-transform hover:scale-105"
      >
        <MessageCircle size={20} fill="white" className="text-[#25D366]" />
        <span className="text-[14px] font-semibold whitespace-nowrap">WhatsApp&apos;tan Yazın</span>
      </a>
    </div>
  );
}
