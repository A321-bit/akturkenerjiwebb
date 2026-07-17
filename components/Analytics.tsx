"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/track";
import { captureAttribution } from "@/lib/attribution";

export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    trackEvent("pageview", pathname);
  }, [pathname]);

  useEffect(() => {
    captureAttribution();
  }, []);

  return null;
}
