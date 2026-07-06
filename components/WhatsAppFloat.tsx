"use client";

import { whatsappLink } from "@/lib/site-config";
import { MessageCircle } from "lucide-react";

export default function WhatsAppFloat() {
  return (
    <a
      href={whatsappLink("Merhaba, Aktürk Enerji'den güneş enerjisi sistemleri hakkında bilgi almak istiyorum.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp'tan yazın"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3.5 text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-transform hover:scale-105 sm:bottom-7 sm:right-7"
    >
      <MessageCircle size={20} fill="white" className="text-[#25D366]" />
      <span className="hidden text-[14px] font-semibold sm:inline">WhatsApp&apos;tan Yazın</span>
    </a>
  );
}
