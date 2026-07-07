import {
  BadgeCheck,
  BatteryCharging,
  Briefcase,
  Building2,
  CalendarCheck,
  Car,
  Check,
  Droplets,
  Expand,
  Feather,
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
    ],
    closing: {
      title: "Villanız için ücretsiz keşif planlayalım",
      text: "Çatınızı görelim, faturanızı inceleyelim; size özel sistem boyutunu ve net teklifi hızlıca önünüze koyalım.",
    },
    referenceCategories: ["Villa"],
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
  },

  "hobi-bahcesi": {
    hero: {
      headline: "Bahçenizde şehir konforu — abonelik, direk, fatura olmadan.",
      sub: "Hobi bahçenize kompakt bir güneş sistemi kurun: aydınlatma, sulama pompası ve prizleriniz çalışsın; EDAŞ başvurusu, abonelik ve fatura hiç gündeme gelmesin.",
    },
    benefits: [
      {
        icon: Lightbulb,
        title: "Işık, priz, konfor",
        text: "Akşam oturmaları için aydınlatma, telefon şarjı, küçük ev aletleri — hepsi güneşten.",
      },
      {
        icon: Droplets,
        title: "Sulama derdi biter",
        text: "Küçük pompanız bataryadan beslenir; damlama sisteminiz siz bahçede yokken de çalışır.",
      },
      {
        icon: FileX,
        title: "Sıfır bürokrasi",
        text: "Şebeke bağlantısı olmadığı için EDAŞ başvurusu, abonelik, sayaç ve fatura yok.",
      },
      {
        icon: Expand,
        title: "İhtiyaç arttıkça büyür",
        text: "Bugün aydınlatmayla başlayın; yarın buzdolabı ekleyin — sistem modüler olarak büyür.",
      },
    ],
    table: {
      title: "Paket rehberi",
      columns: ["Paket", "Neler çalışır", "Kurulum süresi"],
      rows: [
        ["Başlangıç", "Aydınlatma + telefon şarjı + priz", "Aynı gün"],
        ["Konfor", "+ su pompası + küçük buzdolabı", "1 gün"],
        ["Tam bağımsız", "+ TV, küçük ısıtıcı/soğutucu", "1-2 gün"],
      ],
      note: "Paket içerikleri örnektir; bahçenizdeki gerçek ihtiyaca göre birlikte şekillendiririz.",
    },
    steps: OFFGRID_STEPS,
    faqs: [
      {
        q: "Buzdolabı çalıştırabilir miyim?",
        a: "Evet — düşük tüketimli küçük tip bir buzdolabı, doğru boyutlanmış panel ve bataryayla 7/24 çalışır. Keşifte tüketimine göre kapasiteyi hesaplıyoruz.",
      },
      {
        q: "Kışın sistemi sökmem gerekir mi?",
        a: "Gerekmez; ekipman dış ortama dayanıklıdır. Yine de isterseniz taşınabilir kurulum yapıyoruz, sezon sonunda depoya kaldırırsınız.",
      },
      {
        q: "Hırsızlığa karşı önlem var mı?",
        a: "Panelleri sökülmesi zor güvenlik bağlantılarıyla monte ediyoruz; talep ederseniz hareket sensörlü aydınlatma ve kamera beslemesini de sisteme ekliyoruz.",
      },
      {
        q: "Kurulum ne kadar sürer?",
        a: "Başlangıç paketleri genellikle aynı gün, daha kapsamlı sistemler 1-2 gün içinde çalışır halde teslim edilir.",
      },
    ],
    closing: {
      title: "Bahçenize uygun paketi seçelim",
      text: "Bahçenizde neleri çalıştırmak istediğinizi yazın; size uygun paketi ve net fiyatı aynı gün iletelim.",
    },
    referenceCategories: ["Hobi Bahçesi"],
  },

  "karavan-sistemleri": {
    hero: {
      headline: "Nerede durursanız durun, enerjiniz yanınızda.",
      sub: "Karavanınıza özel panel + lityum batarya kurulumuyla kamp alanı ve priz aramayı bırakın: buzdolabı, aydınlatma ve cihazlarınız yolda da evinizdeki gibi çalışsın.",
    },
    benefits: [
      {
        icon: Route,
        title: "Tam bağımsız seyahat",
        text: "Elektrik bağlantılı kamp alanına mahkûm olmayın; doğanın ortasında günlerce konaklayın.",
      },
      {
        icon: Feather,
        title: "Esnek panel: görünmez ağırlık",
        text: "Düşük profilli esnek paneller aerodinamiği ve görünümü bozmaz, çatıya yük bindirmez.",
      },
      {
        icon: BatteryCharging,
        title: "Gece boyu enerji",
        text: "Kompakt lityum paket gündüz dolar; akşam buzdolabı, ışık ve cihazlarınız kesintisiz çalışır.",
      },
      {
        icon: LifeBuoy,
        title: "Yolda yalnız değilsiniz",
        text: "Kurulum sonrası uzaktan teknik destekle olası sorunları siz yoldayken çözüyoruz.",
      },
    ],
    table: {
      title: "Karavan paketleri",
      columns: ["Paket", "Neleri besler", "Kimin için"],
      rows: [
        ["Hafta sonu", "Aydınlatma, şarj, su pompası", "Kısa kaçamaklar"],
        ["Gezgin", "+ kompresörlü buzdolabı, TV", "Uzun seyahatler"],
        ["Full-time", "+ invertörle 220V cihazlar", "Karavanda yaşayanlar"],
      ],
      note: "Paketler örnek kombinasyonlardır; karavanınızın çatısına ve tüketiminize göre özelleştirilir.",
    },
    steps: OFFGRID_STEPS,
    faqs: [
      {
        q: "Klima çalıştırabilir miyim?",
        a: "Kamp tipi düşük tüketimli klimalar doğru boyutlanmış batarya ve invertörle mümkün; standart ev kliması içinse dürüst olalım — verimli değil. Keşifte gerçekçi senaryoyu birlikte kuruyoruz.",
      },
      {
        q: "Panel çatıya zarar verir mi?",
        a: "Hayır — esnek paneller delme gerektirmeyen montajla uygulanır; sert panellerde ise sızdırmaz braket sistemi kullanıyoruz.",
      },
      {
        q: "Kurulum kaç gün sürer?",
        a: "Çoğu kurulum 1 gün içinde teslim edilir; kapsamlı full-time sistemlerde süre 2 güne çıkabilir.",
      },
      {
        q: "Sürüş sırasında da şarj olur mu?",
        a: "Evet; paneller sürüşte de üretir. İsterseniz araç alternatöründen destek şarjı (DC-DC) da ekliyoruz.",
      },
    ],
    closing: {
      title: "Karavanınıza uygun sistemi konuşalım",
      text: "Karavan modelinizi ve neleri çalıştırmak istediğinizi yazın; paket önerisini ve fiyatı hızlıca dönelim.",
    },
    referenceCategories: ["Karavan"],
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
