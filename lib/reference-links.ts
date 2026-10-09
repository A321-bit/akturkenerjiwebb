import type { Reference } from "./data";

// Referans detay sayfalarının iç linklerini kurar. Eskiden her referans
// sayfası aynı ilk 3 projeyi gösterdiği için çoğu referansa sadece liste
// sayfasından tek bir iç link geliyordu.

function locationTokens(location: string) {
  return location
    .toLocaleLowerCase("tr")
    .split(/[,/]/)
    .map((t) => t.trim())
    .filter((t) => t && t !== "ankara");
}

// Aynı skorlu projeler arasında her sayfa farklı bir sıra görsün diye
// slug çiftinden türetilen sabit (deterministik) bir sıralama anahtarı.
function pairHash(a: string, b: string) {
  let h = 0;
  for (const ch of a + "|" + b) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return h;
}

export function relatedReferences(reference: Reference, all: Reference[], count = 6) {
  const tokens = new Set(locationTokens(reference.location));
  return all
    .filter((r) => r.slug !== reference.slug)
    .map((r) => {
      let score = 0;
      if (r.category === reference.category) score += 2;
      if (locationTokens(r.location).some((t) => tokens.has(t))) score += 1;
      return { r, score, tie: pairHash(reference.slug, r.slug) };
    })
    .sort((a, b) => b.score - a.score || a.tie - b.tie)
    .slice(0, count)
    .map((x) => x.r);
}

const CATEGORY_SERVICE: Record<string, string> = {
  Villa: "villa-cati-ges",
  Müteahhit: "muteahhit-ges",
  Fabrika: "fabrika-cati-ges",
  "Ticari İşyeri": "fabrika-cati-ges",
  Tarım: "tarimsal-sulama",
  "Hobi Bahçesi": "off-grid-sebekeden-bagimsiz",
  Karavan: "off-grid-sebekeden-bagimsiz",
  Telekomünikasyon: "off-grid-sebekeden-bagimsiz",
};

// Referansın anlattığı sistemle ilgili hizmet sayfalarının slug'ları.
export function relatedServiceSlugs(reference: Reference) {
  const text = `${reference.title} ${reference.capacity}`.toLocaleLowerCase("tr");
  const slugs = new Set<string>();
  const byCategory = CATEGORY_SERVICE[reference.category];
  if (byCategory) slugs.add(byCategory);
  if (/off-grid|şebekeden bağımsız/.test(text)) slugs.add("off-grid-sebekeden-bagimsiz");
  if (/hibrit|batarya|depolama/.test(text)) slugs.add("lityum-batarya-depolama");
  if (/şarj/.test(text)) slugs.add("elektrikli-arac-sarj-istasyonu");
  return [...slugs];
}

const ANKARA_DISTRICTS = [
  "Akyurt", "Altındağ", "Ayaş", "Bala", "Beypazarı", "Çamlıdere", "Çankaya", "Çubuk", "Elmadağ",
  "Etimesgut", "Evren", "Gölbaşı", "Güdül", "Haymana", "Kahramankazan", "Kalecik", "Keçiören",
  "Kızılcahamam", "Mamak", "Nallıhan", "Polatlı", "Pursaklar", "Sincan", "Şereflikoçhisar", "Yenimahalle",
];
// Referans konumlarında ilçe yerine semt yazılmış olabilir.
const NEIGHBORHOOD_DISTRICT: Record<string, string> = {
  Beytepe: "Çankaya",
  Ümitköy: "Çankaya",
  Alacaatlı: "Çankaya",
  İncek: "Gölbaşı",
  Tulumtaş: "Gölbaşı",
  Bağlıca: "Etimesgut",
  Kazan: "Kahramankazan",
  Ovacık: "Keçiören",
};
const OTHER_CITIES = ["İstanbul", "Muğla", "Çankırı", "Çanakkale", "İzmir", "Antalya", "Konya", "Eskişehir", "Bolu", "Kırıkkale"];

// Gerçek referans konumlarından, proje yapılmış Ankara ilçelerini ve diğer
// illeri proje sayısıyla çıkarır (iletişim sayfasındaki hizmet bölgeleri için).
export function serviceAreas(references: Reference[]) {
  const districts = new Map<string, number>();
  const cities = new Map<string, number>();
  for (const r of references) {
    const words = r.location.split(/[,/\s]+/).map((w) => w.trim()).filter(Boolean);
    if (words.some((w) => w === "Ankara") || words.some((w) => ANKARA_DISTRICTS.includes(w))) {
      const district =
        words.find((w) => ANKARA_DISTRICTS.includes(w)) ??
        words.map((w) => NEIGHBORHOOD_DISTRICT[w]).find(Boolean);
      if (district) districts.set(district, (districts.get(district) ?? 0) + 1);
    } else {
      const city = words.find((w) => OTHER_CITIES.includes(w));
      if (city) cities.set(city, (cities.get(city) ?? 0) + 1);
    }
  }
  const sorted = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]);
  return { districts: sorted(districts), cities: sorted(cities) };
}
