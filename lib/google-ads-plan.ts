// Google Ads arama kampanyası planı (Ekim 2026, kullanıcı onaylı: "önerdiğin gibi kur").
// Anahtar kelimeler Anahtar Kelime Planlayıcı verisinden seçildi (taslaklar/google-ads-anahtar-kelimeler.xlsx).
// Kampanya DURDURULMUŞ kurulur; yayına almak admin panelinden.

export type AdGroupPlan = { name: string; finalUrl: string; path1: string; path2?: string; headlines: string[]; keywords: string[] };
export type CampaignPlan = {
  name: string;
  dailyBudget: number;
  /** geoTargetConstants kimlikleri (il). */
  locations: { id: number; name: string }[];
  adGroups: AdGroupPlan[];
  descriptions: string[];
  negatives: string[];
  sitelinks: { text: string; d1: string; d2: string; url: string }[];
  callouts: string[];
  snippet: { header: string; values: string[] };
};

const COMMON_HEADLINES = [
  "Aktürk Enerji",
  "Ücretsiz Keşif ve Proje",
  "Anahtar Teslim Kurulum",
  "Peşin Fiyatına 4 Taksit",
  "Elektrik Faturanızı Sıfırlayın",
  "Lityum Bataryalı Hibrit GES",
  "Güncel 2026 Paket Fiyatları",
  "Kesintide Bile Elektrik",
  "Aracınızı Güneşle Şarj Edin",
  "Proje ve Başvuru Bizden",
];

export const SEARCH_PLAN: CampaignPlan = {
  name: "AKT // Arama // Ev-Villa-GES // 2026-10",
  dailyBudget: 150,
  locations: [
    { id: 21055, name: "Ankara" },
    { id: 21369, name: "Kırşehir" },
    { id: 21093, name: "Kırıkkale" },
    { id: 21361, name: "Çankırı" },
    { id: 21059, name: "Bolu" },
    { id: 21072, name: "Kastamonu" },
  ],
  adGroups: [
    {
      name: "Ev & Villa",
      finalUrl: "https://akturkenerji.com/hizmetlerimiz/villa-cati-ges",
      path1: "villa-ges",
      headlines: ["Ev İçin Güneş Paneli", "Villa Güneş Enerji Sistemi", "Müstakil Eve Güneş Paneli", "Evinize Özel GES Projesi", "Villanız Elektrik Üretsin"],
      keywords: [
        "ev için güneş paneli", "müstakil ev için güneş paneli", "ev için güneş paneli fiyatları", "ev tipi güneş paneli",
        "ev güneş enerjisi fiyatları", "bir eve yetecek güneş paneli fiyatı", "1 ev için güneş paneli maliyeti",
        "ev için güneş enerji sistemi", "evler için güneş enerjisi sistemleri", "müstakil ev güneş enerjisi maliyeti",
        "ev güneş enerji sistemleri", "ev tipi güneş enerji sistemi", "güneş paneli fiyatları ev için", "çatı güneş paneli",
        "çatıya güneş enerjisi", "villa güneş enerjisi",
      ],
    },
    {
      name: "Hazır Solar Paket",
      finalUrl: "https://akturkenerji.com/magaza/on-grid-paketler",
      path1: "solar-paket",
      headlines: ["Hazır Solar Paketler", "Hazır Güneş Enerji Sistemi", "On Grid ve Hibrit Paketler", "5 kW'tan 500 kW'a Paketler", "Solar Paket Fiyatları"],
      keywords: [
        "solar paket", "solar paketler", "hazır solar paketler", "hazır güneş enerji sistemleri", "solar enerji paket",
        "güneş enerjisi paketleri", "güneş paneli paket", "hazır güneş paneli sistemi", "solar paket sistem",
      ],
    },
    {
      name: "kW Bazlı Fiyat",
      finalUrl: "https://akturkenerji.com/magaza/on-grid-paketler",
      path1: "on-grid",
      path2: "fiyatlar",
      headlines: ["10 kW Güneş Paneli Fiyatları", "5 kW Güneş Enerji Sistemi", "15 kW ve 20 kW GES Paketleri", "Güç Seçin, Fiyatı Görün", "Ücretsiz Maliyet Hesabı"],
      keywords: [
        "10 kw güneş paneli fiyatları", "10 kw güneş paneli kurulum maliyeti", "10 kw güneş paneli", "5 kw güneş paneli fiyatları",
        "5 kw güneş paneli", "5 kw güneş enerji sistemi", "6 kw güneş paneli fiyatları", "6 kw güneş paneli kurulum maliyeti",
        "15 kw güneş paneli fiyatları", "15 kw güneş enerjisi kurulum maliyeti", "20 kw güneş paneli fiyatları",
        "12 kw güneş paneli fiyatları", "7.5 kw güneş paneli fiyatları", "8 kw güneş paneli",
      ],
    },
    {
      name: "Hibrit & Batarya",
      finalUrl: "https://akturkenerji.com/magaza/hibrit-paketler",
      path1: "hibrit",
      path2: "lityum",
      headlines: ["Hibrit Güneş Enerji Sistemi", "Lityum Batarya Depolama", "Gece de Güneş Enerjisi", "Hibrit Lityum Paketler", "Kesintiye Karşı Batarya"],
      keywords: [
        "güneş enerjisi batarya", "güneş enerji batarya fiyatları", "güneş enerji depoları fiyatları", "hibrit güneş paneli",
        "hibrit güneş enerji sistemi", "lityum bataryalı güneş enerjisi", "lityum iyon batarya güneş enerjisi",
      ],
    },
    {
      name: "Ankara & Bölge",
      finalUrl: "https://akturkenerji.com/",
      path1: "ankara",
      headlines: ["Ankara Güneş Enerjisi", "Ankara GES Firması", "Ankara Merkezli Uzman Ekip", "Ankara ve Çevre İllerde", "Ankara Güneş Paneli Firması"],
      keywords: [
        "ankara güneş enerji sistemleri", "ankara güneş enerjisi firmaları", "güneş enerji sistemi ankara", "ankara ges firmaları",
        "ankara güneş enerjisi", "güneş enerjisi ankara", "ankara güneş paneli", "ankara güneş paneli firmaları",
      ],
    },
    {
      name: "Çatı GES & Kurulum",
      finalUrl: "https://akturkenerji.com/teklif-al",
      path1: "cati-ges",
      headlines: ["Çatı GES Kurulumu", "Çatı GES Maliyeti", "Mesken GES Başvurusu", "Çağrı Mektubu Bizden", "Çatınızdan Elektrik Üretin"],
      keywords: [
        "çatı ges", "çatı ges maliyeti", "çatı ges fiyatları", "çatı ges kurulum maliyeti", "çatı ges firmaları", "mesken ges",
        "güneş enerjisi kurulumu", "güneş paneli kurulumu", "güneş paneli kurulum maliyeti", "güneş enerji panel kurulumu", "ges sistemi",
      ],
    },
    {
      name: "Genel",
      finalUrl: "https://akturkenerji.com/",
      path1: "gunes-enerjisi",
      headlines: ["Güneş Enerjisi Sistemleri", "Güneş Paneli Sistemleri", "Solar Enerji Sistemi", "Güneş Paneli Kurulumu", "Ankara Güneş Enerjisi"],
      keywords: [
        "güneş enerjisi sistemleri", "güneş paneli sistemi", "güneş enerjisi sistemleri fiyatları", "solar enerji sistemi",
        "güneş paneli sistemi fiyatları", "solar güneş enerji sistemleri",
      ],
    },
  ],
  descriptions: [
    "Villanıza güneş paneli, lityum batarya ve araç şarjı tek elden. Ücretsiz keşif için arayın",
    "Proje, çağrı mektubu başvurusu ve anahtar teslim kurulum bizden. Peşin fiyatına 4 taksit.",
    "İncek, Beytepe, Ümitköy ve Bağlıca'da tamamlanan villa projeleri. Size özel teklif alın.",
    "On grid, hibrit ve off grid hazır paketler. Güncel fiyatlar için WhatsApp'tan yazın.",
  ],
  negatives: [
    "su ısıtıcı", "su ısıtma", "sıcak su", "basınçlı", "petek", "termosifon", "kollektör",
    "lamba", "aydınlatma", "sokak lambası", "şarj cihazı", "şarj kontrol", "powerbank", "pil",
    "mini", "küçük", "taşınabilir", "portatif", "seyyar", "katlanabilir", "esnek", "yapışkanlı", "balkon",
    "watt", "12 volt", "24 volt", "220 volt", "karavan", "kamp", "tekne", "çadır",
    "ikinci el", "2. el", "sahibinden", "letgo",
    "nedir", "nasıl yapılır", "nasıl çalışır", "pdf", "ödev", "tez", "yönetmeliği",
    "iş ilanı", "iş ilanları", "maaş", "staj", "eleman", "kariyer",
    "hibe", "jeneratör", "güneş ocağı", "oyuncak", "hesap makinesi",
    "cw enerji", "tünelsan", "eraslan", "entegre solar", "kalyon", "pekintaş", "anker", "ecoflow", "arçelik", "lexron",
    "lisanssız elektrik üretimi", "jel akü",
  ],
  sitelinks: [
    { text: "Ücretsiz Keşif İsteyin", d1: "Uzman ekip yerinde inceler", d2: "Size özel proje ve teklif", url: "https://akturkenerji.com/teklif-al" },
    { text: "Villa Çatı GES", d1: "Villanız için anahtar teslim", d2: "Lityum batarya ve araç şarjı", url: "https://akturkenerji.com/hizmetlerimiz/villa-cati-ges" },
    { text: "Hibrit Lityum Paketler", d1: "Kesintide bile elektrik", d2: "Güncel paket fiyatları", url: "https://akturkenerji.com/magaza/hibrit-paketler" },
    { text: "On Grid Paket Fiyatları", d1: "Faturanızı mahsuplaşmayla düşürün", d2: "5–20 kW hazır paketler", url: "https://akturkenerji.com/magaza/on-grid-paketler" },
    { text: "Referans Projelerimiz", d1: "Ankara'da tamamlanan kurulumlar", d2: "Gerçek proje fotoğrafları", url: "https://akturkenerji.com/referanslarimiz" },
    { text: "Elektrikli Araç Şarjı", d1: "Aracınızı güneşle şarj edin", d2: "Ev tipi şarj ünitesi kurulumu", url: "https://akturkenerji.com/hizmetlerimiz/elektrikli-arac-sarj-istasyonu" },
    { text: "Lityum Batarya Depolama", d1: "Ürettiğinizi depolayın", d2: "Gece ve kesintide kullanın", url: "https://akturkenerji.com/hizmetlerimiz/lityum-batarya-depolama" },
    { text: "Proje ve Başvuru", d1: "Çağrı mektubu ve proje bizden", d2: "Mühendislik dahil süreç", url: "https://akturkenerji.com/hizmetlerimiz/projelendirme-muhendislik-basvuru" },
  ],
  callouts: [
    "Ücretsiz Keşif", "Anahtar Teslim Kurulum", "Peşin Fiyatına 4 Taksit", "Proje ve Başvuru Bizden",
    "Lityum Batarya Depolama", "Elektrikli Araç Şarjı", "Ankara Merkezli Ekip", "Isı Pompası Entegrasyonu",
  ],
  snippet: { header: "Hizmetler", values: ["On Grid GES", "Hibrit GES", "Off Grid Sistem", "Lityum Batarya", "Araç Şarj Ünitesi", "Isı Pompası", "Çatı GES"] },
};

export const headlinesFor = (g: AdGroupPlan) => [...g.headlines, ...COMMON_HEADLINES].slice(0, 15);
