"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SITE_DOMAIN, type SiteSettings, type Service } from "@/lib/data";
import { Mail, MapPin, Phone } from "lucide-react";

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export default function Footer({
  settings,
  services,
}: {
  settings: SiteSettings;
  services: Service[];
}) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="border-t border-line-dark bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Image src="/logo-light.svg" alt={settings.name} width={281} height={50} className="h-11 w-auto sm:h-12" />
            <p className="mt-2 font-mono-data text-[11px] uppercase tracking-[0.16em] text-slate-soft">
              {settings.foundedYear}&apos;dan beri {settings.city}&apos;da
            </p>
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-slate-soft">
              {settings.city} merkezli, villa, hobi bahçesi, tarım ve müteahhit
              projelerine anahtar teslim güneş enerjisi sistemleri.
            </p>
            <div className="mt-5 flex gap-3">
              {settings.social.instagram && (
                <a
                  href={settings.social.instagram}
                  aria-label="Instagram"
                  className="rounded-full border border-line-dark p-2 text-slate-soft hover:text-brand"
                >
                  <InstagramIcon />
                </a>
              )}
              {settings.social.linkedin && (
                <a
                  href={settings.social.linkedin}
                  aria-label="LinkedIn"
                  className="rounded-full border border-line-dark p-2 text-slate-soft hover:text-brand"
                >
                  <LinkedinIcon />
                </a>
              )}
            </div>
          </div>

          <div>
            <p className="font-mono-data text-[11px] uppercase tracking-[0.16em] text-slate-soft">
              Hizmetler
            </p>
            <ul className="mt-4 space-y-2.5">
              {services.slice(0, 6).map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/hizmetlerimiz/${s.slug}`}
                    className="text-[14px] text-slate-soft hover:text-paper"
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono-data text-[11px] uppercase tracking-[0.16em] text-slate-soft">
              Kurumsal
            </p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/hakkimizda" className="text-[14px] text-slate-soft hover:text-paper">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link href="/referanslarimiz" className="text-[14px] text-slate-soft hover:text-paper">
                  Referanslarımız
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-[14px] text-slate-soft hover:text-paper">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/hizmetlerimiz/distributorluk-bayilik" className="text-[14px] text-slate-soft hover:text-paper">
                  Bayilik
                </Link>
              </li>
              <li>
                <Link href="/iletisim" className="text-[14px] text-slate-soft hover:text-paper">
                  İletişim
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-mono-data text-[11px] uppercase tracking-[0.16em] text-slate-soft">
              İletişim
            </p>
            <ul className="mt-4 space-y-3 text-[14px] text-slate-soft">
              <li className="flex items-start gap-2">
                <Phone size={15} className="mt-0.5 shrink-0 text-brand" />
                <a href={settings.contact.phoneHref}>{settings.contact.phoneDisplay}</a>
              </li>
              <li className="flex items-start gap-2">
                <Mail size={15} className="mt-0.5 shrink-0 text-brand" />
                <a href={`mailto:${settings.contact.email}`}>{settings.contact.email}</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0 text-brand" />
                <span>{settings.contact.addressLine}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line-dark pt-6 text-[12.5px] text-slate-soft sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {settings.name}. Tüm hakları saklıdır.
          </p>
          <p className="font-mono-data">{SITE_DOMAIN}</p>
        </div>
      </div>
    </footer>
  );
}
