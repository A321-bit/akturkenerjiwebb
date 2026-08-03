import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Vercel hesabının aylık "Görsel Optimizasyonu" kotası dolduğunda
    // /_next/image tüm görseller için 402 (Payment Required) döndürüyordu —
    // optimizasyonu kapatarak görseller doğrudan kaynağından (Supabase/yerel)
    // sunuluyor; bu da bu kotayı tamamen devre dışı bırakıyor.
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tzibyocqotqcowebswlq.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
