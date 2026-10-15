"use client";

import { usePathname } from "next/navigation";

// Mağaza ana sayfasında kategori menüsü yalnızca slider'ın yanında durur
// (sayfa kendisi yerleştirir), alttaki raflar tam genişlikte akar. Diğer
// mağaza sayfalarında menü solda bir sütun olarak gösterilir.
export default function StoreShell({ sidebar, children }: { sidebar: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname();
  const home = pathname === "/magaza";

  return (
    <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 sm:py-8">
      {home ? (
        children
      ) : (
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:items-start lg:gap-8">
          <div className="mb-6 lg:mb-0">{sidebar}</div>
          <div className="min-w-0">{children}</div>
        </div>
      )}
    </div>
  );
}
