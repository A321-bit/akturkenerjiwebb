import type { LeadCampaignSpec } from "./meta-ads-manage";

// Meta kampanya planları (Ekim 2026, kullanıcı onaylı bütçeler: villa 150 TL, yeniden pazarlama 50 TL).
// Form: "Solar-Ges-On-Grid" (fatura aralığı, elektrikli araç, mülk tipi soruları; en iyi sonuç veren form).

export const LEAD_FORM_ID = "928087409617061";
const IMG = "https://tzibyocqotqcowebswlq.supabase.co/storage/v1/object/public/media/reklam/meta/";

// Facebook akış + Reels, Instagram akış/Hikâye/Reels/Keşfet. Audience Network ve FB Hikâye
// geçmişte pahalıydı (sonuç başı 159–473 TL), dahil değil.
const PLACEMENTS = {
  publisher_platforms: ["facebook", "instagram"],
  facebook_positions: ["feed", "facebook_reels"],
  instagram_positions: ["stream", "story", "reels", "explore"],
};

/** Varlıklı villa bölgeleri: merkez + yarıçap (km). Meta bu semtleri adla tanımıyor. */
const VILLA_AREAS = [
  { name: "İncek", latitude: 39.82, longitude: 32.725, radius: 3 },
  { name: "Gölbaşı", latitude: 39.79, longitude: 32.805, radius: 4 },
  { name: "Beytepe", latitude: 39.868, longitude: 32.735, radius: 2 },
  { name: "Ümitköy", latitude: 39.897, longitude: 32.705, radius: 2 },
  { name: "Çayyolu", latitude: 39.884, longitude: 32.682, radius: 2.5 },
  { name: "Yaşamkent", latitude: 39.866, longitude: 32.655, radius: 2 },
  { name: "Oran", latitude: 39.855, longitude: 32.83, radius: 1.5 },
  { name: "Bağlıca", latitude: 39.903, longitude: 32.618, radius: 2 },
];

export const VILLA_PLAN: LeadCampaignSpec = {
  name: "AKT // Meta // Villa GES // Form // 2026-10",
  adSetName: "Villa bölgeleri · 35+ · konutta yaşayan",
  dailyBudget: 150,
  formId: LEAD_FORM_ID,
  targeting: {
    geo_locations: {
      custom_locations: VILLA_AREAS.map((a) => ({ latitude: a.latitude, longitude: a.longitude, radius: a.radius, distance_unit: "kilometer", name: a.name })),
      location_types: ["home"],
    },
    age_min: 35,
    age_max: 65,
    ...PLACEMENTS,
    targeting_automation: { advantage_audience: 0 },
  },
  ads: [
    {
      name: "Modern villa + elektrikli araç",
      image: `${IMG}villa-modern-ev-elektrikli-arac.jpg`,
      headline: "Villanız Kendi Elektriğini Üretsin",
      description: "Ücretsiz keşif · Peşin fiyatına 4 taksit",
      message:
        "Villanızın aylık elektrik faturası 5.000 TL'yi geçiyorsa, çatınız bu faturayı düşürebilir. ☀️\n\n✅ Lityum bataryalı hibrit sistem: kesintide bile eviniz çalışır\n✅ Elektrikli aracınızı evde güneşle şarj edin\n✅ Proje, başvuru ve anahtar teslim kurulum bizden\n✅ Peşin fiyatına 4 taksit\n\nÜcretsiz keşif için formu doldurun, sizi arayalım.",
    },
    {
      name: "Villanızda faturaya son",
      image: `${IMG}villa-elektrik-faturasina-son.jpg`,
      headline: "Villanızda Elektrik Faturasına Son",
      description: "Ankara'ya özel çözümler · Ücretsiz keşif",
      message:
        "Ankara'da villanıza özel güneş enerjisi: panel, lityum batarya, elektrikli araç şarjı ve ısı pompası entegrasyonu tek elden. ⚡\n\nKeşiften kuruluma her adımı biz üstleniyoruz; çağrı mektubu başvurusu ve proje süreci bizden.\n\n📍 İncek, Beytepe, Ümitköy ve Bağlıca'da tamamlanan villa projeleri\n💳 Peşin fiyatına 4 taksit\n\nFormu doldurun, size özel sistemi ve net fiyatı çıkaralım.",
    },
    {
      name: "Gerçek proje · Gölbaşı 15 kW hibrit",
      image: `${IMG}golbasi-15kw-hibrit-villa-projesi.jpg`,
      headline: "Gölbaşı · 15 kW Hibrit Villa GES",
      description: "Lityum bataryalı · Kesintide bile elektrik",
      message:
        "Gölbaşı'nda tamamladığımız 15 kW hibrit, lityum bataryalı villa güneş enerji sistemi. ☀️🔋\n\nGündüz çatıdan üretiyor, fazlasını bataryada saklıyor; elektrik kesildiğinde ev çalışmaya devam ediyor.\n\nBenzer bir sistem villanız için ne kadar tutar? Ücretsiz keşif için formu doldurun.",
    },
    {
      name: "Eviniz enerjisini yönetsin (dikey)",
      image: `${IMG}villa-enerjinizi-kendiniz-yonetin-dikey.jpg`,
      headline: "Eviniz Enerjisini Kendi Yönetsin",
      description: "Güneş + ısı pompası + araç şarjı + batarya",
      message:
        "Güneş enerjisi, ısı pompası, araç şarjı ve batarya bir arada: eviniz enerjisini kendisi üretsin, depolasın ve akıllıca kullansın. ⚡\n\nAnkara'da villanıza özel sistem ve net fiyat için ücretsiz keşif formunu doldurun.",
    },
  ],
};

/** Yeniden pazarlama: site ziyaretçileri + Instagram/Facebook etkileşim + formu açanlar; formu gönderenler hariç. */
export function retargetPlan(aud: { site?: string; instagram?: string; page?: string; formOpened?: string; formSubmitted?: string }): LeadCampaignSpec {
  const include = [aud.site, aud.instagram, aud.page, aud.formOpened].filter(Boolean).map((id) => ({ id }));
  return {
    name: "AKT // Meta // Yeniden Pazarlama // Form // 2026-10",
    adSetName: "Site + IG/FB etkileşim + form açan · gönderen hariç",
    dailyBudget: 50,
    formId: LEAD_FORM_ID,
    targeting: {
      geo_locations: { countries: ["TR"] },
      custom_audiences: include,
      ...(aud.formSubmitted ? { excluded_custom_audiences: [{ id: aud.formSubmitted }] } : {}),
      age_min: 25,
      age_max: 65,
      ...PLACEMENTS,
      targeting_automation: { advantage_audience: 0 },
    },
    ads: [
      {
        name: "Ücretsiz keşif · 4 taksit",
        image: `${IMG}beytepe-villa-ges-projesi.jpg`,
        headline: "Ücretsiz Keşif · Peşin Fiyatına 4 Taksit",
        description: "Size özel sistem ve net fiyat",
        message:
          "Güneş enerjisine geçişi hâlâ düşünüyor musunuz? ☀️\n\nÜcretsiz keşifle çatınıza en uygun sistemi ve net fiyatı çıkaralım. Proje, başvuru ve anahtar teslim kurulum bizden; peşin fiyatına 4 taksit.\n\nFormu doldurun, uzman ekibimiz sizi arasın.",
      },
      {
        name: "Gerçek proje · Bağlıca 10 kW",
        image: `${IMG}baglica-10kw-villa-projesi.jpg`,
        headline: "Bağlıca · 10 kW Villa GES",
        description: "Ankara'da tamamlanan proje",
        message:
          "Bağlıca'da tamamladığımız 10 kW villa güneş enerjisi projesi. 🏡\n\nSiz de faturanızı düşürmek istiyorsanız villanıza uygun sistemi birlikte planlayalım. Ücretsiz keşif için formu doldurun.",
      },
    ],
  };
}
