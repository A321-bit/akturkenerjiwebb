"use client";

import { useState } from "react";
import { MapPin, Play } from "lucide-react";

// YouTube ve Google Haritalar açılır açılmaz kendi çerezlerini yazabilir; bu yüzden ziyaretçi tıklayınca yüklenir.
export default function ExternalEmbed({
  src,
  title,
  service,
  className = "",
  allow,
  allowFullScreen,
  referrerPolicy,
}: {
  src: string;
  title: string;
  service: "YouTube" | "Google Haritalar";
  className?: string;
  allow?: string;
  allowFullScreen?: boolean;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
}) {
  const [loaded, setLoaded] = useState(false);
  const video = service === "YouTube";

  if (loaded) {
    const url = video ? `${src}${src.includes("?") ? "&" : "?"}autoplay=1` : src;
    return <iframe src={url} title={title} className={className} allow={allow} allowFullScreen={allowFullScreen} referrerPolicy={referrerPolicy} />;
  }
  return (
    <button type="button" onClick={() => setLoaded(true)} className={`flex flex-col items-center justify-center gap-2 bg-ink-soft px-4 text-center text-paper ${className}`}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sun text-ink">{video ? <Play size={20} fill="currentColor" /> : <MapPin size={20} />}</span>
      <span className="text-[14px] font-semibold">{video ? "Videoyu oynat" : "Haritayı göster"}</span>
      <span className="text-[11.5px] text-paper/70">{service} açılır ve kendi çerezlerini kullanabilir.</span>
    </button>
  );
}
