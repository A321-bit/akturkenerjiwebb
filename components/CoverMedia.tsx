import Image from "next/image";
import {
  Home,
  Users,
  Wheat,
  Wind,
  BatteryCharging,
  Trees,
  Caravan,
  Package,
  Radio,
  FileText,
  Sun,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Konut: Home,
  Villa: Home,
  "İş Ortaklığı": Users,
  Müteahhit: Users,
  Tarım: Wheat,
  Hibrit: Wind,
  Depolama: BatteryCharging,
  "Hobi Bahçesi": Trees,
  Mobil: Caravan,
  Karavan: Caravan,
  Tedarik: Package,
  Mühendislik: FileText,
  Telekomünikasyon: Radio,
};

export default function CoverMedia({
  src,
  alt,
  label,
  className = "",
  aspect = "aspect-[16/10]",
  iconSize = 56,
}: {
  src?: string;
  alt: string;
  label: string;
  className?: string;
  aspect?: string;
  iconSize?: number;
}) {
  const Icon = ICONS[label] ?? Sun;

  if (src) {
    return (
      <div className={`relative overflow-hidden rounded-2xl ${aspect} ${className}`}>
        <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-ink via-ink-soft to-brand-deep ${aspect} ${className}`}
    >
      <div className="grid-texture absolute inset-0 opacity-40" />
      <Icon size={iconSize} strokeWidth={1.25} className="relative text-paper/60" />
    </div>
  );
}
