"use client";

import { usePathname } from "next/navigation";

// Ana sayfa önceden render edilirken usePathname() "/" yerine "/index"
// döndürüyor; bu değer WhatsApp mesajlarındaki "Sayfa:" linkine ve takip
// verilerine sızıyordu (akturkenerji.com/index kopya sayfası). Tüm site
// bileşenleri yolu bu kancadan alır.
export function usePagePath(): string {
  const pathname = usePathname() ?? "/";
  return pathname === "/index" ? "/" : pathname;
}
