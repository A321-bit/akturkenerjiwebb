"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, MessageCircle, Phone, X } from "lucide-react";
import { whatsappLink, SITE_URL } from "@/lib/data";
import { trackEvent } from "@/lib/track";
import { trackGa4WhatsappClick } from "@/lib/ga4";
import StoreSearch from "./StoreSearch";

// Mağaza kendi başına bir e-ticaret sitesi gibi çalışır: buradaki linkler
// müşteriyi mağazanın içinde tutar. Kurumsal siteye tek geçiş, üst şeritteki
// "Kurumsal Site" linkidir.
const NAV = [
  { href: "/magaza", label: "Mağaza Anasayfa" },
  { href: "/magaza/hakkimizda", label: "Hakkımızda" },
  { href: "/magaza/referanslar", label: "Referanslarımız" },
  { href: "/magaza/iletisim", label: "İletişim" },
];

export default function StoreHeader({
  whatsappNumber,
  phoneHref,
  phoneDisplay,
}: {
  whatsappNumber: string;
  phoneHref: string;
  phoneDisplay: string;
}) {
  const pathname = usePathname() ?? "/magaza";
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/magaza" ? pathname === "/magaza" : pathname.startsWith(href));
  const waHref = whatsappLink(
    whatsappNumber,
    `Merhaba, Aktürk Enerji Mağaza'daki ürünler hakkında bilgi almak istiyorum.\n\nSayfa: ${SITE_URL}${pathname}`
  );

  return (
    <header className="sticky top-0 z-50">
      {/* Üst şerit: telefon ve kurumsal siteye tek geçiş */}
      <div className="bg-ink text-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-1.5 text-[12.5px] sm:px-8">
          <a href={phoneHref} className="flex items-center gap-1.5 text-paper/80 hover:text-paper">
            <Phone size={13} /> {phoneDisplay}
          </a>
          <div className="flex items-center gap-5">
            <nav className="hidden items-center gap-5 lg:flex">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap font-medium transition-colors ${
                    isActive(item.href) ? "text-paper" : "text-paper/70 hover:text-paper"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <Link href="/" className="flex items-center gap-1 font-medium text-sun-soft hover:text-sun">
              Aktürk Enerji Kurumsal Site <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Ana menü */}
      <div className="border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-5 py-2.5 sm:px-8">
          <Link href="/magaza" className="flex shrink-0 items-center gap-2.5" onClick={() => setOpen(false)}>
            <Image src="/logo.svg" alt="Aktürk Enerji" width={281} height={50} priority className="h-9 w-auto sm:h-10" />
            <span className="rounded-md bg-sun px-2 py-1 font-mono-data text-[11px] font-bold uppercase tracking-[0.12em] text-ink">
              Mağaza
            </span>
          </Link>

          <StoreSearch className="hidden max-w-xl flex-1 lg:block" />

          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackEvent("click", pathname, "store_header_whatsapp");
              trackGa4WhatsappClick();
            }}
            className="hidden items-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-[13.5px] font-bold text-white transition-transform hover:scale-[1.03] lg:flex"
          >
            <MessageCircle size={16} fill="currentColor" />
            WhatsApp Sipariş Hattı
          </a>

          <button
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            className="p-2 text-ink lg:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <div className="px-5 pb-3 lg:hidden">
          <StoreSearch />
        </div>

        {open && (
          <div className="border-t border-line bg-paper px-5 py-4 lg:hidden">
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-2.5 text-[15px] font-medium text-ink hover:bg-ink/[0.04]"
                >
                  {item.label}
                </Link>
              ))}
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-[14.5px] font-bold text-white"
              >
                <MessageCircle size={17} fill="currentColor" />
                WhatsApp Sipariş Hattı
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
