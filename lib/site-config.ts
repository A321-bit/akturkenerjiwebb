// ─────────────────────────────────────────────────────────────────────────
// TÜM ŞİRKET BİLGİLERİ BURADA. Gerçek bilgilerinizi aldığınızda sadece bu
// dosyayı güncellemeniz yeterli — site genelinde otomatik değişir.
// [PLACEHOLDER] etiketli alanları mutlaka gerçek bilgilerinizle değiştirin.
// ─────────────────────────────────────────────────────────────────────────

export const site = {
  name: "Aktürk Enerji Teknolojileri",
  shortName: "Aktürk Enerji",
  domain: "akturkenerji.com",
  url: "https://akturkenerji.com",
  foundedYear: 2016,
  city: "Ankara",
  country: "Türkiye",
  description:
    "2016'dan beri Ankara merkezli; villa, hobi bahçesi, tarımsal sulama ve müteahhit projeleri için anahtar teslim güneş enerjisi (GES) sistemleri kuran mühendislik firması.",

  // [PLACEHOLDER] Gerçek iletişim bilgilerinizi girin
  contact: {
    phoneDisplay: "0 (5XX) XXX XX XX", // [PLACEHOLDER]
    phoneHref: "tel:+905XXXXXXXXX", // [PLACEHOLDER]
    whatsappNumber: "905XXXXXXXXX", // [PLACEHOLDER] — başında ülke kodu, + ve boşluk olmadan
    email: "info@akturkenerji.com", // [PLACEHOLDER]
    addressLine: "Örnek Mahallesi, Enerji Caddesi No: 1, Çankaya/Ankara", // [PLACEHOLDER]
    mapsEmbedUrl: "", // [PLACEHOLDER] Google Maps embed linki
    workingHours: "Pazartesi–Cumartesi, 09:00–18:30",
  },

  social: {
    instagram: "https://instagram.com/akturkenerji", // [PLACEHOLDER]
    linkedin: "https://linkedin.com/company/akturkenerji", // [PLACEHOLDER]
    youtube: "", // [PLACEHOLDER]
    facebook: "", // [PLACEHOLDER]
  },
};

export const whatsappLink = (message: string) =>
  `https://wa.me/${site.contact.whatsappNumber}?text=${encodeURIComponent(message)}`;

export type Service = {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  description: string;
  bullets: string[];
  audience: string;
};

export const services: Service[] = [
  {
    slug: "villa-cati-ges",
    eyebrow: "Konut",
    title: "Mesken & Villa Çatı GES Sistemleri",
    summary:
      "Fatura bağımlılığını azaltan, çatınıza özel projelendirilmiş anahtar teslim güneş enerjisi sistemleri.",
    description:
      "Villa ve müstakil konutlar için çatı yapınıza, çatı yönünüze ve tüketim profilinize göre mühendislik hesabıyla boyutlandırılmış sistemler kuruyoruz. Statik hesap, elektrik projesi, dağıtım şirketi (EDAŞ) başvurusu ve kurulumun tamamı bizde.",
    bullets: [
      "Ücretsiz keşif ve tüketim analizi",
      "Statik ve elektrik proje çizimi",
      "EDAŞ bağlantı anlaşması ve başvuru takibi",
      "10+ yıl ürün garantili panel ve inverter seçenekleri",
    ],
    audience: "Villa ve müstakil konut sahipleri",
  },
  {
    slug: "muteahhit-ges",
    eyebrow: "İş Ortaklığı",
    title: "Müteahhit Firmalarla GES Kurulumları",
    summary:
      "Toplu konut ve site projelerinde geliştiriciyle birlikte çalışan, teslim tarihine göre planlanan kurulum hattı.",
    description:
      "İnşaat firmalarına proje aşamasından teslimata kadar ortak çalışıyoruz: elektrik altyapısına uygun ön proje, toplu malzeme tedariği ve blok blok kurulum takvimi kurarak teslim tarihinizi aksatmıyoruz.",
    bullets: [
      "Proje geliştirme aşamasında ön mühendislik desteği",
      "Toplu alım fiyat avantajı",
      "Blok/etap bazlı kurulum takvimi",
      "Bayilik ve distribütörlük iş birliği seçenekleri",
    ],
    audience: "Müteahhit ve gayrimenkul geliştirme firmaları",
  },
  {
    slug: "tarimsal-sulama",
    eyebrow: "Tarım",
    title: "Tarımsal Sulama Güneş Enerjisi Sistemleri",
    summary:
      "Şebeke bağlantısı olmayan arazilerde güneşle çalışan sulama pompa sistemleri.",
    description:
      "Elektrik hattının ulaşmadığı tarım arazilerinde güneş enerjisiyle çalışan dalgıç pompa sistemleri kuruyoruz. Debi ve kuyu derinliğine göre panel ve pompa eşleştirmesi yaparak yakıt/şebeke maliyetini sıfırlıyoruz.",
    bullets: [
      "Kuyu derinliği ve debiye göre pompa seçimi",
      "Şebekeden bağımsız çalışma",
      "Düşük bakım maliyeti",
      "Tarımsal destek/hibe süreçlerinde danışmanlık",
    ],
    audience: "Çiftçiler ve tarımsal işletmeler",
  },
  {
    slug: "ruzgar-hibrit",
    eyebrow: "Hibrit",
    title: "Rüzgar Türbini & Hibrit Sistemler",
    summary:
      "Güneş ışınımının düşük olduğu saatlerde rüzgar desteğiyle kesintisiz üretim.",
    description:
      "Bölgenin rüzgar potansiyeline göre küçük ölçekli türbinleri güneş sistemleriyle birleştirerek gece ve bulutlu saatlerde de üretim sağlayan hibrit çözümler tasarlıyoruz.",
    bullets: [
      "Bölgesel rüzgar/güneş verimlilik analizi",
      "Hibrit inverter ve kontrol ünitesi entegrasyonu",
      "Karavan ve uzak tesisler için mobil seçenekler",
    ],
    audience: "Şebekeden bağımsız çalışmak isteyen tesisler",
  },
  {
    slug: "lityum-batarya-depolama",
    eyebrow: "Depolama",
    title: "Lityum Bataryalı Depolamalı Sistemler",
    summary:
      "Ürettiğiniz enerjiyi depolayıp kesinti anında veya gece kullanmanızı sağlayan batarya sistemleri.",
    description:
      "LiFePO4 batarya teknolojisiyle, gündüz ürettiğiniz fazla enerjiyi depolayarak gece kullanımı ve elektrik kesintilerinde kesintisiz güç sağlıyoruz.",
    bullets: [
      "LiFePO4 batarya — uzun döngü ömrü",
      "Kesinti anında otomatik geçiş (UPS mantığı)",
      "Mobil uygulamadan üretim/tüketim takibi",
    ],
    audience: "Kesintisiz enerji ihtiyacı olan konut ve işletmeler",
  },
  {
    slug: "hobi-bahcesi",
    eyebrow: "Hobi Bahçesi",
    title: "Hobi Bahçeleri Sistemleri",
    summary:
      "Şehir dışındaki hobi bahçenizde elektrik ve su ihtiyacını güneşle karşılayın.",
    description:
      "Hobi bahçelerinde aydınlatma, küçük ev aletleri ve sulama ihtiyacını karşılayan, bütçeye uygun, kolay taşınabilir ve genişletilebilir sistemler kuruyoruz.",
    bullets: [
      "Bütçeye uygun başlangıç paketleri",
      "İhtiyaca göre sonradan genişletilebilir tasarım",
      "Aydınlatma + küçük pompa + priz çözümleri",
    ],
    audience: "Hobi bahçesi sahipleri",
  },
  {
    slug: "karavan-sistemleri",
    eyebrow: "Mobil",
    title: "Karavan Sistemleri",
    summary:
      "Yolda da şebekeden bağımsız enerji: karavanınıza özel esnek panel ve batarya çözümleri.",
    description:
      "Karavanın çatı yapısına uygun esnek/sert panel seçenekleri, lityum batarya ve inverter ile yolda kesintisiz enerji sağlıyoruz.",
    bullets: [
      "Karavan çatısına özel esnek panel seçenekleri",
      "Kompakt lityum batarya paketleri",
      "Kurulum sonrası uzaktan teknik destek",
    ],
    audience: "Karavan sahipleri",
  },
  {
    slug: "malzeme-tedarik-toptan-perakende",
    eyebrow: "Tedarik",
    title: "Malzeme Tedariği, Toptan & Perakende Satış",
    summary:
      "Panel, inverter, batarya ve bağlantı ekipmanlarında toptan/perakende tedarik.",
    description:
      "Sektördeki tedarikçi ağımızla panel, inverter, batarya, kablo ve montaj ekipmanlarını hem bireysel hem toplu projeler için toptan ve perakende temin ediyoruz.",
    bullets: [
      "Güncel stok ve fiyat listesi için iletişime geçin",
      "Toplu alımlarda proje bazlı fiyatlandırma",
      "Orijinal ürün ve garanti belgesi",
    ],
    audience: "Bayiler, kurumlar ve bireysel alıcılar",
  },
  {
    slug: "distributorluk-bayilik",
    eyebrow: "İş Ortaklığı",
    title: "Distribütörlük ve Bayilik Sistemleri",
    summary:
      "Bölgenizde Aktürk Enerji güvencesiyle iş ortaklığı kurun.",
    description:
      "Şehrinizde solar sektöründe büyümek isteyen firmalara distribütörlük ve bayilik modelleriyle malzeme tedariği, teknik eğitim ve satış sonrası destek sağlıyoruz.",
    bullets: [
      "Bölgesel bayilik/distribütörlük görüşmeleri",
      "Teknik eğitim ve saha desteği",
      "Ortak pazarlama materyalleri",
    ],
    audience: "İş ortaklığı kurmak isteyen firmalar",
  },
  {
    slug: "projelendirme-muhendislik-basvuru",
    eyebrow: "Mühendislik",
    title: "Projelendirme, Mühendislik ve Başvuru İşlemleri",
    summary:
      "EDAŞ başvurusundan elektrik projesine, sisteminizin kağıt üzerindeki tüm süreci bizde.",
    description:
      "Statik hesap, tek hat şeması, elektrik projesi çizimi, EDAŞ bağlantı anlaşması ve lisanssız üretim başvurusu dahil tüm mevzuat süreçlerini sizin adınıza yürütüyoruz.",
    bullets: [
      "Tek hat şeması ve elektrik proje çizimi",
      "EDAŞ / lisanssız üretim başvuru takibi",
      "Savunma sanayi ve telekomünikasyon projelerinde saha tecrübesi",
    ],
    audience: "Bireysel ve kurumsal başvuru sahipleri",
  },
];

export type Reference = {
  slug: string;
  title: string;
  category: string;
  location: string;
  capacity: string; // e.g. "24,6 kWp"
  year: string;
  summary: string;
  image?: string;
};

// [PLACEHOLDER] Aşağıdaki referanslar örnek amaçlıdır.
// Gerçek proje adı, konum, kapasite, yıl ve fotoğraflarınızı gönderdiğinizde
// bu listeyi gerçek referanslarınızla değiştireceğiz.
export const references: Reference[] = [
  {
    slug: "referans-1",
    title: "[PLACEHOLDER] Villa Çatı GES Projesi",
    category: "Villa",
    location: "Çankaya, Ankara",
    capacity: "10 kWp",
    year: "2024",
    summary: "Müstakil villa çatısına kurulan, yıllık tüketimin tamamına yakınını karşılayan sistem.",
  },
  {
    slug: "referans-2",
    title: "[PLACEHOLDER] Toplu Konut Projesi",
    category: "Müteahhit",
    location: "Etimesgut, Ankara",
    capacity: "180 kWp",
    year: "2023",
    summary: "Müteahhit firmayla ortak yürütülen, 40 konutluk sitede blok bazlı kurulum.",
  },
  {
    slug: "referans-3",
    title: "[PLACEHOLDER] Tarımsal Sulama Sistemi",
    category: "Tarım",
    location: "Polatlı, Ankara",
    capacity: "15 kWp",
    year: "2023",
    summary: "Şebeke bağlantısı olmayan arazide güneş destekli dalgıç pompa sistemi.",
  },
  {
    slug: "referans-4",
    title: "[PLACEHOLDER] Hobi Bahçesi Elektrifikasyonu",
    category: "Hobi Bahçesi",
    location: "Gölbaşı, Ankara",
    capacity: "3 kWp",
    year: "2024",
    summary: "Aydınlatma, sulama pompası ve priz ihtiyacını karşılayan kompakt sistem.",
  },
  {
    slug: "referans-5",
    title: "[PLACEHOLDER] Telekomünikasyon Saha İstasyonu",
    category: "Telekomünikasyon",
    location: "Ankara",
    capacity: "8 kWp",
    year: "2022",
    summary: "Şebekeden bağımsız çalışan iletişim istasyonu için hibrit güneş/batarya sistemi.",
  },
  {
    slug: "referans-6",
    title: "[PLACEHOLDER] Karavan Enerji Sistemi",
    category: "Karavan",
    location: "Ankara",
    capacity: "1,2 kWp",
    year: "2024",
    summary: "Esnek panel ve lityum batarya ile yolda kesintisiz enerji.",
  },
];

export type Testimonial = {
  name: string;
  role: string;
  quote: string;
};

// [PLACEHOLDER] Gerçek müşteri yorumlarınızla değiştirin.
export const testimonials: Testimonial[] = [
  {
    name: "[PLACEHOLDER] Müşteri Adı",
    role: "Villa Sahibi, Çankaya",
    quote:
      "Keşiften kuruluma kadar her aşamada bilgilendirildik, süreç söz verilen tarihte tamamlandı.",
  },
  {
    name: "[PLACEHOLDER] Müşteri Adı",
    role: "Proje Müdürü, İnşaat Firması",
    quote:
      "Blok bazlı kurulum takvimine tam uyum sağladılar, teslim tarihimizi aksatmadılar.",
  },
  {
    name: "[PLACEHOLDER] Müşteri Adı",
    role: "İşletme Sahibi, Polatlı",
    quote:
      "Şebeke olmayan arazimizde sulama artık güneşle çalışıyor, yakıt maliyetimiz sıfırlandı.",
  },
];

export const stats = [
  { label: "Sektörde deneyim", value: "2016'dan beri" },
  { label: "Tamamlanan proje", value: "500+" }, // [PLACEHOLDER] gerçek sayı ile değiştirin
  { label: "Hizmet bölgesi", value: "Ankara & Türkiye geneli" },
  { label: "Kurulu güç", value: "10+ MWp" }, // [PLACEHOLDER] gerçek sayı ile değiştirin
];
