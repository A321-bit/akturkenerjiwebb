import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { SiteSettings } from "@/lib/data";
import type { StoreCategory } from "@/lib/store";

export default function StoreFooter({
  settings,
  categories,
  text,
}: {
  settings: SiteSettings;
  categories: StoreCategory[];
  text: string;
}) {
  const col = "flex flex-col gap-2 text-[14px] text-slate-soft";
  return (
    <footer className="mt-16 bg-ink text-paper">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg font-semibold">Aktürk Enerji Mağaza</p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-slate-soft">
            {text}
          </p>
        </div>
        <div className="sm:col-span-2">
          <p className="font-mono-data text-[12px] uppercase tracking-[0.14em] text-sun-soft">Paketler</p>
          <div className={`mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2 ${col}`}>
            {categories.map((c) => (
              <Link key={c.slug} href={`/magaza/${c.slug}`} className="hover:text-paper">
                {c.name}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="font-mono-data text-[12px] uppercase tracking-[0.14em] text-sun-soft">İletişim</p>
          <div className={`mt-3 ${col}`}>
            <a href={settings.contact.phoneHref} className="hover:text-paper">
              {settings.contact.phoneDisplay}
            </a>
            <a href={`mailto:${settings.contact.email}`} className="hover:text-paper">
              {settings.contact.email}
            </a>
            <span>{settings.contact.addressLine}</span>
            <Link href="/magaza/iletisim" className="hover:text-paper">
              İletişim sayfası
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-line-dark">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-[12.5px] text-slate-soft sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            © {new Date().getFullYear()} {settings.name}. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/magaza/teslimat-ve-iade" className="hover:text-paper">
              Teslimat ve İade
            </Link>
            <Link href="/kvkk-aydinlatma-metni" target="_blank" className="hover:text-paper">
              KVKK Aydınlatma Metni
            </Link>
            <Link href="/" className="flex items-center gap-1 text-sun-soft hover:text-sun">
              Kurumsal Site <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
