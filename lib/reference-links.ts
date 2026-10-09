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
