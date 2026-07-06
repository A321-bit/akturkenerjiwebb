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

  contact: {
    phoneDisplay: "0 (312) 988 03 88",
    phoneHref: "tel:+903129880388",
    whatsappNumber: "905335591469",
    email: "info@akturkenerji.com",
    addressLine: "Esertepe Mahallesi, 314. Cadde No: 12/B, Keçiören/Ankara",
    mapsEmbedUrl: "https://share.google/QPVYFonxgGEjpNrXe",
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
  image?: string; // gerçek proje/hizmet fotoğrafı geldiğinde buraya path girin (örn. "/services/villa-cati-ges.jpg")
};

export const services: Service[] = [
  {
    slug: "villa-cati-ges",
    eyebrow: "Konut",
    title: "Mesken & Villa Çatı GES Sistemleri",
    summary:
      "Fatura bağımlılığını azaltan, çatınıza özel projelendirilmiş anahtar teslim güneş enerjisi sistemleri.",
    description:
      "Villa ve müstakil konut çatısına kurulacak bir güneş enerjisi sisteminin (GES) doğru boyutlandırılması, hem yatırımın geri dönüş süresini hem de günlük tasarrufunuzu doğrudan etkiler. Aktürk Enerji olarak Ankara ve çevresinde, çatınızın yönü, eğimi, gölgelenme durumu ve yıllık elektrik tüketiminizi birlikte değerlendirerek size özel bir sistem tasarlıyoruz. Süreç ücretsiz keşifle başlar: ekibimiz yerinde çatı statiğini inceler, mevcut elektrik altyapınızı kontrol eder ve son 12 aylık faturalarınıza göre ihtiyacınız olan kWp değerini hesaplar. Ardından statik hesap raporu ve elektrik tek hat şeması hazırlanır, dağıtım şirketi (EDAŞ) ile bağlantı anlaşması başvurusu bizim tarafımızdan takip edilir. Kurulumda 10 yılın üzerinde ürün garantili panel ve invertör seçenekleri kullanıyoruz; montaj yapısı çatı tipinize (kiremit, sac, düz teras) göre özel olarak belirlenir. Sistem devreye alındıktan sonra üretim/tüketim verilerinizi mobil uygulamadan anlık takip edebilirsiniz. Doğru boyutlandırıldığında villa çatı GES sistemleri yıllık elektrik tüketiminizin tamamına yakınını karşılayarak fatura bağımlılığınızı önemli ölçüde azaltır. Ankara, Çankaya, Etimesgut, Keçiören ve çevre ilçelerdeki villa sahiplerine anahtar teslim hizmet veriyoruz.",
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
      "Toplu konut, site ve karma kullanımlı gayrimenkul projelerinde güneş enerjisi sistemlerinin (GES) doğru zamanda ve doğru bütçeyle devreye alınması, teslim tarihini etkileyen kritik bir süreçtir. Aktürk Enerji, müteahhit ve gayrimenkul geliştirme firmalarıyla proje geliştirme aşamasından itibaren birlikte çalışarak elektrik altyapı planlamasını inşaat projesine entegre ediyor. Ön mühendislik desteğimiz kapsamında blok bazlı elektrik yükü hesabı, ortak alan ve daire bazlı sistem tasarımı ile EDAŞ başvuru stratejisini birlikte belirliyoruz. Toplu malzeme tedariğinde panel, invertör ve montaj ekipmanlarını proje ölçeğine uygun fiyat avantajıyla temin ediyor, kurulumu blok/etap bazlı bir takvime bağlıyoruz — böylece inşaat teslim tarihiniz aksamadan güneş enerjisi sistemleri devreye alınmış oluyor. Ankara ve Türkiye genelindeki toplu konut projelerinde, çok sayıda konuttan oluşan sitelerde blok blok kurulum deneyimimiz bulunuyor. İsteyen müteahhit firmalara bölgesel bayilik ve distribütörlük iş birliği modelleriyle de uzun vadeli ortaklık imkânı sunuyoruz.",
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
      "Elektrik şebekesinin ulaşmadığı tarım arazilerinde sulama ihtiyacını karşılamanın en sürdürülebilir yolu güneş enerjisiyle çalışan dalgıç pompa sistemleridir. Aktürk Enerji olarak kuyu derinliği, debi ihtiyacı ve arazinin güneşlenme potansiyeline göre panel gücünü ve pompa kapasitesini birlikte hesaplayarak size özel bir tarımsal sulama GES sistemi tasarlıyoruz. Bu sistemler dizel jeneratör yakıt maliyetini veya uzak mesafeden şebeke hattı çekme yatırımını tamamen ortadan kaldırır; güneş olduğu sürece ek bir işletme maliyeti olmadan çalışır. Kurulum sürecinde panel dizilimi, pompa kontrol ünitesi ve gerekirse su deposu/damlama sistemi entegrasyonunu birlikte planlıyor, bakım ihtiyacı düşük ve uzun ömürlü ekipmanlar tercih ediyoruz. Tarımsal destek ve hibe süreçlerinde de çiftçilerimize danışmanlık sağlıyoruz. Polatlı, Şereflikoçhisar ve Ankara'nın diğer tarım bölgelerinde şebekeden bağımsız sulama ihtiyacı olan çiftçilere ve tarımsal işletmelere anahtar teslim tarımsal sulama güneş enerjisi sistemleri kuruyoruz.",
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
      "Güneş enerjisi sistemleri gece saatlerinde veya yoğun bulutlu havalarda üretim yapamaz; bu boşluğu kapatmanın en etkili yollarından biri küçük ölçekli rüzgar türbinleriyle oluşturulan hibrit sistemlerdir. Aktürk Enerji, bölgenizin rüzgar potansiyelini ve güneş ışınım verilerini birlikte analiz ederek panel ve türbin kapasitesini dengeli şekilde belirliyor, hibrit invertör ve kontrol ünitesiyle iki kaynağı tek bir enerji hattında birleştiriyor. Bu yaklaşım, özellikle şebekeden tamamen bağımsız çalışması gereken uzak tesisler, karavanlar ve mobil yapılar için gece-gündüz kesintisiz enerji üretimi sağlar. Batarya depolama sistemleriyle entegre edildiğinde, hem güneşli hem rüzgarlı saatlerde üretilen fazla enerji depolanarak enerji kesintisi riski en aza indirilir. Ankara ve çevresinde şebekeden bağımsız çalışmak isteyen tesis sahiplerine, ihtiyaç analizinden kuruluma kadar uçtan uca rüzgar-güneş hibrit sistem çözümleri sunuyoruz.",
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
      "Güneş enerjisi sisteminizin gündüz ürettiği fazlayı depolayabilmek, hem elektrik kesintilerine karşı güvence sağlar hem de gece saatlerinde şebekeden bağımsız enerji kullanmanızı mümkün kılar. Aktürk Enerji, uzun döngü ömrü ve yüksek güvenlik standardıyla bilinen LiFePO4 (lityum demir fosfat) batarya teknolojisini kullanarak konut ve işletmeler için depolamalı güneş enerjisi sistemleri kuruyor. Sistem, elektrik kesintisi anında otomatik olarak devreye giren bir UPS mantığıyla çalışır — kesinti fark edilmeden batarya beslemesine geçilir. Batarya kapasitesi, günlük tüketim profilinize ve yedekte tutmak istediğiniz süreye göre boyutlandırılır; mobil uygulama üzerinden üretim, tüketim ve batarya doluluk oranını anlık olarak takip edebilirsiniz. Kesintisiz enerji ihtiyacı olan konutlar, küçük işletmeler, tarımsal tesisler ve telekomünikasyon altyapıları için Ankara genelinde lityum batarya depolama sistemleri kuruyoruz — mevcut bir güneş enerjisi sisteminize sonradan batarya entegrasyonu da mümkündür.",
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
      "Şehir dışındaki hobi bahçenizde aydınlatma, su pompası ve küçük ev aletleri için elektrik ihtiyacınızı şebeke bağlantısı çekmeden karşılamanın en pratik yolu kompakt bir güneş enerjisi sistemidir. Aktürk Enerji, hobi bahçesi sahiplerine bütçeye uygun, kolay taşınabilir ve ihtiyaç arttıkça sonradan genişletilebilir sistemler tasarlıyor. Başlangıç paketlerimiz genellikle birkaç aydınlatma noktası, küçük bir su pompası ve priz ihtiyacını karşılayacak şekilde planlanır; zamanla buzdolabı, sulama otomasyonu veya ek aydınlatma eklemek istediğinizde sistem kolayca büyütülebilir. Kurulum basit bir montaj yapısıyla (sehpa üzeri panel, küçük ölçekli batarya ve invertör) yapılır, şebeke bağlantısı veya EDAŞ başvurusu gerektirmez — bu da süreci hem hızlı hem düşük maliyetli kılar. Gölbaşı, Polatlı ve Ankara'nın diğer hobi bahçesi bölgelerinde, bütçenize uygun kompakt güneş enerjisi çözümleri için ücretsiz keşif talep edebilirsiniz.",
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
      "Karavanla yolda olduğunuz zamanlarda şebekeden bağımsız, sessiz ve sürdürülebilir bir enerji kaynağına sahip olmak, seyahat konforunuzu doğrudan etkiler. Aktürk Enerji, karavanın çatı yapısına uygun esnek veya sert panel seçenekleri, kompakt lityum batarya paketleri ve karavan tipi invertörlerle size özel mobil enerji sistemleri kuruyor. Esnek paneller hafif ve düşük profilli olduğu için karavanın aerodinamiğini ve görünümünü bozmaz; sert paneller ise daha yüksek verim ve uzun ömür sunar — ihtiyacınıza göre birlikte karar veriyoruz. Sistem, buzdolabı, aydınlatma, su pompası ve elektronik cihazlarınızı güneş olduğu sürece şarj ederken, lityum batarya sayesinde geceleri ve bulutlu günlerde de enerji sağlamaya devam eder. Kurulum sonrasında uzaktan teknik destek sunarak olası bir sorunda yolda kalmamanızı sağlıyoruz. Ankara merkezli olarak Türkiye genelindeki karavan sahiplerine kompakt ve güvenilir mobil güneş enerjisi sistemleri kuruyoruz.",
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
      "Güneş enerjisi sistemi kurulumunda kullanılan panel, invertör, batarya, kablo ve montaj ekipmanlarının orijinal, garantili ve rekabetçi fiyatlı olması, sistemin uzun vadeli performansını doğrudan etkiler. Aktürk Enerji, sektördeki geniş tedarikçi ağı sayesinde bu ekipmanları hem bireysel proje sahiplerine hem de toplu alım yapmak isteyen bayi, kurum ve müteahhit firmalara toptan ve perakende olarak temin ediyor. Güncel stok durumuna göre farklı marka ve kapasitelerde panel ve invertör seçenekleri sunuyor, her üründe orijinal garanti belgesi sağlıyoruz. Toplu alımlarda proje ölçeğine göre özel fiyatlandırma yapıyor, montaj ekibiniz için teknik danışmanlık da veriyoruz. Güncel stok ve fiyat listesi sık değiştiği için en doğru bilgi için doğrudan bizimle iletişime geçmenizi öneririz. Ankara merkezli olsak da Türkiye genelinde bayilere ve bireysel alıcılara malzeme tedariği sağlıyoruz.",
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
      "Solar enerji sektörü Türkiye'de hızla büyürken, bölgenizde bu büyümeden pay almak isteyen firmalar için Aktürk Enerji güvencesiyle distribütörlük veya bayilik modeliyle iş ortaklığı kurmak güçlü bir fırsat sunuyor. Bayilik anlaşması kapsamında malzeme tedariğinde öncelikli fiyat avantajı, teknik eğitim programları ve saha desteği sağlıyoruz — ekibinizin kurulum, keşif ve satış süreçlerinde ihtiyaç duyacağı bilgi birikimini aktarıyoruz. Ortak pazarlama materyalleri ve marka kullanım desteğiyle bölgenizde güvenilir bir GES markası olarak konumlanmanıza yardımcı oluyoruz. Distribütörlük modelinde ise daha geniş bir bölgede malzeme dağıtımı ve alt bayi ağı kurma imkânı sunuyoruz. Şehrinizde veya bölgenizde solar sektöründe büyümek isteyen firmalarla görüşmeye açığız; iş ortaklığı koşullarını birlikte değerlendirmek için bizimle iletişime geçebilirsiniz.",
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
      "Bir güneş enerjisi sisteminin kâğıt üzerindeki süreci — statik hesap, elektrik projesi, tek hat şeması ve dağıtım şirketi (EDAŞ) başvurusu — kurulum kadar kritik ve genellikle o kadar da karmaşıktır. Aktürk Enerji'nin mühendislik ekibi, çatı veya arazinizin statik durumunu inceleyerek taşıma kapasitesi raporunu hazırlıyor, sisteminize uygun tek hat şemasını ve elektrik projesini çiziyor, EDAŞ bağlantı anlaşması ile lisanssız üretim başvurusu dahil tüm mevzuat süreçlerini sizin adınıza yürütüyor. Bu hizmeti yalnızca kendi kurduğumuz sistemler için değil, başka bir firmanın kurduğu veya kurmayı planladığınız sistemler için de bağımsız mühendislik danışmanlığı olarak sunuyoruz. Savunma sanayi ve telekomünikasyon sektöründeki projelerde edindiğimiz saha tecrübesiyle, standart konut/tarım projelerinin yanı sıra daha karmaşık kurumsal başvurularda da güvenilir bir çözüm ortağıyız. Bireysel başvuru sahiplerinden kurumsal projelere kadar Ankara ve Türkiye genelinde projelendirme, mühendislik ve başvuru süreçlerinde yanınızdayız.",
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
  address?: string; // tam açık adres (varsa) — detay sayfasında gösterilir
  capacity: string; // e.g. "24,6 kWp"
  year: string;
  summary: string;
  description?: string; // detay sayfası için daha uzun anlatım
  image?: string; // kapak görseli, örn. "/references/referans-1/kapak.jpg"
  gallery?: string[]; // drone görüntüleri ve diğer saha fotoğrafları
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
    description:
      "Çankaya'da bulunan müstakil bir villanın çatısına kurduğumuz 10 kWp gücündeki güneş enerjisi sistemi (GES), hanenin yıllık elektrik tüketiminin tamamına yakınını karşılıyor. Proje kapsamında çatı statiği incelendi, elektrik projesi çizildi ve EDAŞ bağlantı anlaşması Aktürk Enerji tarafından yürütüldü. Çankaya ve çevresinde villa çatı GES kurulumu düşünen ev sahipleri için benzer sistemleri anahtar teslim olarak kuruyoruz.",
  },
  {
    slug: "referans-2",
    title: "[PLACEHOLDER] Toplu Konut Projesi",
    category: "Müteahhit",
    location: "Etimesgut, Ankara",
    capacity: "180 kWp",
    year: "2023",
    summary: "Müteahhit firmayla ortak yürütülen, 40 konutluk sitede blok bazlı kurulum.",
    description:
      "Etimesgut'ta 40 konuttan oluşan bir toplu konut projesinde, müteahhit firmayla birlikte yürüttüğümüz 180 kWp kapasiteli güneş enerjisi sistemi, blok blok kurulum takvimiyle teslim tarihini aksatmadan tamamlandı. Etimesgut ve Ankara genelinde müteahhit firmalarla ortak yürüttüğümüz GES projelerinde toplu malzeme tedariği ve saha koordinasyonunu Aktürk Enerji üstleniyor.",
  },
  {
    slug: "referans-3",
    title: "[PLACEHOLDER] Tarımsal Sulama Sistemi",
    category: "Tarım",
    location: "Polatlı, Ankara",
    capacity: "15 kWp",
    year: "2023",
    summary: "Şebeke bağlantısı olmayan arazide güneş destekli dalgıç pompa sistemi.",
    description:
      "Polatlı'da şebeke bağlantısı bulunmayan bir tarım arazisinde kurduğumuz 15 kWp güç kapasiteli güneş enerjisi destekli dalgıç pompa sistemi, sulama ihtiyacını dizel jeneratöre ya da şebeke yatırımına gerek kalmadan karşılıyor. Polatlı ve Ankara'nın tarım bölgelerinde çiftçilere özel tarımsal sulama GES sistemleri kuruyoruz.",
  },
  {
    slug: "referans-4",
    title: "[PLACEHOLDER] Hobi Bahçesi Elektrifikasyonu",
    category: "Hobi Bahçesi",
    location: "Gölbaşı, Ankara",
    capacity: "3 kWp",
    year: "2024",
    summary: "Aydınlatma, sulama pompası ve priz ihtiyacını karşılayan kompakt sistem.",
    description:
      "Gölbaşı'ndaki bir hobi bahçesinde aydınlatma, sulama pompası ve priz ihtiyacını karşılayan 3 kWp'lik kompakt güneş enerjisi sistemi kurduk. Gölbaşı ve Ankara çevresindeki hobi bahçesi sahiplerine bütçeye uygun, kolay taşınabilir ve ihtiyaca göre sonradan genişletilebilir GES çözümleri sunuyoruz.",
  },
  {
    slug: "referans-5",
    title: "[PLACEHOLDER] Telekomünikasyon Saha İstasyonu",
    category: "Telekomünikasyon",
    location: "Ankara",
    capacity: "8 kWp",
    year: "2022",
    summary: "Şebekeden bağımsız çalışan iletişim istasyonu için hibrit güneş/batarya sistemi.",
    description:
      "Ankara'da şebekeden bağımsız çalışan bir telekomünikasyon saha istasyonu için 8 kWp güç kapasiteli hibrit güneş/batarya sistemi kurduk. Kesintisiz iletişim altyapısı gerektiren telekomünikasyon ve savunma sanayi projelerinde Ankara genelinde saha tecrübemizle hizmet veriyoruz.",
  },
  {
    slug: "referans-6",
    title: "[PLACEHOLDER] Karavan Enerji Sistemi",
    category: "Karavan",
    location: "Ankara",
    capacity: "1,2 kWp",
    year: "2024",
    summary: "Esnek panel ve lityum batarya ile yolda kesintisiz enerji.",
    description:
      "Ankara merkezli bir karavan sahibi için esnek panel ve lityum batarya ile donattığımız 1,2 kWp'lik mobil enerji sistemi, yolda şebekeden bağımsız kesintisiz enerji sağlıyor. Ankara ve Türkiye genelinde karavan sahiplerine özel kompakt GES ve batarya paketleri kuruyoruz.",
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
