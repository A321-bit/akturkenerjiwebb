import {
  BatteryCharging,
  BatteryFull,
  Car,
  Droplets,
  Factory,
  Flame,
  House,
  LayoutList,
  Lightbulb,
  Package,
  PlugZap,
  Sprout,
  Sun,
  Thermometer,
  Unplug,
  Wind,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

// Kategori ikonları: admin panelde kategoriye bu listeden ikon seçilir.
export const CATEGORY_ICONS: Record<string, { label: string; icon: LucideIcon }> = {
  sun: { label: "Güneş", icon: Sun },
  unplug: { label: "Şebekesiz (fiş)", icon: Unplug },
  battery: { label: "Batarya (şarj)", icon: BatteryCharging },
  "battery-full": { label: "Batarya (dolu)", icon: BatteryFull },
  house: { label: "Ev", icon: House },
  sprout: { label: "Tarım / Fide", icon: Sprout },
  droplets: { label: "Su", icon: Droplets },
  wind: { label: "Rüzgar", icon: Wind },
  car: { label: "Araç", icon: Car },
  plug: { label: "Şarj", icon: PlugZap },
  thermometer: { label: "Isı", icon: Thermometer },
  flame: { label: "Alev", icon: Flame },
  wrench: { label: "Montaj / Anahtar", icon: Wrench },
  zap: { label: "Elektrik", icon: Zap },
  lightbulb: { label: "Aydınlatma", icon: Lightbulb },
  factory: { label: "Fabrika", icon: Factory },
  package: { label: "Paket", icon: Package },
};

export function categoryIcon(key: string): LucideIcon {
  return CATEGORY_ICONS[key]?.icon ?? LayoutList;
}
