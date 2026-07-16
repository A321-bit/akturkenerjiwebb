"use client";

import { usePathname } from "next/navigation";
import { MessageCircle, ArrowUpRight } from "lucide-react";
import { whatsappLink } from "@/lib/data";
import { trackEvent } from "@/lib/track";

export default function WhatsappCtaBanner({
  title,
  subtitle,
  whatsappNumber,
  message,
  buttonLabel = "WhatsApp'tan Yazın",
  className = "",
}: {
  title: string;
  subtitle?: string;
  whatsappNumber: string;
  message: string;
  buttonLabel?: string;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <div
      className={`flex flex-col items-center gap-4 rounded-2xl border border-volt/30 bg-volt/10 p-6 text-center sm:flex-row sm:justify-between sm:p-7 sm:text-left ${className}`}
    >
      <div>
        <p className="font-display text-[17px] font-semibold text-ink sm:text-[19px]">{title}</p>
        {subtitle && <p className="mt-1.5 text-[13.5px] text-slate">{subtitle}</p>}
      </div>
      <a
        href={whatsappLink(whatsappNumber, message)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent("click", pathname ?? "/", "whatsapp_cta_banner")}
        className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_10px_30px_-8px_rgba(37,211,102,0.55)] transition-transform hover:scale-[1.03]"
      >
        <MessageCircle size={18} />
        {buttonLabel}
        <ArrowUpRight
          size={16}
          className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </a>
    </div>
  );
}
