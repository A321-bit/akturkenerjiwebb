import { SITE_URL, adminClient, getBlogPostSummaries, getReferences, getServices, getSiteSettings } from "./data";
import type { SocialType } from "./seo";
import { formatTL, priceLabel } from "./store";
import { getStoreCategories, getStoreProducts } from "./store-data";
import { productHref } from "./store-details";

// Sosyal medya otomatik paylaşım (Facebook sayfası + bağlı Instagram işletme hesabı).
//
// Plan admin'de bir kez oluşturulup onaylanır (social_posts). Günde iki kez
// çalışan görev (app/api/cron/social):
//  - Facebook: önümüzdeki 29 günün gönderilerini Meta'ya zamanlanmış gönderi
//    olarak yükler (Meta en fazla 30 gün ileriyi kabul ediyor). Gönderi link
//    paylaşımıdır; önizleme görseli ve açıklaması sayfanın og etiketlerinden gelir.
//  - Instagram: API'de zamanlama yok; zamanı gelen gönderiyi o anda paylaşır
//    (görsel /social/... ?f=sq, 1080×1080 JPEG).
// Erişim: META_ACCESS_TOKEN (sistem kullanıcısı ya da uzun süreli kullanıcı
// anahtarı; pages_manage_posts, pages_read_engagement, instagram_basic,
// instagram_content_publish izinleriyle). Sayfa anahtarı ondan türetilir.

const GRAPH = "https://graph.facebook.com/v23.0";
export const META_PAGE_ID = "151082711971643"; // Aktürk Enerji Facebook sayfası

export type SocialPost = {
  id: number;
  scheduled_at: string;
  source_type: SocialType;
  source_slug: string;
  title: string;
  caption: string;
  link: string;
  platforms: string[];
  approved: boolean;
  fb_status: string;
  fb_post_id: string | null;
  ig_status: string;
  ig_media_id: string | null;
  ig_permalink: string | null;
  error: string | null;
};

// ───────────────────────── Meta Graph API ─────────────────────────

async function graph<T>(path: string, params: Record<string, string>, method: "GET" | "POST" = "GET"): Promise<T> {
  const body = new URLSearchParams(params);
  const url = method === "GET" ? `${GRAPH}/${path}?${body}` : `${GRAPH}/${path}`;
  const res = await fetch(url, { method, body: method === "POST" ? body : undefined, cache: "no-store" });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(`Meta: ${data.error?.message ?? res.status}`);
  return data as T;
}

export type MetaAccount = { pageToken: string; pageName: string; igId: string | null; igUsername: string | null };

export async function metaAccount(): Promise<MetaAccount> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error("META_ACCESS_TOKEN ortam değişkeni tanımlı değil.");
  const page = await graph<{ access_token: string; name: string; instagram_business_account?: { id: string } }>(META_PAGE_ID, {
    fields: "access_token,name,instagram_business_account",
    access_token: token,
  });
  let igUsername: string | null = null;
  const igId = page.instagram_business_account?.id ?? null;
  if (igId) {
    const ig = await graph<{ username: string }>(igId, { fields: "username", access_token: page.access_token });
    igUsername = ig.username;
  }
  return { pageToken: page.access_token, pageName: page.name, igId, igUsername };
}

// ───────────────────────── Metinler ─────────────────────────

const HASHTAGS: Record<string, string> = {
  "tarimsal-sulama-paketleri": "#tarımsalsulama #solarsulama #güneşenerjilisulama",
  "off-grid-paketler": "#offgrid #bağevi #şebekesizelektrik",
  "hibrit-paketler": "#hibritsistem #lityumbatarya #enerjidepolama",
  "on-grid-paketler": "#ongrid #çatıges #evtipiges",
  "oztuketim-paketleri": "#öztüketim #işletmeges #fabrikages",
  "ruzgar-gunes-hibrit-sistemleri": "#rüzgartürbini #hibritenerji",
  "solar-montaj-ekipmanlari": "#solarmontaj #güneşpanelimontajı",
};
const BASE_TAGS = "#güneşenerjisi #güneşpaneli #GES #ankara #aktürkenerji";

/** Gönderim anında yerine konan etiketler: {{fiyat}} (ürün/kategori güncel fiyatı). */
export async function resolveCaption(post: Pick<SocialPost, "caption" | "source_type" | "source_slug">): Promise<string> {
  if (!post.caption.includes("{{fiyat}}")) return post.caption;
  let price = "Güncel fiyat için WhatsApp'tan yazın";
  if (post.source_type === "urun") {
    const p = (await getStoreProducts()).find((x) => x.slug === post.source_slug);
    if (p?.price != null) price = `${priceLabel(p)} (KDV dahil, kurulum hariç)`;
  } else if (post.source_type === "kategori") {
    const prices = (await getStoreProducts()).filter((x) => x.category === post.source_slug && x.price != null).map((x) => x.price!);
    if (prices.length) price = `${formatTL(Math.min(...prices))}'den başlayan fiyatlarla (KDV dahil)`;
  }
  return post.caption.replaceAll("{{fiyat}}", price);
}

type Source = { type: SocialType; slug: string; title: string; link: string; caption: string };

/** Paylaşılabilir bütün içerikler ve hazır gönderi metinleri. */
export async function socialSources(): Promise<Record<SocialType, Source[]>> {
  const [site, allProducts, categories, references, posts, services, verified] = await Promise.all([
    getSiteSettings(),
    getStoreProducts(),
    getStoreCategories(),
    getReferences(),
    getBlogPostSummaries(),
    getServices(),
    // Yalnızca içeriği ve fiyatı maliyet sistemiyle doğrulanmış paketler paylaşılır
    // (malzeme listesi girilen kategoriler plana kendiliğinden katılır).
    adminClient().from("store_products").select("slug").not("cost_usd", "is", null),
  ]);
  const verifiedSlugs = new Set((verified.data ?? []).map((r: { slug: string }) => r.slug));
  const products = allProducts.filter((p) => verifiedSlugs.has(p.slug) && p.price != null);
  const wa = `+${site.contact.whatsappNumber.replace(/\D/g, "")}`;
  const contact = `💬 WhatsApp: ${wa}\n📞 ${site.contact.phoneDisplay}`;
  const live = new Set(products.map((p) => p.category));

  return {
    urun: products.map((p) => {
      const link = `${SITE_URL}${productHref(p)}`;
      const lines = p.contents.slice(0, 6).map((c) => `• ${c}`);
      return {
        type: "urun" as const,
        slug: p.slug,
        title: p.name,
        link,
        caption: [
          `☀️ ${p.name}`,
          lines.length ? `📦 Paket içeriği:\n${lines.join("\n")}` : "",
          "💰 {{fiyat}}",
          `🛒 Detaylar ve sipariş: ${link}`,
          contact,
          `${HASHTAGS[p.category] ?? ""} ${BASE_TAGS}`.trim(),
        ]
          .filter(Boolean)
          .join("\n\n"),
      };
    }),
    kategori: categories
      .filter((c) => live.has(c.slug))
      .map((c) => {
        const link = `${SITE_URL}/magaza/${c.slug}`;
        return {
          type: "kategori" as const,
          slug: c.slug,
          title: c.name,
          link,
          caption: [`☀️ ${c.name}`, c.intro, "💰 {{fiyat}}", `🛒 Tüm paketler: ${link}`, contact, `${HASHTAGS[c.slug] ?? ""} ${BASE_TAGS}`.trim()]
            .filter(Boolean)
            .join("\n\n"),
        };
      }),
    referans: references.map((r) => {
      const link = `${SITE_URL}/referanslarimiz/${r.slug}`;
      const facts = [r.location, r.capacity, r.year].filter(Boolean).join(" · ");
      return {
        type: "referans" as const,
        slug: r.slug,
        title: r.title,
        link,
        caption: [`📍 ${r.title}`, facts, r.summary, `Projenin detayları ve fotoğrafları: ${link}`, "Ücretsiz keşif için bize ulaşın.", contact, BASE_TAGS]
          .filter(Boolean)
          .join("\n\n"),
      };
    }),
    blog: posts.map((b) => {
      const link = `${SITE_URL}/blog/${b.slug}`;
      return {
        type: "blog" as const,
        slug: b.slug,
        title: b.title,
        link,
        caption: [`📖 ${b.title}`, b.description, `Yazının tamamı: ${link}`, BASE_TAGS].filter(Boolean).join("\n\n"),
      };
    }),
    hizmet: services.map((s) => {
      const link = `${SITE_URL}/hizmetlerimiz/${s.slug}`;
      return {
        type: "hizmet" as const,
        slug: s.slug,
        title: s.title,
        link,
        caption: [
          `🔧 ${s.title}`,
          s.summary,
          s.bullets?.length ? s.bullets.slice(0, 4).map((b) => `✔️ ${b}`).join("\n") : "",
          `Detaylar ve ücretsiz keşif: ${link}`,
          contact,
          BASE_TAGS,
        ]
          .filter(Boolean)
          .join("\n\n"),
      };
    }),
  };
}

// ───────────────────────── Plan ─────────────────────────

/** Haftalık yuva: gün (1 = Pazartesi … 7 = Pazar), saat (TR) ve içerik türü. */
export type PlanSlot = { weekday: number; hour: number; type: SocialType };

/** Türkiye saati (UTC+3) → ISO zaman. */
const trTime = (ymd: string, hour: number) => new Date(`${ymd}T${String(hour).padStart(2, "0")}:00:00+03:00`).toISOString();

export async function buildPlan(opts: { start: string; months: number; slots: PlanSlot[]; platforms: string[] }) {
  const sources = await socialSources();
  // Her türün içerikleri sırayla döner; hepsi paylaşılınca baştan başlar.
  const cursor: Record<string, number> = {};
  const next = (type: SocialType) => {
    const list = sources[type];
    if (!list.length) return null;
    const i = cursor[type] ?? 0;
    cursor[type] = i + 1;
    return list[i % list.length];
  };
  const startDate = new Date(`${opts.start}T00:00:00+03:00`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + opts.months);
  const rows = [];
  for (let d = new Date(startDate); d < endDate; d = new Date(d.getTime() + 86400000)) {
    const ymd = new Date(d.getTime() + 3 * 3600000).toISOString().slice(0, 10);
    const weekday = ((new Date(`${ymd}T12:00:00Z`).getUTCDay() + 6) % 7) + 1;
    for (const slot of opts.slots.filter((s) => s.weekday === weekday)) {
      const src = next(slot.type);
      if (!src) continue;
      rows.push({
        scheduled_at: trTime(ymd, slot.hour),
        source_type: src.type,
        source_slug: src.slug,
        title: src.title,
        caption: src.caption,
        link: src.link,
        platforms: opts.platforms,
        approved: false,
        fb_status: opts.platforms.includes("facebook") ? "bekliyor" : "yok",
        ig_status: opts.platforms.includes("instagram") ? "bekliyor" : "yok",
      });
    }
  }
  return rows;
}

// ───────────────────────── Gönderim ─────────────────────────

const igImage = (p: Pick<SocialPost, "source_type" | "source_slug">) =>
  `${SITE_URL}/social/${p.source_type}/${encodeURIComponent(p.source_slug)}?f=sq&fiyat=1`;

/** Zamanı gelen ve 29 gün içindeki onaylı gönderileri Meta'ya iletir. */
export async function runSocial(): Promise<{ facebook: number; instagram: number; errors: string[] }> {
  const db = adminClient();
  const meta = await metaAccount();
  const now = Date.now();
  const horizon = new Date(now + 29 * 86400000).toISOString();
  const result = { facebook: 0, instagram: 0, errors: [] as string[] };

  const { data: fbQueue } = await db
    .from("social_posts")
    .select("*")
    .eq("approved", true)
    .eq("fb_status", "bekliyor")
    .lte("scheduled_at", horizon)
    .order("scheduled_at")
    .limit(60);
  for (const p of (fbQueue ?? []) as SocialPost[]) {
    try {
      const when = new Date(p.scheduled_at).getTime();
      const message = await resolveCaption(p);
      // Facebook önizlemeyi yeniden okusun (og:image / açıklama güncel olsun).
      await graph("", { id: p.link, scrape: "true", access_token: meta.pageToken }, "POST").catch(() => null);
      const params: Record<string, string> = { message, link: p.link, access_token: meta.pageToken };
      if (when > now + 15 * 60000) {
        params.published = "false";
        params.scheduled_publish_time = String(Math.floor(when / 1000));
      }
      const res = await graph<{ id: string }>(`${META_PAGE_ID}/feed`, params, "POST");
      await db
        .from("social_posts")
        .update({ fb_status: params.published === "false" ? "zamanlandi" : "paylasildi", fb_post_id: res.id, error: null, updated_at: new Date().toISOString() })
        .eq("id", p.id);
      result.facebook++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      result.errors.push(`FB #${p.id}: ${msg}`);
      await db.from("social_posts").update({ error: `Facebook: ${msg}`, updated_at: new Date().toISOString() }).eq("id", p.id);
    }
  }

  if (meta.igId) {
    const { data: igQueue } = await db
      .from("social_posts")
      .select("*")
      .eq("approved", true)
      .eq("ig_status", "bekliyor")
      .lte("scheduled_at", new Date(now + 30 * 60000).toISOString())
      .order("scheduled_at")
      .limit(3);
    for (const p of (igQueue ?? []) as SocialPost[]) {
      try {
        const caption = await resolveCaption(p);
        const container = await graph<{ id: string }>(`${meta.igId}/media`, { image_url: igImage(p), caption, access_token: meta.pageToken }, "POST");
        // Görsel Meta tarafında işlenene kadar kısa bekleme.
        for (let i = 0; i < 10; i++) {
          const st = await graph<{ status_code: string }>(container.id, { fields: "status_code", access_token: meta.pageToken });
          if (st.status_code === "FINISHED") break;
          if (st.status_code === "ERROR") throw new Error("Instagram görseli işleyemedi.");
          await new Promise((r) => setTimeout(r, 2000));
        }
        const media = await graph<{ id: string }>(`${meta.igId}/media_publish`, { creation_id: container.id, access_token: meta.pageToken }, "POST");
        const info = await graph<{ permalink?: string }>(media.id, { fields: "permalink", access_token: meta.pageToken }).catch(() => ({ permalink: undefined }));
        await db
          .from("social_posts")
          .update({ ig_status: "paylasildi", ig_media_id: media.id, ig_permalink: info.permalink ?? null, error: null, updated_at: new Date().toISOString() })
          .eq("id", p.id);
        result.instagram++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        result.errors.push(`IG #${p.id}: ${msg}`);
        await db.from("social_posts").update({ error: `Instagram: ${msg}`, updated_at: new Date().toISOString() }).eq("id", p.id);
      }
    }
  }
  return result;
}
