"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Wrench, MapPin, Newspaper, Settings, LogOut, Video, Inbox, Users, Target } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Genel Bakış", icon: LayoutDashboard },
  { href: "/admin/talepler", label: "Talepler", icon: Inbox },
  { href: "/admin/potansiyel-musteriler", label: "Potansiyel Müşteriler", icon: Target },
  { href: "/admin/is-basvurulari", label: "İş Başvuruları", icon: Users },
  { href: "/admin/hizmetler", label: "Hizmetler", icon: Wrench },
  { href: "/admin/referanslar", label: "Referanslar", icon: MapPin },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/videolar", label: "Videolar", icon: Video },
  { href: "/admin/ayarlar", label: "Site Ayarları", icon: Settings },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-paper-raised px-4 py-6">
        <p className="px-2 font-mono-data text-[11px] uppercase tracking-[0.16em] text-brand">
          Aktürk Enerji
        </p>
        <p className="px-2 mt-0.5 font-display text-[15px] font-semibold">Yönetim Paneli</p>

        <nav className="mt-8 flex flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
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
          className="mt-auto flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[14px] font-medium text-slate hover:bg-ink/5"
        >
          <LogOut size={17} />
          Çıkış Yap
        </button>
      </aside>

      <main className="min-w-0 flex-1 px-6 py-8 sm:px-10">{children}</main>
    </div>
  );
}
