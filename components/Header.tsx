"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { site } from "@/lib/site-config";

const nav = [
  { href: "/", label: "Anasayfa" },
  { href: "/hizmetlerimiz", label: "Hizmetlerimiz" },
  { href: "/referanslarimiz", label: "Referanslarımız" },
  { href: "/blog", label: "Blog" },
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/iletisim", label: "İletişim" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-2 sm:px-8 sm:py-2.5">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Image
            src="/logo.svg"
            alt={site.name}
            width={168}
            height={109}
            priority
            className="h-16 w-auto sm:h-24"
          />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[14.5px] font-medium text-slate transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={site.contact.phoneHref}
            className="font-mono-data text-[13.5px] text-slate hover:text-ink"
          >
            {site.contact.phoneDisplay}
          </a>
          <Link
            href="/iletisim"
            className="group inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13.5px] font-semibold text-paper transition-colors hover:bg-sun hover:text-ink"
          >
            Ücretsiz Keşif Talep Et
            <ArrowUpRight
              size={15}
              className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>

        <button
          aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
          className="p-2 text-ink lg:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-paper px-5 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-[15px] font-medium text-ink hover:bg-ink/[0.04]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/iletisim"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-ink px-4 py-2.5 text-center text-[14px] font-semibold text-paper"
            >
              Ücretsiz Keşif Talep Et
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
