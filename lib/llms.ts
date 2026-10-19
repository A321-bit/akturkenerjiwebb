import { SITE_URL, getBlogPostSummaries, getReferences, getServices, getSiteSettings } from "./data";
import { formatTL } from "./store";
import { getStoreCategories, getStoreProducts, getStoreSettings } from "./store-data";
import { productHref } from "./store-details";

// llms.txt (https://llmstxt.org): yapay zekâ asistanlarına ve arama botlarına
// sitenin kısa, düz metin özeti. Her şey veritabanındaki güncel içerikten
// üretilir; hizmet, yazı, referans ya da mağaza ürünü eklendikçe kendiliğinden
// güncellenir. llms.txt bağlantı listesidir, llms-full.txt ayrıntılı sürümdür
// (paket içerikleri, fiyatlar, hizmet açıklamaları, sık sorulan sorular).
// Alış fiyatı ve kâr marjı gibi iç bilgiler hiçbir zaman buraya girmez.

const abs = (path: string) => `${SITE_URL}${path}`;
const oneLine = (s: string | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

async function load() {
  const [site, services, references, posts, categories, products, store] = await Promise.all([
    getSiteSettings(),
    getServices(),
    getReferences(),
    getBlogPostSummaries(),
    getStoreCategories(),
    getStoreProducts(),
    getStoreSettings(),
  ]);
  const liveCategories = categories
    .map((c) => ({ ...c, products: products.filter((p) => p.category === c.slug) }))
    .filter((c) => c.products.length > 0);
  return { site, services, references, posts, liveCategories, store };
}

function priceRange(ps: { price?: number }[]): string {
  const prices = ps.map((p) => p.price).filter((n): n is number => n != null);
  if (!prices.length) return "fiyatlar WhatsApp hattından verilir";
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  return lo === hi ? formatTL(lo) : `${formatTL(lo)} – ${formatTL(hi)}`;
}

type Data = Awaited<ReturnType<typeof load>>;

function header({ site }: Data): string[] {
  const c = site.contact;
  return [
    `# ${site.name}`,
    "",
    `> ${oneLine(site.description)}`,
    "",
    `${site.name}, ${site.foundedYear} yılından bu yana ${site.city} merkezli olarak güneş enerjisi (GES) sistemleri kuran bir enerji firmasıdır. Çatı ve arazi GES kurulumu, tarımsal sulama, off grid, hibrit ve lityum bataryalı sistemler, rüzgâr–güneş hibrit sistemleri ile elektrik projesi ve EDAŞ başvuru süreçlerinde hizmet verir.`,
    "",
    `- Adres: ${oneLine(c.addressLine)}`,
    `- Telefon: ${c.phoneDisplay}`,
    `- WhatsApp: +${c.whatsappNumber.replace(/\D/g, "")}`,
    `- E-posta: ${c.email}`,
    ...(c.workingHours ? [`- Çalışma saatleri: ${oneLine(c.workingHours)}`] : []),
    `- Web: ${SITE_URL}`,
    "",
    "Mağaza hakkında bilinmesi gerekenler:",
    "",
    "- Paket fiyatları KDV dahil Türk lirasıdır ve döviz kuruna bağlı olarak güncellenir; güncel fiyat her zaman ürün sayfasındadır.",
    "- Kurulum hiçbir pakete dahil değildir; montaj, elektrik projesi ve başvurular kurulum yerine göre ayrıca fiyatlandırılır.",
    "- Sipariş WhatsApp hattından alınır.",
    "",
  ];
}

export async function buildLlmsTxt(): Promise<string> {
  const d = await load();
  const lines = header(d);

  lines.push("## Hizmetler", "");
  for (const s of d.services) lines.push(`- [${s.title}](${abs(`/hizmetlerimiz/${s.slug}`)}): ${oneLine(s.summary)}`);

  lines.push("", "## Mağaza: Güneş Enerjisi Paketleri", "");
  lines.push(`- [Mağaza ana sayfası](${abs("/magaza")}): Fiyatı ve içeriği açık hazır güneş enerjisi paketleri.`);
  for (const c of d.liveCategories) {
    lines.push(`- [${c.name}](${abs(`/magaza/${c.slug}`)}): ${oneLine(c.intro)} (${c.products.length} paket; ${priceRange(c.products)})`);
  }
  lines.push(`- [Off grid paket hesaplama](${abs("/magaza/off-grid-hesaplama")}): Kullanılacak cihazlara göre uygun off grid paketini hesaplayan ücretsiz araç.`);

  lines.push("", "## Referanslar", "");
  lines.push(`- [Tüm referanslar](${abs("/referanslarimiz")}): Kurulan güneş enerjisi sistemlerinden örnekler.`);
  for (const r of d.references) {
    const facts = [r.location, r.capacity, r.year].filter(Boolean).join(", ");
    lines.push(`- [${r.title}](${abs(`/referanslarimiz/${r.slug}`)}): ${facts}${r.summary ? `. ${oneLine(r.summary)}` : ""}`);
  }

  lines.push("", "## Blog Yazıları", "");
  for (const p of d.posts) lines.push(`- [${p.title}](${abs(`/blog/${p.slug}`)}): ${oneLine(p.description)}`);

  lines.push("", "## Kurumsal", "");
  lines.push(`- [Hakkımızda](${abs("/hakkimizda")}): Firma, ekip ve çalışma şekli.`);
  lines.push(`- [İletişim](${abs("/iletisim")}): Adres, telefon, WhatsApp ve ücretsiz keşif talebi.`);
  lines.push(`- [Mağaza sipariş hattı](${abs("/magaza/iletisim")}): Sipariş süreci, banka hesapları ve sipariş soruları.`);

  lines.push("", "## Optional", "");
  lines.push(`- [Ayrıntılı sürüm (llms-full.txt)](${abs("/llms-full.txt")}): Paket içerikleri, güncel fiyatlar, hizmet açıklamaları ve sık sorulan sorular.`);
  lines.push(`- [Site haritası](${abs("/sitemap.xml")})`);
  return lines.join("\n") + "\n";
}

export async function buildLlmsFullTxt(): Promise<string> {
  const d = await load();
  const lines = header(d);

  lines.push("## Hizmetler", "");
  for (const s of d.services) {
    lines.push(`### ${s.title}`, "", `Sayfa: ${abs(`/hizmetlerimiz/${s.slug}`)}`, "", oneLine(s.description || s.summary), "");
    if (s.bullets?.length) lines.push(...s.bullets.map((b) => `- ${oneLine(b)}`), "");
    if (s.audience) lines.push(`Kimler için: ${oneLine(s.audience)}`, "");
    for (const f of s.faqs ?? []) lines.push(`**${oneLine(f.q)}** ${oneLine(f.a)}`, "");
  }

  lines.push("## Mağaza Paketleri ve Fiyatları", "");
  lines.push(`Fiyatlar KDV dahildir, döviz kuruna göre güncellenir; bu dosyadaki fiyatlar en geç bir saat öncesine aittir. Kurulum dahil değildir.`, "");
  for (const c of d.liveCategories) {
    lines.push(`### ${c.name}`, "", `Kategori sayfası: ${abs(`/magaza/${c.slug}`)}`, "", oneLine(c.intro), "");
    for (const p of c.products) {
      lines.push(`#### ${p.name}`, "");
      lines.push(`- Fiyat: ${p.price != null ? `${formatTL(p.price)} (KDV dahil)` : "WhatsApp hattından sorulur"}`);
      lines.push(`- Sayfa: ${abs(productHref(p))}`);
      if (p.seoDescription) lines.push(`- Özet: ${oneLine(p.seoDescription)}`);
      if (p.contents.length) {
        lines.push("- Paket içeriği:");
        lines.push(...p.contents.map((x) => `  - ${oneLine(x)}`));
      }
      lines.push("");
    }
  }

  if (d.store.faqs.length) {
    lines.push("## Mağaza: Sık Sorulan Sorular", "");
    for (const f of d.store.faqs) lines.push(`**${oneLine(f.q)}** ${oneLine(f.a)}`, "");
  }
  if (d.store.orderSteps.length) {
    lines.push("## Sipariş Nasıl Verilir?", "");
    d.store.orderSteps.forEach((s, i) => lines.push(`${i + 1}. ${oneLine(s.title)}: ${oneLine(s.text)}`));
    lines.push("");
  }

  lines.push("## Referanslar", "");
  for (const r of d.references) {
    const facts = [r.location, r.capacity, r.year].filter(Boolean).join(", ");
    lines.push(`- [${r.title}](${abs(`/referanslarimiz/${r.slug}`)}): ${facts}${r.summary ? `. ${oneLine(r.summary)}` : ""}`);
  }

  lines.push("", "## Blog Yazıları", "");
  for (const p of d.posts) lines.push(`- [${p.title}](${abs(`/blog/${p.slug}`)}): ${oneLine(p.description)}`);
  return lines.join("\n") + "\n";
}
