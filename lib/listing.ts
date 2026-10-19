import type { SiteSettings } from "./data";
import { formatTL, type StoreCategory, type StoreProduct } from "./store";
import { kwOf } from "./store-details";

// Sahibinden.com ilan metni: ürün verisinden (paket içeriği, güç, kategori)
// başlık + açıklama üretir. Sahibinden kurallarına uygun olsun diye açıklamada
// web adresi, e-posta ve telefon numarası yer almaz (iletişim ilan üzerinden).

export type Listing = { title: string; description: string; price: string };

const TITLE_MAX = 60;
const num = (s: string) => parseFloat(s.replace(/\./g, "").replace(",", "."));
const tr1 = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 1 });

/** Paket içeriğinden toplam panel gücü (kWp): "(toplam 9,92 kWp)" ya da "17 × 600 W". */
function panelKwp(p: StoreProduct): number | null {
  for (const c of p.contents) {
    const t = c.match(/toplam\s+([\d.,]+)\s*kWp/i);
    if (t) return num(t[1]);
    const m = c.match(/(\d+)\s*(?:adet|×|x)\s*(\d{3})\s*W/i);
    if (m) return (Number(m[1]) * Number(m[2])) / 1000;
  }
  return null;
}

function production(kwp: number | null): string | null {
  if (!kwp) return null;
  const lo = Math.round((kwp * 1400) / 100) * 100;
  const hi = Math.round((kwp * 1550) / 100) * 100;
  return `Ankara koşullarında yılda yaklaşık ${lo.toLocaleString("tr-TR")} – ${hi.toLocaleString("tr-TR")} kWh elektrik üretir (aylık ortalama ${Math.round(lo / 12).toLocaleString("tr-TR")} – ${Math.round(hi / 12).toLocaleString("tr-TR")} kWh).`;
}

/** Kategoriye ve güce göre "neleri çalıştırır" maddeleri. */
function whatItRuns(p: StoreProduct, cat: string, kw: number, kwp: number | null): string[] {
  const prod = production(kwp);
  const trifaze = /trifaze/i.test(p.name);
  if (cat === "off-grid-paketler") {
    const base = ["LED aydınlatma, televizyon, uydu alıcısı, modem ve telefon şarjı"];
    if (kw >= 3) base.push("Buzdolabı, çamaşır makinesi ve küçük ev aletleri", "Ev tipi hidrofor ve küçük su pompası", "Güneşli saatlerde inverterli klima");
    if (kw >= 6) base.push("Gündüz elektrikli el aletleri ve kompresör", "Aynı anda birden fazla büyük cihaz");
    if (kw >= 10) base.push("Yıl boyu oturulan, tam donanımlı bir evin günlük ihtiyacı");
    if (trifaze) base.push("380 V trifaze dalgıç pompa, yem kırma makinesi, süt soğutma tankı ve atölye makineleri");
    base.push(`Aynı anda toplam ${tr1(kw)} kW'a kadar yük (inverter gücü)`);
    if (prod) base.push(prod);
    return base;
  }
  if (cat === "hibrit-paketler") {
    return [
      "Gündüz evinizi ya da işyerinizi güneşten besler, fazlasını lityum bataryada saklar",
      "Akşam saatlerinde ve elektrik kesintisinde bataryadan çalışmaya devam eder",
      "Kesintide buzdolabı, aydınlatma, internet, kombi/ısıtma pompası gibi seçilen hatları besler",
      trifaze ? "Trifaze (380 V) sayaçlı ev, işyeri, çiftlik ve küçük işletmeler için uygundur" : "Monofaze sayaçlı müstakil evler için uygundur",
      ...(prod ? [prod] : []),
    ];
  }
  if (cat === "on-grid-paketler" || cat === "oztuketim-paketleri") {
    return [
      "Şebekeye bağlı çalışır; ürettiğiniz elektriği önce kendiniz kullanırsınız, faturanız düşer",
      "Klima, ısı pompası, elektrikli araç şarjı gibi yüksek tüketimli cihazların gündüz enerjisini karşılar",
      ...(prod ? [prod] : []),
    ];
  }
  if (cat === "tarimsal-sulama-paketleri") {
    const hp = p.name.match(/([\d,]+)\s*HP/i)?.[1];
    return [
      `${hp ? `${hp} HP'ye kadar` : "Paket gücüne uygun"} dalgıç ya da yüzey pompasını akü olmadan, doğrudan güneşle çalıştırır`,
      "Şebeke hattı olmayan tarla, bahçe ve seralarda mazot ve elektrik faturası olmadan sulama",
      "Güneş güçlendikçe pompa devri artar; sabahtan akşama kadar sulama yapılır",
      ...(prod ? [prod.replace("elektrik üretir", "enerji üretir")] : []),
    ];
  }
  return prod ? [prod] : [];
}

export function buildListing(p: StoreProduct, category: StoreCategory, site: SiteSettings): Listing {
  const kw = kwOf(p) || 0;
  const kwp = panelKwp(p);
  const contents = p.contents.filter((c) => !/kurulum pakete dahil değil/i.test(c));

  let title = p.name;
  if (title.length + " | Aktürk Enerji".length <= TITLE_MAX) title += " | Aktürk Enerji";
  if (title.length > TITLE_MAX) title = title.slice(0, TITLE_MAX).replace(/\s+\S*$/, "");

  const runs = whatItRuns(p, category.slug, kw, kwp);
  const description = [
    `AKTÜRK ENERJİ | ${p.name.toLocaleUpperCase("tr")}`,
    "",
    category.intro,
    "",
    "PAKET İÇERİĞİ",
    ...contents.map((c) => `• ${c}`),
    ...(runs.length ? ["", "NELERİ ÇALIŞTIRIR?", ...runs.map((r) => `• ${r}`)] : []),
    "",
    "NEDEN AKTÜRK ENERJİ?",
    `• ${site.foundedYear} yılından bu yana ${site.city} merkezli güneş enerjisi mühendislik firması`,
    ...site.stats.filter((x) => x.value && x.label && !/beri/i.test(x.value)).map((x) => `• ${x.value} ${x.label.toLocaleLowerCase("tr")}`),
    "• Villa, müstakil ev, tarımsal sulama, işletme ve şebekesiz (off grid) sistem kurulumu",
    "• Paket seçimi, proje, EDAŞ başvurusu, kurulum ve devreye alma tek elden",
    "• Kurulum sonrası teknik destek",
    "",
    "ÖNEMLİ BİLGİLER",
    "• Fiyat KDV dahildir; döviz kuruna bağlı olarak güncellenebilir.",
    "• Kurulum pakete dahil değildir; montaj, elektrik projesi ve başvurular kurulum yerine göre ayrıca fiyatlandırılır.",
    "• Kullanacağınız cihazları ve kurulum yerini ilan üzerinden mesajla iletin; size uygun paketi ve kurulum fiyatını birlikte netleştirelim.",
    "• Ankara ve çevresinde ücretsiz keşif yapılır.",
  ].join("\n");

  return { title, description, price: p.price != null ? formatTL(p.price) : "Fiyat girilmemiş" };
}

// ───────────── Biçimli (HTML) açıklama ─────────────
// Sahibinden açıklama editörünün kabul ettiği etiketler: p, span, strong, em, u,
// ul, li, img (yalnızca satır içi stil). Açılış görseli bu sitenin adresinden gelir.

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const BLUE = "#1f5fa0";
const RED = "#d62828";
const GREEN = "#1b7a3a";
const FONT = "font-family:'roboto',sans-serif;";

function heading(text: string, color = BLUE) {
  return `<p style="text-align:center"><span style="${FONT}color:${color};font-size:15pt"><strong>${esc(text)}</strong></span></p>`;
}
function list(items: string[]) {
  return `<ul>${items.map((i) => `<li><span style="${FONT}font-size:11pt">${esc(i)}</span></li>`).join("")}</ul>`;
}
function para(text: string, opts: { center?: boolean; color?: string; bold?: boolean; size?: string } = {}) {
  const inner = `<span style="${FONT}color:${opts.color ?? "#222222"};font-size:${opts.size ?? "11pt"}">${opts.bold ? `<strong>${esc(text)}</strong>` : esc(text)}</span>`;
  return `<p${opts.center ? ' style="text-align:center"' : ""}>${inner}</p>`;
}

export function buildListingHtml(p: StoreProduct, category: StoreCategory, site: SiteSettings, siteUrl: string): string {
  const kw = kwOf(p) || 0;
  const kwp = panelKwp(p);
  const contents = p.contents.filter((c) => !/kurulum pakete dahil değil/i.test(c));
  const runs = whatItRuns(p, category.slug, kw, kwp);
  const stats = site.stats.filter((x) => x.value && x.label && !/beri/i.test(x.value)).map((x) => `${x.value} ${x.label.toLocaleLowerCase("tr")}`);
  return [
    `<p style="text-align:center"><img src="${siteUrl}/akturk-enerji-sahibinden.jpg" alt="Aktürk Enerji" width="685" style="max-width:100%;height:auto" /></p>`,
    para("AKTÜRK ENERJİ TEKNOLOJİLERİ", { center: true, color: BLUE, bold: true, size: "17pt" }),
    para("Güneşten veya rüzgârdan kendi elektriğinizi üretin!", { center: true, color: RED, bold: true, size: "13pt" }),
    para(
      `Aktürk Enerji Teknolojileri olarak ${site.foundedYear}'dan beri ${site.city}'da güneş ve rüzgâr enerjisi sistemleri kuruyor, ürünlerini satıyoruz. İlanlarımızdaki tüm ürünler orijinal ve faturalıdır; Türkiye geneline gönderim yapıyoruz. Dilerseniz ürünü yalnızca satın alabilir, dilerseniz keşif, proje ve kurulum dahil anahtar teslim hizmetimizden yararlanabilirsiniz.`,
      { center: true },
    ),
    heading(p.name, GREEN),
    heading("PAKET İÇERİĞİ"),
    list(contents),
    ...(runs.length ? [heading("NELERİ ÇALIŞTIRIR?"), list(runs)] : []),
    heading("NEDEN AKTÜRK ENERJİ?"),
    list([
      `${site.foundedYear}'dan beri ${site.city} merkezli güneş enerjisi mühendislik firması`,
      ...stats,
      "Paket seçimi, proje, başvuru, kurulum ve devreye alma tek elden",
      "Kurulum sonrası teknik destek",
    ]),
    heading("ÖNEMLİ BİLGİLER", RED),
    list([
      "Fiyat KDV dahildir; döviz kuruna bağlı olarak güncellenebilir.",
      "Kurulum pakete dahil değildir; montaj, proje ve başvurular kurulum yerine göre ayrıca fiyatlandırılır.",
      "Hangi ürünün size uygun olduğundan emin değilseniz neleri çalıştırmak istediğinizi mesajla iletin, ihtiyacınıza göre önerelim.",
      "Ankara ve çevresinde ücretsiz keşif yapılır.",
    ]),
    para("AKTÜRK ENERJİ · Güvenle kendi enerjinizi üretin", { center: true, color: BLUE, bold: true, size: "13pt" }),
  ].join("");
}
