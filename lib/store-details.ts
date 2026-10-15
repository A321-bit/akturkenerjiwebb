// Ürün detay sayfası için türetilen bilgiler (galeri, paket içeriği, teknik
// tablo). Şablon aşamasında ürün tipine ve gücüne göre üretiliyor; gerçek
// ürünler admin panele taşındığında her ürünün kendi içeriği girilecek.
import { STORE_CATEGORIES, type StoreProduct } from "./store";

const IMG = "https://tzibyocqotqcowebswlq.supabase.co/storage/v1/object/public/media/blog/mustakil-ev-icin-gunes-paneli-sistemleri/";

export function productHref(p: StoreProduct): string {
  return `/magaza/${p.category}/${p.slug}`;
}

export function kwOf(p: StoreProduct): number {
  return parseFloat(p.power.replace(",", "."));
}

const fmt = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 1 });

// Kategoriye göre galeriye eklenen gerçek proje fotoğrafları.
const EXTRA_IMAGES: Record<string, string[]> = {
  "on-grid-paketler": ["on-grid-inverter-ve-ges-panosu-opt.webp", "kiremit-catiya-gunes-paneli-montaji-opt.webp"],
  "off-grid-paketler": ["off-grid-inverter-ve-lityum-batarya-opt.webp", "cankiri-hobi-bahcesi-off-grid-gunes-paneli-opt.webp"],
  "hibrit-paketler": ["ankara-cayyolu-hibrit-inverter-lityum-batarya-opt.webp", "kecioren-sirkeli-oztuketim-hibrit-inverter-opt.webp"],
  "oztuketim-paketleri": ["kecioren-sirkeli-oztuketim-hibrit-inverter-opt.webp", "kiremit-catiya-gunes-paneli-montaji-opt.webp"],
};

export function productGallery(p: StoreProduct): string[] {
  const main = p.image?.replace(/-opt-800\.webp$/, "-opt.webp");
  const extras = (EXTRA_IMAGES[p.category] ?? []).map((f) => IMG + f);
  return Array.from(new Set([main, ...extras].filter((x): x is string => Boolean(x))));
}

// Off grid paketlerde panel ve batarya, sahada kurduğumuz örneklerden.
const OFFGRID: Record<string, { panels: string; battery: string }> = {
  "3 kW": { panels: "4 × 600 W", battery: "5 kWh" },
  "6,2 kW": { panels: "8 × 600 W", battery: "5 kWh" },
  "10,2 kW": { panels: "12 × 555 W", battery: "16 kWh" },
};

function batteryOf(p: StoreProduct): string | undefined {
  const m = p.name.match(/(\d+(?:,\d+)?) kWh/);
  return m ? `${m[1]} kWh` : undefined;
}

export function productContents(p: StoreProduct): string[] {
  const kw = kwOf(p);
  const panelCount = Math.ceil((kw * 1000) / 600);
  const phase = kw >= 10 ? "trifaze" : "monofaze veya trifaze (sayacınıza göre)";
  switch (p.category) {
    case "off-grid-paketler": {
      const o = OFFGRID[p.power];
      return [
        `${o?.panels ?? "Tüketime göre"} A kalite monokristal güneş paneli`,
        `${p.power} off grid invertör (dahili MPPT şarj kontrol cihazı)`,
        `${o?.battery ?? "Tüketime göre"} LiFePO4 lityum batarya`,
        "Panel montaj konstrüksiyonu",
        "Solar DC kablo, MC4 konnektörler ve sigortalar",
      ];
    }
    case "hibrit-paketler":
      return [
        `Yaklaşık ${panelCount} × 600 W A kalite monokristal güneş paneli`,
        `${p.power} hibrit invertör (${phase})`,
        `${batteryOf(p) ?? ""} LiFePO4 lityum batarya`.trim(),
        "Akıllı sayaç / akım trafosu ve yedek yük panosu",
        "Alüminyum konstrüksiyon ve çatı bağlantı ekipmanları",
        "Solar DC kablo, MC4 konnektörler, DC/AC koruma panoları ve topraklama",
        "Elektrik projesi, EDAŞ başvurusu, montaj ve devreye alma",
      ];
    case "oztuketim-paketleri":
      return [
        `Yaklaşık ${panelCount} × 600 W A kalite monokristal güneş paneli`,
        `${p.power} sıfır şebeke beslemeli (zero export) invertör`,
        "Akıllı sayaç / akım trafosu",
        "Alüminyum konstrüksiyon ve çatı bağlantı ekipmanları",
        "Solar DC kablo, MC4 konnektörler, DC/AC koruma panoları ve topraklama",
        "Montaj ve devreye alma",
      ];
    default:
      return [
        `Yaklaşık ${panelCount} × 600 W A kalite monokristal güneş paneli`,
        `${p.power} on grid invertör (${phase})`,
        "Alüminyum konstrüksiyon ve çatı bağlantı ekipmanları",
        "Solar DC kablo ve MC4 konnektörler",
        "DC/AC koruma panoları ve topraklama",
        "Elektrik projesi, EDAŞ başvurusu, montaj ve devreye alma",
      ];
  }
}

export function productSpecs(p: StoreProduct): [string, string][] {
  const kw = kwOf(p);
  const category = STORE_CATEGORIES.find((c) => c.slug === p.category);
  const rows: [string, string][] = [
    ["Sistem gücü", p.power],
    ["Sistem tipi", category?.name.replace(/ Paketler(i)?$/, "") ?? "-"],
  ];
  if (p.category === "off-grid-paketler") {
    const o = OFFGRID[p.power];
    if (o) {
      rows.push(["Güneş paneli", o.panels], ["Lityum batarya", o.battery]);
    }
    rows.push(["Şebeke bağlantısı", "Yok (şebekeden bağımsız)"]);
  } else {
    rows.push(["Güneş paneli", `Yaklaşık ${Math.ceil((kw * 1000) / 600)} × 600 W`]);
    const b = batteryOf(p);
    if (b) rows.push(["Lityum batarya", b]);
    rows.push(["Tahmini yıllık üretim (Ankara)", `${fmt(kw * 1400)} – ${fmt(kw * 1550)} kWh`]);
    rows.push(["Şebeke bağlantısı", p.category === "oztuketim-paketleri" ? "Var (şebekeye enerji vermez)" : "Var"]);
  }
  rows.push(["Kurulum", p.installIncluded ? "Dahil (anahtar teslim)" : "Dahil değil"]);
  rows.push(["Montaj süresi", "1–3 gün"]);
  return rows;
}
