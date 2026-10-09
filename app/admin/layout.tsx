import type { Metadata } from "next";

// Herkese açık site önbellekten sunuluyor (kök layout'ta revalidate). Admin
// paneli ise her zaman canlı veriyi göstermeli: talepler, istatistikler.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
