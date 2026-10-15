"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";

const TABS = [
  { href: "/admin/magaza", label: "Ürünler" },
  { href: "/admin/magaza/kategoriler", label: "Kategoriler" },
  { href: "/admin/magaza/slider", label: "Slider" },
  { href: "/admin/magaza/ayarlar", label: "Mağaza Ayarları" },
  { href: "/admin/yorumlar", label: "Ürün Yorumları" },
];

export default function StoreAdminNav() {
  const pathname = usePathname() ?? "";
  const isActive = (href: string) =>
    href === "/admin/magaza"
      ? pathname === href || pathname.startsWith("/admin/magaza/urunler")
      : pathname.startsWith(href);

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-line pb-3">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`rounded-full px-4 py-2 text-[13.5px] font-semibold transition-colors ${
            isActive(t.href) ? "bg-ink text-paper" : "text-slate hover:bg-ink/5 hover:text-ink"
          }`}
        >
          {t.label}
        </Link>
      ))}
      <a
        href="/magaza"
        target="_blank"
        rel="noopener noreferrer"
        className="ml-auto flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:underline"
      >
        Mağazayı görüntüle <ExternalLink size={14} />
      </a>
    </div>
  );
}
