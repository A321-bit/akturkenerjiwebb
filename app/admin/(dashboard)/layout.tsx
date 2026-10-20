"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Wrench, MapPin, Newspaper, Settings, LogOut, Video, Inbox, Users, Target, Star, Store, TrendingUp, Share2, ShieldCheck, Menu, X, BarChart3 } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Genel Bakış", icon: LayoutDashboard },
  { href: "/admin/talepler", label: "Talepler", icon: Inbox },
  { href: "/admin/potansiyel-musteriler", label: "Potansiyel Müşteriler", icon: Target },
  { href: "/admin/is-basvurulari", label: "İş Başvuruları", icon: Users },
  { href: "/admin/hizmetler", label: "Hizmetler", icon: Wrench },
  { href: "/admin/referanslar", label: "Referanslar", icon: MapPin },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/magaza", label: "Mağaza", icon: Store },
  { href: "/admin/analytics", label: "Google Analytics", icon: BarChart3 },
  { href: "/admin/seo", label: "SEO · Anahtar Kelimeler", icon: TrendingUp },
  { href: "/admin/sosyal-medya", label: "Sosyal Medya", icon: Share2 },
  { href: "/admin/yorumlar", label: "Ürün Yorumları", icon: Star },
  { href: "/admin/videolar", label: "Videolar", icon: Video },
  { href: "/admin/ayarlar", label: "Site Ayarları", icon: Settings },
  { href: "/admin/guvenlik", label: "Güvenlik", icon: ShieldCheck },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // Telefonda menü üst çubuktaki butonla açılan çekmece; bir sayfaya geçilince kapanır.
  const [open, setOpen] = useState(false);
  const current = navItems.find((i) => pathname === i.href || (i.href !== "/admin" && pathname?.startsWith(i.href)));

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      {/* Telefon üst çubuğu */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-line bg-paper-raised px-4 lg:hidden">
        <button type="button" aria-label="Menüyü aç" onClick={() => setOpen(true)} className="-ml-1 flex h-10 w-10 items-center justify-center rounded-lg hover:bg-ink/5">
          <Menu size={22} />
        </button>
        <p className="truncate font-display text-[15px] font-semibold">{current?.label ?? "Yönetim Paneli"}</p>
      </header>
      {open && <div className="fixed inset-0 z-40 bg-ink/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col overflow-y-auto border-r border-line bg-paper-raised px-4 py-6 transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-60 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button type="button" aria-label="Menüyü kapat" onClick={() => setOpen(false)} className="absolute right-3 top-4 flex h-9 w-9 items-center justify-center rounded-lg hover:bg-ink/5 lg:hidden">
          <X size={20} />
        </button>
        <p className="px-2 font-mono-data text-[11px] uppercase tracking-[0.16em] text-brand">
          Aktürk Enerji
        </p>
        <p className="px-2 mt-0.5 font-display text-[15px] font-semibold">Yönetim Paneli</p>

        <nav className="mt-6 flex flex-col gap-1 lg:mt-8">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors ${
                  active ? "bg-ink text-paper" : "text-slate hover:bg-ink/5"
                }`}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-6 flex items-center gap-2.5 lg:mt-auto rounded-lg px-3 py-2.5 text-[14px] font-medium text-slate hover:bg-ink/5"
        >
          <LogOut size={17} />
          Çıkış Yap
        </button>
      </aside>

      <main className="min-w-0 flex-1 px-4 pb-10 pt-20 sm:px-6 lg:px-10 lg:py-8">{children}</main>
    </div>
  );
}
