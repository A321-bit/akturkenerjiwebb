import {
  BadgeCheck,
  BatteryCharging,
  Briefcase,
  Building2,
  CalendarCheck,
  Car,
  Check,
  Expand,
  FileCheck2,
  FileX,
  Flame,
  Fuel,
  Gauge,
  GraduationCap,
  Handshake,
  HardHat,
  Headset,
  Landmark,
  Lightbulb,
  LifeBuoy,
  Map,
  Moon,
  Percent,
  PlugZap,
  RadioTower,
  Route,
  ShieldCheck,
  Smartphone,
  Snowflake,
  Sprout,
  TrendingUp,
  Truck,
  Wind,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { Service } from "./data";

// Hizmet detay sayfalarının satış odaklı içeriği (hero, faydalar, tablo, SSS...).
// Hizmetin çekirdek verisi (başlık, açıklama, görsel, maddeler) Supabase'de durur
// ve admin panelden düzenlenir; buradaki pazarlama metinleri ise kod tarafında
// tutulur. Admin panelden eklenen yeni bir hizmetin slug'ı bu haritada yoksa
// sayfa, buildFallbackContent ile çekirdek veriden genel bir içerik üretir.

export type ServiceContent = {
  hero: { headline: string; sub: string };
  benefits: { icon: LucideIcon; title: string; text: string }[];
  table?: {
    title: string;
    columns: [string, string, string];
    rows: [string, string, string][];
    note: string;
  };
  steps: { title: string; text: string }[];
  faqs: { q: string; a: string }[];
  closing: { title: string; text: string };
  referenceCategories: string[];
  /** Kurulum içermeyen hizmetlerde (tedarik, bayilik, sadece mühendislik/başvuru)
   * "Anahtar Teslim Kurulum Hizmeti" rozetini gizlemek için false yapılır. */
  turnkeyInstall?: boolean;
  /** Arama niyetine göre yazılmış, meta title/description'da kullanılan
   * ek anahtar kelimeler (service.title/eyebrow'a ek olarak eklenir). */
  seoKeywords?: string[];
  /** blog_posts.category ile eşleşen etiket — "İlgili Yazılar" bölümünü besler. */
  blogCategory?: string;
  /** "İlginizi çekebilir" bölümünde rastgele değil, kürasyonlu hizmetler göstermek için slug listesi. */
  relatedServiceSlugs?: string[];
};

const INSTALL_STEPS: ServiceContent["steps"] = [
  { title: "Ücretsiz Keşif", text: "Sahanızı yerinde inceliyor, faturanızı ve tüketiminizi analiz ediyoruz." },
  { title: "Proje & EDAŞ Başvurusu", text: "Statik rapor, elektrik projesi ve tüm başvuru sürecini biz yürütüyoruz." },
  { title: "Kurulum", text: "Planlanan tarihte, kendi ekibimizle, söz verilen sürede kuruyoruz." },
  { title: "Devreye Alma", text: "Testleri yapıyor, mobil takibi kurup sistemi çalışır halde teslim ediyoruz." },
  { title: "Garanti & Takip", text: "Kurulum sonrası da yanınızdayız: garanti, bakım ve uzaktan destek." },
];

const OFFGRID_STEPS: ServiceContent["steps"] = [
  { title: "İhtiyaç Analizi", text: "Neleri çalıştırmak istediğinizi konuşuyor, tüketimi birlikte çıkarıyoruz." },
  { title: "Sistem Tasarımı", text: "Panel, batarya ve invertörü ihtiyacınıza göre boyutlandırıyoruz." },
  { title: "Kurulum", text: "Çoğu sistemi 1-2 gün içinde kurup çalışır halde bırakıyoruz." },
  { title: "Teslim & Eğitim", text: "Kullanımı yerinde gösteriyor, mobil takibi telefonunuza kuruyoruz." },
  { title: "Uzaktan Destek", text: "Sonrasında bir sorunuz olursa uzaktan destekle yanınızdayız." },
];

export const serviceContent: Record<string, ServiceContent> = {
  "villa-cati-ges": {
    hero: {
      headline: "Elektrik faturası derdine son.",
      sub: "Villanızın çatısına özel projelendirilmiş güneş enerjisi sistemiyle faturanızı sıfıra yaklaştırın: elektrikli aracınızı güneşten şarj edin, ısı pompanızla tasarrufu katlayın, depolamalı sistemle elektrik kesintisini unutun.",
    },
    benefits: [
      {
        icon: Car,
        title: "Aracınızı güneşten şarj edin",
        text: "Gündüz üretilen fazla enerji elektrikli aracınızın şarjına gider — kilometre başına yakıt maliyetiniz sıfıra yaklaşır.",
      },
      {
        icon: Flame,
        title: "Isı pompasıyla katlanan tasarruf",
        text: "Isı pompanızı güneş enerjisiyle besleyin; ısınma ve soğutma gideriniz de faturayla birlikte küçülsün.",
      },
      {
        icon: BatteryCharging,
        title: "Kesintide bile elektriğiniz var",
        text: "Depolamalı sistemde kesinti anında batarya otomatik devreye girer — buzdolabı, internet ve aydınlatma durmaz.",
      },
      {
        icon: TrendingUp,
        title: "Villanızın değeri artar",
        text: "Güneş enerjili bir villa satışta ve kiralamada öne çıkar; sistem, eve kalıcı değer olarak yansır.",
      },
    ],
    table: {
      title: "Yatırımınız ne zaman kendini öder?",
      columns: ["Sistem", "Tahmini geri ödeme", "Karşılanan tüketim"],
      rows: [
        ["5-8 kWp (standart villa)", "5-8 yıl", "Yıllık tüketimin büyük bölümü"],
        ["10-15 kWp (araç şarjı + ısı pompası)", "6-9 yıl", "Tüketimin tamamına yakını"],
        ["Depolamalı sistem (+batarya)", "7-10 yıl", "Gece dahil kesintisiz kullanım"],
      ],
      note: "Aralıklar Ankara güneşlenme ortalamasına göre tahminidir; kesin rakamlar ücretsiz keşif sonrası çatınıza ve faturanıza göre netleşir.",
    },
    steps: INSTALL_STEPS,
    faqs: [
      {
        q: "Çatım güneş enerjisine uygun mu?",
        a: "Kiremit, sac ve düz teras çatıların büyük bölümü uygundur. Keşifte çatınızın yönünü, eğimini ve gölgelenme durumunu ölçüyor, statik taşıma kapasitesini kontrol ediyoruz — uygun değilse zorlamıyoruz, açıkça söylüyoruz.",
      },
      {
        q: "Sistem kaç yılda kendini amorti eder?",
        a: "Tüketiminize ve sistem boyutuna göre genellikle 5-9 yıl aralığında. Elektrikli araç ve ısı pompası kullanıyorsanız tasarruf büyüdüğü için süre kısalır. Panellerin ömrü 25 yılın üzerinde — amorti sonrası üretim tamamen kârdır.",
      },
      {
        q: "Elektrik kesildiğinde ne olur?",
        a: "Standart şebeke bağlantılı sistem, güvenlik gereği kesintide durur. Depolamalı (bataryalı) sistem tercih ederseniz kesinti anında otomatik olarak bataryaya geçilir, eviniz elektriksiz kalmaz.",
      },
      {
        q: "Bakım masrafı var mı?",
        a: "Hareketli parça yok; yılda bir görsel kontrol ve panel temizliği yeterli. Üretimi mobil uygulamadan izlediğiniz için olağan dışı bir düşüş zaten hemen fark edilir.",
      },
      {
        q: "İzin ve EDAŞ süreci uğraştırır mı?",
        a: "Sizi hiç uğraştırmaz — statik rapor, elektrik projesi ve EDAŞ bağlantı anlaşması dahil tüm bürokrasiyi biz yürütüyoruz. Size sadece keşif randevusu vermek kalıyor.",
      },
      {
        q: "Mahsuplaşma sürecine girmeden hibrit batarya sistemi kurabilir miyim?",
        a: "Evet — hibrit lityum batarya sistemleri şebeke bağlantılı (on-grid, mahsuplaşmalı) olarak kurulabildiği gibi, EDAŞ mahsuplaşma sürecine hiç girmeden de kurulabilir. İkinci seçenekte enerjinizi tamamen kendi bataryanızda depolar, villanızı büyük ölçüde bağımsız hale getirirsiniz.",
      },
      {
        q: "On-grid villa sisteminde maksimum kaç kW kurabilirim?",
        a: "Villa çatı GES paketlerimizi on-grid (şebeke bağlantılı) olarak 25 kW'a kadar kuruyoruz. Kesin üst sınır çatı alanınıza, bağlantı anlaşmanıza ve EDAŞ onayına göre netleşir.",
      },
    ],
    closing: {
      title: "Villanız için ücretsiz keşif planlayalım",
      text: "Çatınızı görelim, faturanızı inceleyelim; size özel sistem boyutunu ve net teklifi hızlıca önünüze koyalım.",
    },
    referenceCategories: ["Villa"],
    seoKeywords: ["villa çatı güneş paneli fiyatları", "villa GES kaç kWp", "villa çatısına güneş enerjisi kurulumu Ankara"],
    blogCategory: "Villa GES",
    relatedServiceSlugs: ["isi-pompasi-entegrasyonu", "lityum-batarya-depolama", "elektrikli-arac-sarj-istasyonu"],
  },

  "isi-pompasi-entegrasyonu": {
    hero: {
      headline: "Isınma ve soğutmayı tek cihazla, güneşten besleyerek çözün.",
      sub: "Hava kaynaklı ısı pompasını mevcut ya da yeni kurulacak güneş enerjisi sisteminize entegre ediyoruz — kışın ısıtma, yazın soğutma giderinizi doğalgaza kıyasla belirgin şekilde düşürüyoruz.",
    },
    benefits: [
      {
        icon: Flame,
        title: "Isınma ve soğutmayı tek cihazla çözün",
        text: "Hava kaynaklı ısı pompası kışın ısıtma, yazın soğutma sağlar — iki ayrı sistem kurma masrafından kurtulursunuz.",
      },
      {
        icon: Snowflake,
        title: "Doğalgaza göre çok daha verimli",
        text: "1 birim elektrikle 3-4 birim ısı enerjisi üretir; doğalgaz ve elektrikli ısıtıcılara kıyasla işletme maliyeti belirgin şekilde düşer.",
      },
      {
        icon: Zap,
        title: "Güneş enerjinizle besleyin",
        text: "Mevcut ya da yeni kurulacak GES sisteminize entegre ederek ısınma-soğutma maliyetinizi neredeyse sıfıra indirin.",
      },
      {
        icon: TrendingUp,
        title: "Konutunuzun değerini artırır",
        text: "Enerji verimli ısıtma-soğutma sistemi, villanın enerji kimlik belgesini ve yeniden satış değerini olumlu etkiler.",
      },
    ],
    table: {
      title: "Konut büyüklüğüne göre kapasite",
      columns: ["Konut büyüklüğü", "Tipik ısı pompası kapasitesi", "Tahmini yıllık tasarruf"],
      rows: [
        ["100-150 m²", "8-12 kW", "Doğalgaza göre %40-60"],
        ["150-250 m²", "12-16 kW", "Doğalgaza göre %40-60"],
        ["250+ m² / güneş enerjili", "16-24 kW", "GES ile birlikte %70+"],
      ],
      note: "Kesin kapasite, konutun yalıtım durumu ve keşif sonrası netleşir.",
    },
    steps: [
      { title: "Keşif & İhtiyaç Analizi", text: "Konutunuzun m², yalıtım durumu ve mevcut ısıtma sisteminizi yerinde inceliyoruz." },
      { title: "Kapasite & Cihaz Seçimi", text: "İhtiyacınıza uygun ısı pompası kapasitesini ve modelini belirliyoruz." },
      { title: "Montaj & Tesisat", text: "İç/dış ünite montajı, boru tesisatı ve elektrik bağlantısını tamamlıyoruz." },
      { title: "Güneş Enerjisi Entegrasyonu", text: "Mevcut veya yeni GES sisteminize entegre ederek işletme maliyetini düşürüyoruz (opsiyonel)." },
      { title: "Devreye Alma & Test", text: "Sistemi test edip kullanım eğitimini veriyoruz." },
    ],
    faqs: [
      {
        q: "Isı pompası hangi konut tiplerine uygun?",
        a: "Villa, müstakil ev ve doğru yalıtıma sahip her konut tipine uygulanabilir; keşifte konutunuzun uygunluğunu değerlendiriyoruz.",
      },
      {
        q: "Isı pompasını mevcut kombi/doğalgaz sistemimle birlikte kullanabilir miyim?",
        a: "Evet, hibrit kullanım mümkündür; çoğu müşterimiz geçiş döneminde iki sistemi bir arada kullanmayı tercih ediyor.",
      },
      {
        q: "Güneş enerjisi sistemim yoksa yine de ısı pompası kurdurabilir miyim?",
        a: "Evet, ısı pompası bağımsız olarak da kurulabilir; sadece elektrik şebekesinden beslenerek yine doğalgaza göre yüksek verimle çalışır.",
      },
      {
        q: "Kışın çok soğuk günlerde performansı düşer mi?",
        a: "Modern hava kaynaklı ısı pompaları -15°C ile -20°C'ye kadar verimli çalışacak şekilde üretiliyor; Ankara iklimi için uygun kapasiteyi keşifte belirliyoruz.",
      },
      {
        q: "Yaz aylarında soğutma için de kullanılabilir mi?",
        a: "Evet, ısı pompaları kışın ısıtma yazın soğutma sağlayan tersinir (reversible) sistemlerdir — klima ihtiyacınızı da karşılar.",
      },
    ],
    closing: {
      title: "Isı pompanız için keşif planlayalım",
      text: "Konutunuzu ve mevcut ısıtma sisteminizi görelim; size en uygun kapasiteyi ve net teklifi hızlıca sunalım.",
    },
    referenceCategories: ["Villa"],
    seoKeywords: ["ısı pompası kurulumu Ankara", "hava kaynaklı ısı pompası fiyatları", "güneş enerjili ısı pompası", "villa ısı pompası"],
    blogCategory: "Isı Pompası",
    relatedServiceSlugs: ["villa-cati-ges", "lityum-batarya-depolama", "elektrikli-arac-sarj-istasyonu"],
  },

  "muteahhit-ges": {
    hero: {
      headline: "Projenize güneş enerjisi ekleyin — teslim tarihinizi riske atmadan.",
      sub: "Site ve toplu konut projelerinde GES artık güçlü bir satış argümanı. Ön mühendislikten blok bazlı kurulum takvimine kadar tek muhatapla çalışın; “güneş enerjili site” etiketiyle projeniz rakiplerinden ayrışsın.",
    },
    benefits: [
      {
        icon: CalendarCheck,
        title: "Teslim tarihiniz aksamaz",
        text: "Kurulumu inşaat takviminize göre blok/etap bazlı planlıyoruz — GES yüzünden tek gün gecikme yaşamazsınız.",
      },
      {
        icon: Percent,
        title: "Toplu alım fiyat avantajı",
        text: "Panel, invertör ve montaj ekipmanını proje ölçeğinde tedarik ediyoruz; birim maliyet bireysel alımın belirgin altında kalır.",
      },
      {
        icon: FileCheck2,
        title: "Bürokrasi tamamen bizde",
        text: "Blok bazlı elektrik yükü hesabı, projelendirme ve EDAŞ başvuru stratejisi dahil tüm evrak süreci tek elden yürür.",
      },
      {
        icon: Building2,
        title: "Satışta güçlü argüman",
        text: "“Ortak alan elektriği güneşten” vaadi konut alıcısı için somut fark yaratır — pazarlamanıza doğrudan malzeme.",
      },
    ],
    table: {
      title: "Proje ölçeğine göre süreç",
      columns: ["Proje ölçeği", "Kurulum takvimi", "Çalışma modeli"],
      rows: [
        ["Tek blok / butik proje", "Etap başına haftalar mertebesi", "Anahtar teslim kurulum"],
        ["Çok bloklu site", "Blok bazlı kademeli takvim", "İnşaat programına entegre"],
        ["Sürekli iş birliği", "Proje bazlı planlama", "Bayilik / çözüm ortaklığı"],
      ],
      note: "Takvim; sahanın hazırlık durumuna ve EDAŞ onay sürelerine göre keşif sonrası netleşir.",
    },
    steps: [
      { title: "Ön Fizibilite", text: "Vaziyet planı üzerinden blok bazlı yük hesabı ve sistem önerisi çıkarıyoruz." },
      { title: "Proje Entegrasyonu", text: "Elektrik altyapı planını inşaat projenize entegre ediyor, EDAŞ stratejisini kuruyoruz." },
      { title: "Blok Bazlı Kurulum", text: "Çatısı biten bloktan başlayarak şantiye takviminize paralel ilerliyoruz." },
      { title: "Kabul & Devreye Alma", text: "Testler, EDAŞ kabulü ve devreye alma blok blok tamamlanır." },
      { title: "Sürekli Destek", text: "Site yönetimine teslim sonrası izleme ve bakım desteği veriyoruz." },
    ],
    faqs: [
      {
        q: "İnşaat devam ederken kurulum yapılabilir mi?",
        a: "Evet — en verimli model de bu. Çatı imalatı biten bloklarda kuruluma başlıyor, kaba inşaatı süren bloklarda altyapıyı hazırlıyoruz; şantiye düzeninize göre koordine oluyoruz.",
      },
      {
        q: "EDAŞ başvurularını kim yürütüyor?",
        a: "Tamamını biz. Blok bazlı başvuru stratejisini proje aşamasında kuruyoruz ki onay süreçleri iskân ve teslim takviminize engel olmasın.",
      },
      {
        q: "Ortak alanlar için mi, daire bazlı mı kuruluyor?",
        a: "İkisi de mümkün. Çoğu projede asansör, aydınlatma ve hidrofor gibi ortak alan tüketimi için kuruluyor; talebe göre daire bazlı sistem de tasarlıyoruz.",
      },
      {
        q: "Ödeme ve sözleşme modeli nasıl işliyor?",
        a: "Proje ölçeğine göre hakediş bazlı ilerliyoruz. Malzeme ve işçilik kalemleri şeffaf ayrıştırılır; toplu alım avantajı sözleşmeye açıkça yansır.",
      },
    ],
    closing: {
      title: "Projenizi birlikte planlayalım",
      text: "Vaziyet planınızı paylaşın; blok bazlı ön fizibiliteyi ve takvim önerisini ücretsiz hazırlayalım.",
    },
    referenceCategories: ["Müteahhit"],
    seoKeywords: ["toplu konut güneş enerjisi sistemi", "site GES kurulumu", "müteahhit firmalarla güneş paneli iş birliği"],
    blogCategory: "Müteahhit GES",
    relatedServiceSlugs: ["fabrika-cati-ges", "projelendirme-muhendislik-basvuru", "taahhut-isletme-bakim"],
  },

  "tarimsal-sulama": {
    hero: {
      headline: "Mazot parası bitmez — güneş her gün doğar.",
      sub: "Elektrik hattı olmayan arazinizde kuyunuzu güneşe bağlayın: dizel jeneratör masrafı sıfırlansın; sulama sezonu boyunca yakıt derdi, hat çekme yatırımı ve fatura olmadan üretin.",
    },
    benefits: [
      {
        icon: Fuel,
        title: "Mazot ve jeneratör masrafı sıfır",
        text: "Pompanız güneşten çalışır; sezon boyunca yakıt almazsınız, jeneratör bakımıyla uğraşmazsınız.",
      },
      {
        icon: PlugZap,
        title: "Elektrik hattı beklemeyin",
        text: "Şebekenin gelmediği arazide hat çekme yatırımına ve trafo derdine gerek kalmaz — sistem tamamen bağımsız çalışır.",
      },
      {
        icon: Wrench,
        title: "Bakımı yok denecek kadar az",
        text: "Hareketli parça minimumda, paneller 25+ yıl ömürlü. Sezonluk kontrol dışında masraf çıkarmaz.",
      },
      {
        icon: Sprout,
        title: "Hibe ve destek danışmanlığı",
        text: "Tarımsal destek ve hibe başvurularında evrak ve süreç danışmanlığını biz sağlıyoruz.",
      },
    ],
    table: {
      title: "Kuyunuza göre sistem",
      columns: ["Kuyu / debi ihtiyacı", "Tipik sistem aralığı", "Tahmini geri ödeme"],
      rows: [
        ["Sığ kuyu, küçük parsel", "3-7 kWp", "2-4 sulama sezonu"],
        ["Orta derinlik, orta debi", "7-15 kWp", "3-5 sulama sezonu"],
        ["Derin kuyu, yüksek debi", "15-30+ kWp", "3-6 sulama sezonu"],
      ],
      note: "Aralıklar dizel maliyetine kıyasla tahminidir; kesin boyutlandırma kuyu derinliği ve debi ölçümü sonrası yapılır.",
    },
    steps: [
      { title: "Keşif & Debi Ölçümü", text: "Arazinizi görüyor, kuyu derinliği ve su ihtiyacını yerinde ölçüyoruz." },
      { title: "Sistem Tasarımı", text: "Pompa gücünü ve panel sayısını debiye göre birlikte hesaplıyoruz." },
      { title: "Kurulum", text: "Panel sehpası, pompa ve kontrol ünitesi kısa sürede sahada kurulur." },
      { title: "Devreye Alma", text: "Sulama hattınıza bağlayıp basınç ve debi testleriyle teslim ediyoruz." },
      { title: "Sezon Takibi", text: "İlk sezon boyunca performansı birlikte izliyor, gerekirse ince ayar yapıyoruz." },
    ],
    faqs: [
      {
        q: "Kuyum çok derin, güneşle çalışır mı?",
        a: "Çoğu durumda evet. Derinlik ve debiye göre pompa gücünü ve panel sayısını birlikte hesaplıyoruz; derin kuyular için yüksek voltajlı dalgıç pompa çözümlerimiz mevcut.",
      },
      {
        q: "Bulutlu günde sulama durur mu?",
        a: "Üretim azalır ama durmaz. İhtiyaca göre su deposu entegrasyonuyla güneşli saatlerde suyu depolar, istediğiniz an sularsınız.",
      },
      {
        q: "Damla sulama sistemime entegre olur mu?",
        a: "Evet — pompa kontrol ünitesi mevcut damla/yağmurlama hattınıza bağlanır ve basınç ihtiyacına göre ayarlanır.",
      },
      {
        q: "Kışın panellere bir şey olur mu?",
        a: "Hayır; paneller dolu ve kar yüküne dayanıklılık sertifikalarıyla gelir. İsterseniz sezon dışında sökülebilen taşınabilir kurulum da yapıyoruz.",
      },
    ],
    closing: {
      title: "Kuyunuz için ücretsiz keşif",
      text: "Arazinizi görelim, debinizi ölçelim; mazot masrafınızla karşılaştırmalı net tabloyu önünüze koyalım.",
    },
    referenceCategories: ["Tarım"],
    seoKeywords: ["tarımsal sulama güneş enerjisi sistemi", "güneş enerjili su pompası fiyatları", "şebekesiz arazide sulama sistemi"],
    blogCategory: "Tarımsal Sulama",
    relatedServiceSlugs: ["off-grid-sebekeden-bagimsiz", "ruzgar-hibrit", "malzeme-tedarik-toptan-perakende"],
  },

  "ruzgar-hibrit": {
    hero: {
      headline: "Güneş battığında üretiminiz durmasın.",
      sub: "Rüzgar türbini ile güneş panelini tek sistemde birleştirin: gündüz güneşten, gece ve bulutlu havada rüzgardan üretin. Şebekeden tamamen bağımsız tesisler için en güvenilir kombinasyon.",
    },
    benefits: [
      {
        icon: Wind,
        title: "7/24 üretim potansiyeli",
        text: "Güneşin olmadığı saatlerde rüzgar devreye girer; iki kaynak birbirinin açığını kapatır.",
      },
      {
        icon: BatteryCharging,
        title: "Depolamayla tam bağımsızlık",
        text: "Fazla üretim bataryada birikir; şebekesiz tesisinizde gece gündüz kesintisiz enerji.",
      },
      {
        icon: RadioTower,
        title: "Uzak tesisler için ideal",
        text: "Telekom istasyonu, dağ evi, çiftlik — şebekenin ulaşmadığı her noktada kendi santralınız.",
      },
      {
        icon: Gauge,
        title: "Tek sistem, tek takip",
        text: "Hibrit invertör iki kaynağı tek hatta toplar; üretimin tamamını tek uygulamadan izlersiniz.",
      },
    ],
    table: {
      title: "Kullanım senaryoları",
      columns: ["Senaryo", "Tipik kombinasyon", "Öncelik"],
      rows: [
        ["Bağ evi / dağ evi", "Panel + küçük türbin + batarya", "Tam off-grid konfor"],
        ["Çiftlik / üretim tesisi", "Panel ağırlıklı + türbin destekli", "Gündüz yüküne göre güneş öncelikli"],
        ["Telekom / kritik altyapı", "Hibrit + yedekli batarya", "Kesintisizlik her şeyden önce"],
      ],
      note: "Doğru kombinasyon, bölgenizin rüzgar ve güneş verilerine göre keşifte belirlenir.",
    },
    steps: [
      { title: "Veri Analizi", text: "Bölgenizin rüzgar ve güneş ışınım verilerini birlikte analiz ediyoruz." },
      { title: "Sistem Tasarımı", text: "Panel ve türbin kapasitesini dengeli şekilde boyutlandırıyoruz." },
      { title: "Kurulum", text: "Türbin direği, paneller ve hibrit invertör sahada kurulur." },
      { title: "Devreye Alma", text: "İki kaynak tek hatta toplanır, testlerle çalışır halde teslim edilir." },
      { title: "Bakım & Takip", text: "Türbin için periyodik bakım planı sunuyor, üretimi uzaktan izliyoruz." },
    ],
    faqs: [
      {
        q: "Bölgemde rüzgar yeterli mi bilmiyorum.",
        a: "Keşif öncesinde bölgenizin rüzgar ve ışınım verilerini analiz ediyoruz; rüzgar zayıfsa bunu dürüstçe söyler, güneş + batarya ağırlıklı bir kurgu öneririz.",
      },
      {
        q: "Türbin gürültü yapar mı?",
        a: "Küçük ölçekli modern türbinler düşük devirde sessize yakın çalışır; konut yakınındaki kurulumlarda mesafe ve model seçimiyle konfor korunur.",
      },
      {
        q: "Bakım ihtiyacı nasıl?",
        a: "Panel tarafı minimum bakımla çalışır; türbinde periyodik mekanik kontrol gerekir. Yıllık bakım planını kurulumla birlikte sunuyoruz.",
      },
    ],
    closing: {
      title: "Tesisiniz için hibrit fizibilite",
      text: "Konumunuzu paylaşın; rüzgar-güneş verisine dayalı ön fizibiliteyi ücretsiz çıkaralım.",
    },
    referenceCategories: ["Telekomünikasyon"],
    seoKeywords: ["rüzgar güneş hibrit enerji sistemi", "hibrit invertör kurulumu", "şebekeden bağımsız hibrit enerji"],
    blogCategory: "Rüzgar & Hibrit",
    relatedServiceSlugs: ["lityum-batarya-depolama", "off-grid-sebekeden-bagimsiz", "tarimsal-sulama"],
  },

  "lityum-batarya-depolama": {
    hero: {
      headline: "Elektrik kesildiğinde eviniz karanlıkta kalmasın.",
      sub: "LiFePO4 batarya sistemiyle gündüz ürettiğinizi gece kullanın; kesinti anında sistem otomatik devreye girsin — buzdolabı, kombi ve internet hiç durmasın.",
    },
    benefits: [
      {
        icon: Zap,
        title: "Kesintide otomatik geçiş",
        text: "UPS mantığıyla milisaniyeler içinde bataryaya geçilir; kesintiyi çoğu zaman fark etmezsiniz bile.",
      },
      {
        icon: Moon,
        title: "Güneşinizi gece de kullanın",
        text: "Gündüz üretilen fazla enerji şebekeye gitmek yerine bataryanızda birikir; akşam tüketiminizi kendi enerjinizle karşılarsınız.",
      },
      {
        icon: ShieldCheck,
        title: "LiFePO4: uzun ömür, yüksek güvenlik",
        text: "Binlerce şarj döngüsü ömrü ve termal kararlılığıyla ev kullanımı için en güvenli lityum kimyası.",
      },
      {
        icon: Smartphone,
        title: "Cebinizden takip",
        text: "Doluluk oranını, üretimi ve tüketimi mobil uygulamadan anlık izleyin.",
      },
    ],
    table: {
      title: "Batarya kapasitesi rehberi",
      columns: ["Kapasite", "Neyi karşılar", "Tipik kullanım"],
      rows: [
        ["5-10 kWh", "Aydınlatma, buzdolabı, internet, TV", "Kesinti yedeği"],
        ["10-20 kWh", "Evin akşam tüketiminin çoğu", "Gece öz tüketim + yedek"],
        ["20+ kWh", "Yoğun tüketim, ısı pompası desteği", "Şebekeden maksimum bağımsızlık"],
      ],
      note: "Doğru kapasite, günlük tüketim profilinize göre keşifte hesaplanır.",
    },
    steps: [
      { title: "Ücretsiz Keşif", text: "Tüketim profilinizi ve kesinti ihtiyacınızı yerinde inceliyoruz." },
      { title: "Kapasite Hesabı", text: "Kritik yüklerinize göre batarya ve invertör kapasitesini belirliyoruz." },
      { title: "Kurulum", text: "Batarya, BMS ve hibrit invertör düzenli bir panoda kurulur." },
      { title: "Devreye Alma", text: "Kesinti senaryosu test edilir, mobil takip telefonunuza kurulur." },
      { title: "Garanti & Takip", text: "Batarya sağlığını uzaktan izliyor, garanti sürecini biz yönetiyoruz." },
    ],
    faqs: [
      {
        q: "Kesintide kaç saat idare eder?",
        a: "Kapasiteye ve neyi çalıştırdığınıza bağlı: buzdolabı, aydınlatma ve internet gibi kritik yükler için 10 kWh mertebesinde bir batarya genellikle uzun saatler yeter. Keşifte ihtiyacınıza göre net hesaplıyoruz.",
      },
      {
        q: "Mevcut güneş sistemime batarya eklenebilir mi?",
        a: "Çoğu durumda evet. İnvertörünüzün modeline göre hibrit dönüşüm veya ek şarj ünitesiyle mevcut sisteminize entegre ediyoruz.",
      },
      {
        q: "Batarya kaç yıl kullanılır?",
        a: "LiFePO4 hücreler binlerce şarj döngüsü ömürlüdür; günlük kullanımda 10 yıl mertebesinde performans korunur ve üretici garantileri de bunu destekler.",
      },
      {
        q: "Evde lityum batarya güvenli mi?",
        a: "LiFePO4 kimyası, telefonlarda kullanılan hücrelere göre çok daha kararlıdır; BMS koruması, doğru sigortalama ve standartlara uygun montajla ev kullanımı için güvenlidir.",
      },
    ],
    closing: {
      title: "Eviniz için depolama planı çıkaralım",
      text: "Faturanızı ve kesinti sıklığınızı konuşalım; size uygun batarya kapasitesini birlikte belirleyelim.",
    },
    referenceCategories: ["Telekomünikasyon", "Villa"],
    seoKeywords: ["lityum batarya depolama sistemi fiyatları", "güneş enerjisi batarya entegrasyonu", "kesintisiz güç için güneş bataryası"],
    blogCategory: "Batarya Depolama",
    relatedServiceSlugs: ["villa-cati-ges", "ruzgar-hibrit", "elektrikli-arac-sarj-istasyonu"],
  },

  "off-grid-sebekeden-bagimsiz": {
    hero: {
      headline: "Şebeke yoksa sorun yok — güneş her yerde var.",
      sub: "Hobi bahçenizden karavanınıza, şebekenin ulaşmadığı her noktaya kompakt ve taşınabilir güneş enerjisi sistemleri kuruyoruz — EDAŞ başvurusu ya da hat çekme derdi olmadan.",
    },
    benefits: [
      {
        icon: Lightbulb,
        title: "Hobi bahçenizde tam bağımsızlık",
        text: "Aydınlatma, su pompası ve küçük ev aletleriniz için şebeke bağlantısı çekmeden elektrik sağlıyoruz.",
      },
      {
        icon: Route,
        title: "Karavanınızda yolda enerji",
        text: "Buzdolabı, aydınlatma ve elektronik cihazlarınızı güneş olduğu sürece şarj eden kompakt sistemler kuruyoruz.",
      },
      {
        icon: FileX,
        title: "Sıfır bürokrasi",
        text: "Şebeke bağlantısı olmadığı için EDAŞ başvurusu, abonelik, sayaç ve fatura yok.",
      },
      {
        icon: Expand,
        title: "İhtiyaca göre büyüyen sistem",
        text: "Bugün aydınlatmayla başlayın; yarın buzdolabı veya batarya ekleyin — sistem modüler olarak büyür.",
      },
    ],
    table: {
      title: "Kullanım alanına göre sistem",
      columns: ["Kullanım alanı", "Tipik sistem", "Kurulum süresi"],
      rows: [
        ["Hobi bahçesi (aydınlatma + pompa)", "0,5-2 kWp + küçük batarya", "Aynı gün"],
        ["Karavan (buzdolabı + elektronik)", "200-600W esnek/sert panel", "1 gün"],
        ["Uzak tesis / kulübe", "1-5 kWp + batarya paketi", "1-3 gün"],
      ],
      note: "Sistem boyutu kullanım profilinize göre keşif ya da telefon görüşmesi sonrası netleşir.",
    },
    steps: OFFGRID_STEPS,
    faqs: [
      {
        q: "Hobi bahçemde buzdolabı çalıştırabilir miyim?",
        a: "Evet — düşük tüketimli küçük tip bir buzdolabı, doğru boyutlanmış panel ve bataryayla 7/24 çalışır. Keşifte tüketiminize göre kapasiteyi hesaplıyoruz.",
      },
      {
        q: "Karavanımda klima çalıştırabilir miyim?",
        a: "Kamp tipi düşük tüketimli klimalar doğru boyutlanmış batarya ve invertörle mümkün; standart ev kliması içinse dürüst olalım — verimli değil. Keşifte gerçekçi senaryoyu birlikte kuruyoruz.",
      },
      {
        q: "EDAŞ başvurusu gerekiyor mu?",
        a: "Hayır — sistem şebekeye bağlı olmadığı için EDAŞ başvurusu, abonelik veya bağlantı anlaşması gerekmez.",
      },
      {
        q: "Kurulum ne kadar sürer?",
        a: "Başlangıç paketleri genellikle aynı gün, karavan ve daha kapsamlı sistemler 1-3 gün içinde çalışır halde teslim edilir.",
      },
      {
        q: "Panel karavan çatısına zarar verir mi?",
        a: "Hayır — esnek paneller delme gerektirmeyen montajla uygulanır; sert panellerde ise sızdırmaz braket sistemi kullanıyoruz.",
      },
    ],
    closing: {
      title: "Bağımsız enerji ihtiyacınızı konuşalım",
      text: "Hobi bahçeniz, karavanınız ya da uzak tesisiniz için neleri çalıştırmak istediğinizi yazın; size uygun sistemi ve net fiyatı hızlıca iletelim.",
    },
    referenceCategories: ["Hobi Bahçesi", "Karavan"],
    seoKeywords: ["off grid güneş enerjisi sistemi", "karavan güneş paneli kurulumu", "hobi bahçesi güneş enerjisi sistemi"],
    blogCategory: "Off-Grid Sistemler",
    relatedServiceSlugs: ["lityum-batarya-depolama", "ruzgar-hibrit", "villa-cati-ges"],
  },

  "elektrikli-arac-sarj-istasyonu": {
    hero: {
      headline: "Aracınızı evde, güneşten şarj edin.",
      sub: "Villanıza, işletmenize ya da mevcut güneş enerjisi sisteminize entegre AC Tip 2 duvar tipi şarj istasyonu kuruyoruz — akıllı uygulamadan takip ve programlama dahil.",
    },
    benefits: [
      {
        icon: Zap,
        title: "Hızlı ve güvenli şarj",
        text: "AC Tip 2 duvar tipi istasyonlarla evde ya da işletmenizde güvenli ve hızlı şarj imkânı sunuyoruz.",
      },
      {
        icon: Car,
        title: "Güneşten şarj, sıfıra yakın maliyet",
        text: "Mevcut güneş enerjisi sisteminize entegre ederek aracınızı büyük ölçüde güneşten şarj etmenizi sağlıyoruz.",
      },
      {
        icon: Smartphone,
        title: "Akıllı uygulamadan takip",
        text: "Şarj geçmişinizi izleyebilir, güneşin en yoğun olduğu saatlere otomatik şarj planlayabilirsiniz.",
      },
      {
        icon: Building2,
        title: "Toplu kurulum ve yönetim",
        text: "Site ve işyeri otoparklarında birden fazla istasyonu ortak altyapıya bağlayarak yönetiyoruz.",
      },
    ],
    table: {
      title: "Kurulum ölçeğine göre süreç",
      columns: ["Kurulum tipi", "Kapsam", "Süre"],
      rows: [
        ["Villa / tekli ev kullanımı", "Tek AC şarj istasyonu + altyapı kontrolü", "1 gün"],
        ["İşletme / işyeri otoparkı", "Tek ya da birkaç istasyon", "1-3 gün"],
        ["Site / toplu konut", "Çoklu istasyon + ortak altyapı yönetimi", "Proje ölçeğine göre"],
      ],
      note: "Süreler mevcut elektrik altyapınızın durumuna ve istasyon sayısına göre keşif sonrası netleşir.",
    },
    steps: [
      { title: "Keşif & Altyapı Kontrolü", text: "Pano kapasitenizi, kablo kesitinizi ve araç şarj ihtiyacınızı yerinde inceliyoruz." },
      { title: "Cihaz & Kurulum Planı", text: "İhtiyacınıza uygun şarj istasyonu modelini ve kurulum noktasını belirliyoruz." },
      { title: "Elektrik Altyapı Hazırlığı", text: "Gerekiyorsa pano ve kablo güncellemesini yapıyoruz." },
      { title: "Kurulum & Devreye Alma", text: "Şarj istasyonunu monte edip test ediyor, uygulama bağlantısını kuruyoruz." },
      { title: "Güneş Entegrasyonu (opsiyonel)", text: "Mevcut GES sisteminiz varsa şarjı güneş üretiminize göre programlıyoruz." },
    ],
    faqs: [
      {
        q: "Villamda mevcut GES sistemim var, şarj istasyonunu entegre edebilir miyim?",
        a: "Evet — şarj istasyonunu mevcut sisteminize entegre ederek aracınızı büyük ölçüde güneşten şarj etmenizi sağlıyoruz.",
      },
      {
        q: "Elektrik panom şarj istasyonuna yetiyor mu?",
        a: "Keşifte pano kapasitenizi kontrol ediyoruz; yetersizse gerekli altyapı güncellemesini de biz üstleniyoruz.",
      },
      {
        q: "Sitemizde birden fazla şarj istasyonu kurabilir misiniz?",
        a: "Evet, toplu konut ve site projelerinde birden fazla üniteyi ortak altyapıya bağlayarak kuruyor ve yönetiyoruz.",
      },
      {
        q: "Şarj süresi ne kadar sürer?",
        a: "AC Tip 2 duvar tipi istasyonlarda araç ve şarj gücüne göre değişir; genellikle birkaç saat içinde tam şarj sağlanır.",
      },
    ],
    closing: {
      title: "Şarj istasyonunuzu birlikte planlayalım",
      text: "Villanız, işletmeniz veya siteniz için ihtiyacınızı anlatın; size uygun şarj istasyonu çözümünü ve teklifi hızlıca sunalım.",
    },
    referenceCategories: [],
    seoKeywords: ["elektrikli araç şarj istasyonu kurulumu", "ev tipi araç şarj cihazı fiyatları", "güneş enerjisiyle araç şarjı"],
    blogCategory: "Elektrikli Araç Şarjı",
    relatedServiceSlugs: ["villa-cati-ges", "lityum-batarya-depolama", "fabrika-cati-ges"],
  },

  "malzeme-tedarik-toptan-perakende": {
    hero: {
      headline: "Doğru malzeme, garantili ürün, rekabetçi fiyat.",
      sub: "Panel, invertör, batarya ve montaj ekipmanında orijinal ve garanti belgeli ürünleri tek noktadan tedarik edin — ister tek proje için perakende, ister bayilik ölçeğinde toptan.",
    },
    benefits: [
      {
        icon: BadgeCheck,
        title: "Orijinal ve garantili",
        text: "Her ürün üretici garanti belgesiyle teslim edilir; gri ithalat ve belgesiz ürün riski yaşamazsınız.",
      },
      {
        icon: Percent,
        title: "Toplu alımda özel fiyat",
        text: "Proje ölçeğinize göre fiyatlandırıyoruz; bayi ve müteahhit alımlarında birim maliyet belirgin düşer.",
      },
      {
        icon: Truck,
        title: "Türkiye geneli sevkiyat",
        text: "Ankara depomuzdan tüm illere sigortalı sevkiyat; proje takviminize göre teslim planlaması.",
      },
      {
        icon: Headset,
        title: "Satış öncesi teknik destek",
        text: "Hangi invertör hangi panelle uyumlu? Montaj ekibinize ücretsiz teknik danışmanlık veriyoruz.",
      },
    ],
    table: {
      title: "Ürün grupları",
      columns: ["Ürün grubu", "Kapsam", "Belgelendirme"],
      rows: [
        ["Güneş panelleri", "Mono-perc, half-cut, bifacial seçenekler", "Üretici garantili"],
        ["İnvertörler", "String, hibrit ve off-grid modeller", "Üretici garantili"],
        ["Batarya & BMS", "LiFePO4 paketler, raf tipi çözümler", "Üretici garantili"],
      ],
      note: "Stok ve fiyat listesi kur hareketlerine göre sık güncellenir — güncel liste için iletişime geçin.",
    },
    steps: [
      { title: "Talep Listesi", text: "İhtiyaç listenizi WhatsApp veya e-postayla iletin." },
      { title: "Teklif & Stok Onayı", text: "Güncel stok ve size özel fiyat teklifini aynı gün dönüyoruz." },
      { title: "Ödeme & Sevkiyat", text: "Onay sonrası ürünler paletlenir, sigortalı sevkiyat planlanır." },
      { title: "Teslimat", text: "Türkiye genelinde adresinize; Ankara içinde kendi aracımızla." },
      { title: "Satış Sonrası", text: "Garanti süreçleri ve teknik sorularınızda muhatabınız biziz." },
    ],
    faqs: [
      {
        q: "Tek panel de alabilir miyim?",
        a: "Evet, perakende satışımız var. Toptan fiyat avantajı belirli adetlerin üzerinde devreye girer; iki fiyatı da şeffaf şekilde paylaşırız.",
      },
      {
        q: "Fiyat listesi paylaşıyor musunuz?",
        a: "Evet — kur ve stok durumuna göre sık güncellendiği için güncel listeyi WhatsApp veya e-posta üzerinden anlık iletiyoruz.",
      },
      {
        q: "Kargo ve nakliye nasıl işliyor?",
        a: "Panel gibi kırılgan ürünler paletli ve sigortalı sevk edilir; Ankara içinde kendi aracımızla teslimat da yapıyoruz.",
      },
      {
        q: "Ürün seçiminde teknik yardım alabilir miyim?",
        a: "Elbette — sistem tasarımınıza göre uyumlu panel-invertör-batarya kombinasyonunu ücretsiz öneriyoruz.",
      },
    ],
    closing: {
      title: "Güncel fiyat listesini isteyin",
      text: "İhtiyaç listenizi gönderin; stok durumu ve size özel fiyat teklifini aynı gün iletelim.",
    },
    referenceCategories: [],
    turnkeyInstall: false,
    seoKeywords: ["güneş paneli toptan satış", "invertör fiyatları Ankara", "solar panel bayi fiyat listesi"],
    blogCategory: "Malzeme Tedariği",
    relatedServiceSlugs: ["distributorluk-bayilik", "villa-cati-ges", "projelendirme-muhendislik-basvuru"],
  },

  "distributorluk-bayilik": {
    hero: {
      headline: "Büyüyen solar pazarında bölgenizin markası olun.",
      sub: "Türkiye'de güneş enerjisi pazarı her yıl büyüyor. Aktürk Enerji bayilik modeliyle bu büyümeden payınızı alın: eğitim, tedarik avantajı ve saha desteği bizden — bölgenizdeki iş sizden.",
    },
    benefits: [
      {
        icon: Handshake,
        title: "Kurulu bir markayla başlayın",
        text: "2016'dan beri sahada olan bir markanın referans gücü ve kurumsal kimliğiyle müşteri karşısına çıkın.",
      },
      {
        icon: GraduationCap,
        title: "Eğitim ve saha desteği",
        text: "Keşif, projelendirme, kurulum ve satış süreçlerinde ekibinizi eğitiyoruz; ilk projelerde sahada yanınızdayız.",
      },
      {
        icon: Percent,
        title: "Öncelikli tedarik fiyatı",
        text: "Bayilere özel fiyat listesi ve stok önceliğiyle rekabetçi teklif verme gücünüz hazır.",
      },
      {
        icon: Map,
        title: "Bölgenizde güçlü konum",
        text: "Bölge bazlı iş birliği modeliyle emeğinizin karşılığını koruyun; alt bayi ağı kurma imkânıyla büyüyün.",
      },
    ],
    table: {
      title: "İş ortaklığı modelleri",
      columns: ["Model", "Kapsam", "Kimin için"],
      rows: [
        ["Bayilik", "Satış + kurulum; eğitim ve marka desteği", "Bölgesinde büyümek isteyen firmalar"],
        ["Distribütörlük", "Geniş bölgede dağıtım + alt bayi ağı", "Dağıtım altyapısı olan firmalar"],
        ["Çözüm ortaklığı", "Proje bazlı iş birliği", "Elektrik ve inşaat firmaları"],
      ],
      note: "Koşullar görüşmede netleşir; bölgenizin durumuna göre en uygun modeli birlikte seçeriz.",
    },
    steps: [
      { title: "Tanışma Görüşmesi", text: "Firmanızı, bölgenizi ve hedeflerinizi dinliyoruz." },
      { title: "Model & Sözleşme", text: "Size uygun iş birliği modelini ve koşulları netleştiriyoruz." },
      { title: "Eğitim", text: "Ekibinize teknik ve satış eğitimini biz veriyoruz." },
      { title: "Ortak Lansman", text: "Bölgenizde ilk projeleri birlikte yürütüyor, sahada destek oluyoruz." },
      { title: "Sürekli Destek", text: "Tedarik, pazarlama materyali ve teknik destek devam eder." },
    ],
    faqs: [
      {
        q: "Başlangıç için büyük yatırım gerekiyor mu?",
        a: "Modele göre değişir; bayilikte ağır stok zorunluluğu dayatmıyoruz. İlk görüşmede bölgenize uygun, gerçekçi bir başlangıç planı çıkarıyoruz.",
      },
      {
        q: "Teknik ekibim yok, yine de bayi olabilir miyim?",
        a: "Evet — teknik eğitimi biz veriyoruz ve ilk kurulumlarınızda saha desteği sağlıyoruz. Satış ve müşteri tarafını yönetebilen firmalar için uygun bir modelimiz var.",
      },
      {
        q: "Bölge koruması var mı?",
        a: "İş birliği modeline göre bölge bazlı çalışıyoruz; aynı bölgeye kontrolsüz şekilde bayi vermiyor, emeğinizin karşılığını koruyoruz.",
      },
    ],
    closing: {
      title: "İş ortaklığını konuşalım",
      text: "Firmanızı ve bölgenizi kısaca anlatın; size uygun modeli ve koşulları birlikte değerlendirelim.",
    },
    referenceCategories: [],
    turnkeyInstall: false,
    seoKeywords: ["güneş enerjisi bayilik başvurusu", "solar distribütörlük şartları", "GES bayilik iş ortaklığı"],
    blogCategory: "Bayilik",
    relatedServiceSlugs: ["malzeme-tedarik-toptan-perakende", "taahhut-isletme-bakim", "muteahhit-ges"],
  },

  "projelendirme-muhendislik-basvuru": {
    hero: {
      headline: "GES bürokrasisini biz üstlenelim, siz işinize bakın.",
      sub: "Statik rapor, elektrik projesi, tek hat şeması, EDAŞ bağlantı anlaşması… Kâğıt işi kurulum kadar kritiktir. Mühendislik ekibimiz tüm süreci sizin adınıza yürütür — ister bizim kurulumumuz olsun, ister başka firmanın.",
    },
    benefits: [
      {
        icon: FileCheck2,
        title: "Eksiksiz proje dosyası",
        text: "Tek hat şeması, elektrik projesi ve statik rapor mevzuata tam uyumlu hazırlanır; revizyon turlarında zaman kaybetmezsiniz.",
      },
      {
        icon: Landmark,
        title: "EDAŞ sürecini biz koşturuyoruz",
        text: "Bağlantı anlaşması ve lisanssız üretim başvurusunun her adımını takip ediyor, sizi sadece sonuçla ilgilendiriyoruz.",
      },
      {
        icon: HardHat,
        title: "Sahayı bilen mühendislik",
        text: "Masa başı değil — savunma sanayi ve telekom projelerinde saha tecrübesi kazanmış bir ekip.",
      },
      {
        icon: Briefcase,
        title: "Bağımsız danışmanlık",
        text: "Kurulumu başka firma mı yapıyor? Sorun değil — projelendirme ve başvuru hizmetini bağımsız olarak da veriyoruz.",
      },
    ],
    table: {
      title: "Hizmet kapsamı",
      columns: ["Hizmet", "İçerik", "Teslim"],
      rows: [
        ["Statik rapor", "Çatı taşıma kapasitesi analizi", "Keşif sonrası kısa sürede"],
        ["Elektrik projesi", "Tek hat şeması + proje dosyası", "Başvuruya hazır dosya"],
        ["EDAŞ süreci", "Başvuru + onay takibi + kabul", "Uçtan uca takip"],
      ],
      note: "Süreler EDAŞ yoğunluğuna göre değişir; başvurunuzun durumunu size düzenli raporluyoruz.",
    },
    steps: [
      { title: "Bilgi & Evrak Toplama", text: "Saha bilgilerini ve mevcut evrakı sizden tek seferde alıyoruz." },
      { title: "Statik + Elektrik Projesi", text: "Rapor ve proje dosyası mevzuata uygun hazırlanır." },
      { title: "EDAŞ Başvurusu", text: "Dosya eksiksiz şekilde sunulur, süreç resmi olarak başlar." },
      { title: "Onay Takibi", text: "Kurumla yazışmaları biz yürütür, durumu size raporlarız." },
      { title: "Dosya Teslimi", text: "Onaylı dosya ve kabul evrakı size teslim edilir." },
    ],
    faqs: [
      {
        q: "Kurulumu başka firmaya yaptırdım; sadece proje ve başvuru hizmeti alabilir miyim?",
        a: "Evet — bu hizmeti bağımsız olarak veriyoruz. Mevcut kurulumun projelendirmesini ve EDAŞ sürecini devralıp tamamlıyoruz.",
      },
      {
        q: "EDAŞ süreci genelde ne kadar sürer?",
        a: "Bölgeye ve dönem yoğunluğuna göre değişir; dosyanın eksiksiz hazırlanması süreci belirgin şekilde kısaltır. Başvurunuzun durumunu her aşamada raporluyoruz.",
      },
      {
        q: "Başvuru reddedilirse ne oluyor?",
        a: "Eksiksiz hazırlanan dosyalarda ret nadirdir; olası revizyon taleplerini giderip dosyayı yeniden sunuyoruz — süreç sonuçlanana kadar takip bizde.",
      },
    ],
    closing: {
      title: "Proje dosyanızı konuşalım",
      text: "Sahanızın veya çatınızın bilgilerini iletin; kapsamı ve süreci netleştirip teklifimizi hızlıca sunalım.",
    },
    referenceCategories: ["Telekomünikasyon", "Müteahhit"],
    turnkeyInstall: false,
    seoKeywords: ["EDAŞ bağlantı anlaşması başvurusu", "güneş enerjisi elektrik projesi", "lisanssız üretim başvurusu nasıl yapılır"],
    blogCategory: "Mühendislik & Başvuru",
    relatedServiceSlugs: ["villa-cati-ges", "muteahhit-ges", "fabrika-cati-ges"],
  },

  "fabrika-cati-ges": {
    hero: {
      headline: "Fabrikanızın çatısı, en büyük enerji kaynağınız olsun.",
      sub: "Üretim tesisinizin geniş çatı alanını, gündüz yoğun elektrik tüketiminizi karşılayan büyük ölçekli bir güneş enerjisi santraline dönüştürün — üretim durmadan, vardiya planınıza uygun kurulumla.",
    },
    benefits: [
      {
        icon: Gauge,
        title: "Yüksek tüketimde belirgin tasarruf",
        text: "Endüstriyel tesislerde gündüz tüketimi zaten yüksek olduğu için üretilen enerjinin büyük bölümü anında tüketilir, tasarruf doğrudan yansır.",
      },
      {
        icon: TrendingUp,
        title: "Kısa amortisman, uzun kazanç",
        text: "Yüksek gündüz tüketimi sayesinde geri ödeme süresi konut projelerine göre kısalır; panellerin 25+ yıllık ömrü boyunca üretim kâra döner.",
      },
      {
        icon: ShieldCheck,
        title: "Üretim durmadan kurulum",
        text: "Kurulumu vardiya ve bakım planınıza göre programlıyor, çatı üzerindeki çalışmaları üretim hattınızı etkilemeyecek şekilde yürütüyoruz.",
      },
      {
        icon: Zap,
        title: "Üç faz, yüksek kapasiteli sistem",
        text: "Tesisinizin üç faz elektrik altyapısına uygun invertör ve panel dizilimiyle yüksek kapasiteli sistemler kuruyoruz.",
      },
    ],
    table: {
      title: "Tesis ölçeğine göre sistem",
      columns: ["Tesis ölçeği", "Tipik sistem gücü", "Tahmini geri ödeme"],
      rows: [
        ["Küçük/orta ölçekli atölye", "50-150 kWp", "4-6 yıl"],
        ["Orta ölçekli üretim tesisi", "150-500 kWp", "5-7 yıl"],
        ["Büyük ölçekli fabrika/OSB", "500 kWp ve üzeri", "6-8 yıl"],
      ],
      note: "Rakamlar tesisinizin çatı alanına, elektrik tüketim profiline ve OSB/EDAŞ bağlantı kapasitesine göre keşif sonrası netleşir.",
    },
    steps: [
      { title: "Ücretsiz Keşif & Tüketim Analizi", text: "Çatı alanınızı, statik durumunu ve son 12 aylık elektrik faturalarınızı yerinde inceliyoruz." },
      { title: "Sistem Tasarımı & Fizibilite", text: "Üç faz altyapınıza uygun kapasiteyi belirliyor, yatırım geri dönüş analizini çıkarıyoruz." },
      { title: "Proje & OSB/EDAŞ Başvurusu", text: "Statik rapor, elektrik projesi ve bağlantı anlaşması sürecini sizin adınıza yürütüyoruz." },
      { title: "Üretimi Aksatmayan Kurulum", text: "Kurulumu vardiya ve üretim planınıza göre programlıyor, tesis faaliyetinizi durdurmuyoruz." },
      { title: "Devreye Alma & Raporlama", text: "Sistemi devreye alıyor, üretim/tüketim verilerinizi anlık izleyebileceğiniz bir takip paneli kuruyoruz." },
    ],
    faqs: [
      {
        q: "Üretim durmadan kurulum yapılabilir mi?",
        a: "Evet — kurulumu vardiya planınıza göre programlıyor, çatı üzerindeki çalışmaları üretim hattınızı etkilemeyecek şekilde yürütüyoruz.",
      },
      {
        q: "Sistem kaç yılda kendini amorti eder?",
        a: "Tesisin tüketim profiline göre değişir; yüksek gündüz tüketimi olan fabrikalarda genellikle 4-7 yıl arasında amorti sağlanır.",
      },
      {
        q: "Üç faz elektrik altyapımıza uygun mu?",
        a: "Evet, endüstriyel tesisler için üç faz invertör ve sistemler kuruyoruz; mevcut pano ve trafo kapasitenizi keşifte kontrol ediyoruz.",
      },
      {
        q: "OSB içindeyiz, bağlantı süreci farklı mı işliyor?",
        a: "OSB'lerde bağlantı süreci kendi müdürlüğü üzerinden yürüyebilir; bu süreci de sizin adınıza takip ediyoruz.",
      },
    ],
    closing: {
      title: "Fabrikanız için ücretsiz keşif planlayalım",
      text: "Çatı alanınızı ve elektrik faturalarınızı inceleyelim; size özel sistem boyutu ve yatırım geri dönüş analizini hızlıca sunalım.",
    },
    referenceCategories: ["Fabrika"],
    seoKeywords: ["fabrika çatısına güneş enerjisi sistemi", "endüstriyel GES kurulumu", "OSB güneş enerjisi santrali"],
    blogCategory: "Fabrika GES",
    relatedServiceSlugs: ["taahhut-isletme-bakim", "projelendirme-muhendislik-basvuru", "muteahhit-ges"],
  },

  "taahhut-isletme-bakim": {
    hero: {
      headline: "Kurulum bitince iş bitmiyor — biz orada da yanınızdayız.",
      sub: "Kurumsal ve kamu projelerinde taahhüt yüklenimi, devreye alınmış sistemlerde ise düzenli işletme ve bakım. Sisteminizi başka bir firma kurmuş olsa bile bakımını devralabiliriz.",
    },
    benefits: [
      {
        icon: Briefcase,
        title: "Anahtar teslim taahhüt yüklenimi",
        text: "İhale şartnamesine uygun mühendislik, tedarik ve kurulumu sözleşme kapsamında uçtan uca üstleniyoruz.",
      },
      {
        icon: Wrench,
        title: "Periyodik bakım ve temizlik",
        text: "Panel temizliği, bağlantı kontrolü ve ekipman sağlık taramasını düzenli ziyaretlerle yapıyoruz.",
      },
      {
        icon: Gauge,
        title: "Uzaktan izleme ile erken teşhis",
        text: "Üretim verimliliğini sürekli izliyor, düşüş tespit ettiğimizde sahaya çıkmadan önce arızayı teşhis etmeye çalışıyoruz.",
      },
      {
        icon: LifeBuoy,
        title: "Başka firmanın sistemine de bakım",
        text: "Sisteminizi başka bir firma kurmuş olsa bile bakım ve işletme sürecini devralabiliriz.",
      },
    ],
    table: {
      title: "Hizmet kapsamı",
      columns: ["Hizmet", "İçerik", "Periyot"],
      rows: [
        ["Taahhüt yüklenimi", "Mühendislik + tedarik + kurulum + devreye alma", "Proje bazlı"],
        ["Periyodik bakım", "Panel temizliği, ekipman kontrolü, bağlantı taraması", "3-6 ayda bir (öneri)"],
        ["Uzaktan izleme", "Üretim verimliliği takibi ve raporlama", "Sürekli"],
      ],
      note: "Bakım periyodu tesisin konumuna, tozlanma yoğunluğuna ve sistem ölçeğine göre keşif sonrası birlikte belirlenir.",
    },
    steps: [
      { title: "Keşif & Kapsam Belirleme", text: "Taahhüt mü yoksa mevcut sisteme bakım mı ihtiyacınız olduğunu, sahayı yerinde inceleyerek netleştiriyoruz." },
      { title: "Teklif & Sözleşme", text: "İhale şartnamesi ya da bakım kapsamına uygun teklif ve sözleşmeyi hazırlıyoruz." },
      { title: "Uygulama / İlk Bakım", text: "Taahhüt işini devreye alıyor ya da mevcut sisteminizde ilk kapsamlı bakımı yapıyoruz." },
      { title: "Periyodik Ziyaretler", text: "Belirlenen periyotta panel temizliği ve ekipman kontrolünü düzenli olarak tekrarlıyoruz." },
      { title: "Raporlama & Uzaktan Destek", text: "Her ziyaret sonrası performans raporu paylaşıyor, aralarda uzaktan izlemeyle takip ediyoruz." },
    ],
    faqs: [
      {
        q: "Sistemimi başka bir firma kurdu, yine de bakımını üstlenebilir misiniz?",
        a: "Evet — marka ve kurulumu kim yaptıysa yapsın, mevcut sisteminizin bakım ve işletme sürecini devralabiliriz. İlk ziyarette sistemin genel durumunu ücretsiz değerlendiriyoruz.",
      },
      {
        q: "Taahhüt hizmeti tam olarak neyi kapsıyor?",
        a: "İhale veya kurumsal proje şartnamesine göre mühendislik, malzeme tedariki, kurulum ve devreye almayı sözleşme kapsamında uçtan uca üstleniyoruz.",
      },
      {
        q: "Bakım periyodu ne sıklıkla olmalı?",
        a: "Tesisin tozlanma yoğunluğuna ve ölçeğine göre değişir; genellikle 3-6 ayda bir periyodik ziyaret öneriyoruz, keşif sonrası size özel bir plan çıkarıyoruz.",
      },
      {
        q: "Arıza durumunda müdahale süresi nedir?",
        a: "Uzaktan izleme sayesinde çoğu arızayı sahaya çıkmadan önce teşhis etmeye çalışıyoruz; müdahale süresi sözleşme kapsamında ve tesisin konumuna göre netleşir.",
      },
    ],
    closing: {
      title: "İşletme ve bakım ihtiyacınızı konuşalım",
      text: "Mevcut sisteminizin durumunu ya da taahhüt kapsamınızı kısaca anlatın; size özel bir bakım planı veya teklif çıkaralım.",
    },
    referenceCategories: [],
    seoKeywords: ["güneş enerjisi sistemi bakımı", "GES işletme bakım hizmeti", "solar panel taahhüt ihalesi"],
    blogCategory: "Taahhüt & Bakım",
    relatedServiceSlugs: ["fabrika-cati-ges", "distributorluk-bayilik", "projelendirme-muhendislik-basvuru"],
  },
};

// Admin panelden eklenen ve bu haritada karşılığı olmayan yeni hizmetler için
// çekirdek Supabase verisinden genel bir sayfa içeriği üretir.
export function buildFallbackContent(service: Service): ServiceContent {
  return {
    hero: { headline: service.title, sub: service.summary },
    benefits: service.bullets.slice(0, 4).map((b) => ({
      icon: Check,
      title: b,
      text: "",
    })),
    steps: INSTALL_STEPS,
    faqs: [],
    closing: {
      title: "Projenizi konuşalım",
      text: "İhtiyacınızı kısaca anlatın; size özel çözümü ve net teklifi hızlıca sunalım.",
    },
    referenceCategories: [],
  };
}

export function getServiceContent(service: Service): ServiceContent {
  return serviceContent[service.slug] ?? buildFallbackContent(service);
}
