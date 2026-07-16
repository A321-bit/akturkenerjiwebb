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
  Sprout,
  Waves,
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
  /** Sayfa içi uzun-format SEO makalesi (Süreç ile SSS arasında gösterilir).
   * Gerçek arama niyetine göre yazılmış H3 alt başlıklı derinlemesine rehber içerik. */
  article?: {
    title: string;
    intro: string;
    sections: { heading: string; paragraphs: string[] }[];
  };
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
    seoKeywords: [
      "villa çatı güneş paneli fiyatları",
      "villa GES kaç kWp",
      "villa çatısına güneş enerjisi kurulumu Ankara",
      "villa güneş enerjisi sistemi fiyatları 2026",
      "güneş enerjisi sistemi kaç yılda amorti eder",
      "mahsuplaşma nasıl çalışır",
      "EDAŞ başvurusu kaç gün sürer",
      "güneş enerjisi kredisi taksit",
    ],
    blogCategory: "Villa GES",
    relatedServiceSlugs: ["isi-pompasi-entegrasyonu", "lityum-batarya-depolama", "elektrikli-arac-sarj-istasyonu"],
    article: {
      title: "Villa Güneş Enerjisi Sistemi Rehberi: Fiyatlar, kWp Hesabı, Geri Ödeme ve Mahsuplaşma",
      intro:
        "Villanız için güneş enerjisi sistemi araştırırken karşınıza çıkan \"kaç kWp yeterli\", \"ne kadar tutar\", \"kaç yılda kendini öder\" gibi soruların hepsini tek yerde, gerçekçi rakamlarla topladık. Aşağıdaki rehber, 2016'dan beri Ankara'da yüzlerce villa projesi kurmuş ekibimizin sahada edindiği tecrübeye dayanıyor.",
      sections: [
        {
          heading: "Villa için kaç kWp güneş paneli sistemi gerekir?",
          paragraphs: [
            "Sistem boyutu, yıllık elektrik tüketiminize ve çatınızın güneşlenme potansiyeline göre hesaplanır. Ankara'da ortalama günlük tepe güneşlenme süresi yaklaşık 4,5-5 saat kabul edilir; bu nedenle aylık 500 kWh tüketen bir villa için kabaca 3-4 kWp'lik bir sistem yeterli olur.",
            "Standart bir villa genellikle 5-8 kWp aralığında bir sistemle tüketiminin büyük bölümünü karşılar. Elektrikli araç şarjı, ısı pompası veya havuz pompası gibi ek yükleriniz varsa bu rakam 10-15 kWp'ye, geniş çatılı ve yüksek tüketimli villalarda ise 25 kWp'a kadar çıkabilir. Kesin rakam, son 12 aylık faturalarınızın incelendiği ücretsiz keşif sonrası netleşir.",
          ],
        },
        {
          heading: "Villa güneş paneli fiyatları ne kadar? (2026)",
          paragraphs: [
            "Villa tipi güneş enerjisi sistemlerinde yatırım tutarı; panel markası, invertör kalitesi, çatı tipi (kiremit, sac, düz teras) ve sistem gücüne göre değişir. Piyasada 5 kWp'lik anahtar teslim bir sistem ile 25 kWp'lik depolamalı, elektrikli araç şarjlı büyük bir sistem arasında geniş bir fiyat aralığı vardır.",
            "Bu nedenle internette gördüğünüz genel fiyat listelerine göre karar vermek yerine, çatınıza özel hazırlanan net teklifi almanızı öneririz — çatı yönü, gölgelenme durumu ve tüketiminiz fiyatı doğrudan etkiler. Ücretsiz keşif sonrası size kalem kalem, sürpriz maliyet içermeyen bir teklif sunuyoruz.",
          ],
        },
        {
          heading: "Sistem kaç yılda kendini amorti eder?",
          paragraphs: [
            "Doğru boyutlandırılmış bir villa GES sistemi, Türkiye'de genellikle 5-9 yıl içinde kendini amorti eder. Elektrikli araç şarjı ve ısı pompası gibi ek tüketimleri güneşten karşıladığınızda tasarruf büyüdüğü için bu süre kısalır.",
            "Panellerin ömrü 25 yılın üzerindedir; amortisman tamamlandıktan sonraki 15-20 yıl boyunca ürettiğiniz enerji neredeyse tamamen kârdır. Amortisman süresini etkileyen en büyük değişkenler çatı açısı/yönü, gölgelenme durumu ve güncel elektrik birim fiyatıdır.",
          ],
        },
        {
          heading: "Mahsuplaşma nasıl çalışır?",
          paragraphs: [
            "On-grid (şebeke bağlantılı) villa sistemlerinde, gündüz ürettiğiniz ve anlık kullanmadığınız fazla enerji şebekeye verilir; ay sonunda tükettiğiniz ile ürettiğiniz enerji karşılıklı olarak mahsuplaşır (netleştirilir). Sadece net farkınız için fatura ödersiniz.",
            "Bir ay fazla ürettiyseniz, oluşan fazlalık bir sonraki döneme taşınabilir — yani yaz aylarında ürettiğiniz fazla enerji kışın tüketiminizde işinize yarayabilir. Mahsuplaşma sürecine hiç girmeden, tamamen kendi bataryanızda depolayarak bağımsız çalışan hibrit sistemler de kuruyoruz; ikisi arasındaki farkı keşifte birlikte değerlendiriyoruz.",
          ],
        },
        {
          heading: "EDAŞ başvurusu ve kurulum süreci ne kadar sürer?",
          paragraphs: [
            "Süreç dört ana adımdan oluşur: keşif ve tüketim analizi, statik/elektrik projesinin çizilmesi, EDAŞ bağlantı anlaşması başvurusu ve fiziksel kurulum. Keşiften kurulumun tamamlanmasına kadar toplam süre, dosyanın EDAŞ'taki inceleme temposuna bağlı olarak genellikle birkaç hafta ile birkaç ay arasında değişir.",
            "Panel ve invertör montajının kendisi çatı büyüklüğüne göre çoğu villada 1-3 gün içinde tamamlanır. Statik rapor, tek hat şeması ve EDAŞ başvurusu dahil tüm evrak sürecini sizin adınıza biz yürütüyoruz — sizden randevu vermeniz dışında bir uğraş beklemiyoruz.",
          ],
        },
        {
          heading: "Kredi ve taksit imkanı var mı?",
          paragraphs: [
            "Evet — anlaşmalı bankalarla kredi kartına taksit imkanı sunuyoruz, ayrıca bazı bankaların düşük faizli yeşil enerji/GES kredisi seçenekleri de mevcut. Birçok müşterimiz, kredi taksitini sistemin sağladığı fatura tasarrufuna yakın bir tutarda planlayarak yatırımı adeta \"kendi kendini ödeyen\" bir modele dönüştürüyor.",
            "Size uygun ödeme planını, keşif sonrası net teklifle birlikte karşılaştırmalı olarak sunuyoruz; hangi banka ve vade seçeneğinin sizin için en avantajlı olduğunu birlikte değerlendiriyoruz.",
          ],
        },
        {
          heading: "Villanızı hibrit batarya, ısı pompası ve EV şarjıyla tamamen bağımsız hale getirin",
          paragraphs: [
            "Villa GES sistemi tek başına da güçlü bir yatırımdır; ama asıl fark, onu hibrit lityum batarya, ısı pompası entegrasyonu ve elektrikli araç şarj istasyonuyla birleştirdiğinizde ortaya çıkar. Bu sayfanın üst kısmındaki \"Tek çatı, tek sistem, dört çözüm\" bölümünde anlattığımız gibi, bu dördünü tek entegre sistemde kurarak villanızı elektrik faturasından büyük ölçüde ya da tamamen bağımsız hale getirebiliyoruz.",
            "Hangi kombinasyonun sizin tüketim profilinize ve bütçenize en uygun olduğunu belirlemek için ücretsiz keşif talep edebilir, ya da doğrudan WhatsApp'tan sorularınızı iletebilirsiniz.",
          ],
        },
      ],
    },
  },

  "isi-pompasi-entegrasyonu": {
    hero: {
      headline: "Isınma, soğutma ve havuz suyu — tek sistemle, güneşten besleyerek çözün.",
      sub: "Villanızdan işletmenize, özel havuzunuzdan fabrika tesisinize kadar her ölçekte hava kaynaklı ısı pompası kuruyoruz — mevcut ya da yeni güneş enerjisi sisteminize entegre ederek işletme maliyetini düşürüyoruz.",
    },
    benefits: [
      {
        icon: Flame,
        title: "Isınma ve soğutmayı tek cihazla çözün",
        text: "Hava kaynaklı ısı pompası kışın ısıtma, yazın soğutma sağlar — iki ayrı sistem kurma masrafından kurtulursunuz.",
      },
      {
        icon: Waves,
        title: "Havuzunuzu sezon boyu ısıtın",
        text: "Özel havuz ısı pompalarıyla açık veya kapalı havuzunuzu geleneksel yöntemlere göre çok daha düşük maliyetle ısıtır, yüzme sezonunu uzatırsınız.",
      },
      {
        icon: Zap,
        title: "Güneş enerjinizle besleyin",
        text: "Mevcut ya da yeni kurulacak GES sisteminize entegre ederek ısınma-soğutma-havuz maliyetinizi neredeyse sıfıra indirin.",
      },
      {
        icon: Building2,
        title: "Her ölçekte çözüm",
        text: "Villadan siteye, ofisten fabrikaya kadar ihtiyacınıza uygun kapasitede konut, ticari ve endüstriyel ısı pompası sistemleri kuruyoruz.",
      },
    ],
    table: {
      title: "Kullanım alanına göre kapasite",
      columns: ["Kullanım alanı", "Tipik kapasite", "Not"],
      rows: [
        ["Villa / konut (100-250 m²)", "8-16 kW", "Isınma + soğutma"],
        ["Özel havuz ısıtma", "5-15 kW", "Havuz hacmine göre değişir"],
        ["İşletme / ofis / site", "20-60 kW", "Çoklu ünite ile ölçeklenir"],
        ["Fabrika / büyük tesis", "60 kW ve üzeri", "Endüstriyel proje bazlı tasarım"],
      ],
      note: "Kesin kapasite, kullanım alanı, hacim/yalıtım durumu ve keşif sonrası netleşir.",
    },
    steps: [
      { title: "Keşif & İhtiyaç Analizi", text: "Konut, havuz, işletme ya da tesisinizin büyüklüğünü ve mevcut ısıtma sisteminizi yerinde inceliyoruz." },
      { title: "Kapasite & Cihaz Seçimi", text: "İhtiyacınıza uygun ısı pompası kapasitesini ve modelini belirliyoruz." },
      { title: "Montaj & Tesisat", text: "İç/dış ünite montajı, boru tesisatı ve elektrik bağlantısını tamamlıyoruz." },
      { title: "Güneş Enerjisi Entegrasyonu", text: "Mevcut veya yeni GES sisteminize entegre ederek işletme maliyetini düşürüyoruz (opsiyonel)." },
      { title: "Devreye Alma & Test", text: "Sistemi test edip kullanım eğitimini veriyoruz." },
    ],
    faqs: [
      {
        q: "Isı pompası hangi yapı tiplerine uygun?",
        a: "Villa, müstakil ev, özel havuzlar, ofis/işletmeler, siteler ve fabrikalar dahil hemen her yapıya uygulanabilir; keşifte kullanım alanınıza göre doğru kapasiteyi belirliyoruz.",
      },
      {
        q: "Havuzumu ısı pompasıyla ısıtabilir miyim?",
        a: "Evet — özel havuz ısı pompalarıyla açık veya kapalı havuzunuzu geleneksel yöntemlere göre çok daha düşük maliyetle ısıtabilir, yüzme sezonunuzu uzatabilirsiniz.",
      },
      {
        q: "İşletmemde veya fabrikamda büyük ölçekli ısı pompası kurabilir misiniz?",
        a: "Evet — ofis, site ve üretim tesisleri için çoklu ünite ile ölçeklenen ticari ve endüstriyel kapasiteli sistemler tasarlıyor ve kuruyoruz.",
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
        q: "Yaz aylarında soğutma için de kullanılabilir mi?",
        a: "Evet, ısı pompaları kışın ısıtma yazın soğutma sağlayan tersinir (reversible) sistemlerdir — klima ihtiyacınızı da karşılar.",
      },
    ],
    closing: {
      title: "Isı pompanız için keşif planlayalım",
      text: "Konutunuzu, havuzunuzu ya da tesisinizi görelim; size en uygun kapasiteyi ve net teklifi hızlıca sunalım.",
    },
    referenceCategories: ["Villa", "Fabrika", "Müteahhit"],
    seoKeywords: [
      "ısı pompası kurulumu Ankara",
      "havuz ısı pompası fiyatları",
      "hava kaynaklı ısı pompası fiyatları",
      "işletme ısı pompası sistemleri",
      "endüstriyel ısı pompası kurulumu",
      "güneş enerjili ısı pompası",
    ],
    blogCategory: "Isı Pompası",
    relatedServiceSlugs: ["villa-cati-ges", "fabrika-cati-ges", "lityum-batarya-depolama"],
    article: {
      title: "Isı Pompası Rehberi: Doğru Kapasite, Havuz Isıtma ve Doğalgazla Karşılaştırma",
      intro:
        "Isı pompası araştıran müşterilerimizin en çok sorduğu soruları — kapasite seçimi, havuz ısıtma maliyeti, doğalgazla karşılaştırma ve kışın verim — tek yerde topladık.",
      sections: [
        {
          heading: "Villa, işletme ve havuz için doğru kapasite nasıl seçilir?",
          paragraphs: [
            "Isı pompası kapasitesi; mekanın metrekaresi, yalıtım kalitesi ve hedef sıcaklık farkına göre belirlenir. Konutlarda 100-250 m² için genellikle 8-16 kW yeterli olurken, özel havuzlarda kapasite havuzun su hacmine ve istenen sıcaklık artışına göre 5-15 kW aralığında değişir.",
            "İşletme, ofis veya fabrika gibi büyük hacimlerde tek ünite yetmez; bu durumda çoklu ünite ile 20-60 kW ve üzerine ölçeklenen ticari/endüstriyel sistemler kuruyoruz. Kesin kapasite her zaman yerinde keşifle netleşir — fazla büyük seçilen bir cihaz gereksiz yere pahalıya mal olur, küçük seçilen ise hedef sıcaklığa ulaşamaz.",
          ],
        },
        {
          heading: "Isı pompası mı, doğalgaz kombi mi daha ekonomik?",
          paragraphs: [
            "Isı pompaları, 1 birim elektrik tüketimiyle ortam havasından aldığı enerjiyle 3-4 birim ısı enerjisi üretir; bu verim oranı (COP) doğalgaz kombiyle kıyaslandığında işletme maliyetini belirgin şekilde düşürür. Doğalgaz fiyatlarındaki artışlar da bu farkı her yıl biraz daha büyütüyor.",
            "En büyük fark, ısı pompasını güneş enerjisi sisteminize entegre ettiğinizde ortaya çıkıyor: gündüz ürettiğiniz elektrikle cihazı besleyerek ısınma-soğutma maliyetini neredeyse sıfıra indirebiliyorsunuz — doğalgazda böyle bir seçenek yok.",
          ],
        },
        {
          heading: "Havuz ısı pompası fiyatını ne belirler?",
          paragraphs: [
            "Havuz ısı pompası maliyeti; havuzun su hacmi (m³), açık/kapalı olması, hedeflenen su sıcaklığı ve sezon uzunluğuna göre değişir. Açık havuzlarda rüzgar ve buharlaşma ısı kaybını artırdığı için örtü kullanımı önerilir; bu da cihazın daha küçük kapasitede seçilebilmesini sağlar.",
            "Havuzunuzu güneş enerjisi sisteminize entegre ettiğinizde, özellikle yaz aylarında (güneşin en bol olduğu dönem, havuz kullanımının da en yoğun olduğu dönemle çakıştığı için) su ısıtma maliyeti dramatik şekilde düşer.",
          ],
        },
        {
          heading: "Ankara kışında ısı pompası verimli çalışır mı?",
          paragraphs: [
            "Evet — modern hava kaynaklı ısı pompaları düşük dış hava sıcaklıklarında da çalışacak şekilde tasarlanır. Çok soğuk günlerde verim bir miktar düşse de, doğru kapasitede seçilmiş bir cihaz Ankara'nın kış koşullarında sorunsuz ısıtma sağlar.",
            "Yaz aylarında ise aynı cihaz tersinir (reversible) çalışarak soğutma sağlar — yani tek bir yatırımla hem kışın ısınma hem yazın klima ihtiyacınızı karşılarsınız, ayrı bir soğutma sistemi kurmanıza gerek kalmaz.",
          ],
        },
        {
          heading: "Güneş enerjisiyle birlikte kullanınca gerçekte ne kadar tasarruf sağlanır?",
          paragraphs: [
            "Isı pompasının elektrik tüketimini gündüz saatlerinde güneş panellerinizden karşıladığınızda, hem ısınma-soğutma hem havuz ısıtma maliyetiniz doğrudan üretim kapasitenize bağlı hale gelir — şebekeden çektiğiniz enerji, dolayısıyla faturanız küçülür.",
            "Villa çatı GES'iniz yoksa dahi ısı pompası kurulumu tek başına yapılabilir; ileride güneş enerjisi sistemi eklediğinizde ikisini entegre etmek teknik olarak kolaydır. Hangi sıralamanın sizin için daha mantıklı olduğunu keşifte birlikte değerlendiriyoruz.",
          ],
        },
      ],
    },
  },

  "muteahhit-ges": {
    hero: {
      headline: "Projenize güneş enerjisi ekleyin — teslim tarihinizi riske atmadan.",
      sub: "2000 m² üzeri inşaat projelerinde yenilenebilir enerji kaynağı kullanımı artık yasal bir zorunluluk — bu şart karşılanmadan iskân alınamıyor. Ön mühendislikten blok bazlı kurulum takvimine kadar tek muhatapla çalışın, iskân sürecinizi riske atmayın.",
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
        title: "Yasal zorunluluğu eksiksiz karşılayın",
        text: "2000 m² üzeri projelerde iskân için şart olan yenilenebilir enerji sistemini, her bloğa uygun kapasitede eksiksiz kuruyoruz.",
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
        q: "2000 m² üzeri projelerde güneş enerjisi sistemi gerçekten zorunlu mu?",
        a: "Evet — 2000 m² ve üzeri inşaat alanına sahip yapılarda yenilenebilir enerji kaynağı kullanımı yasal bir zorunluluk ve bu şart karşılanmadan iskân (yapı kullanma izin belgesi) alınamıyor. Her bloğun çatısına ihtiyaca uygun kapasitede sistemi anahtar teslim kuruyor, iskân başvurunuzu geciktirmeden süreci tamamlıyoruz.",
      },
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
    seoKeywords: [
      "toplu konut güneş enerjisi sistemi",
      "site GES kurulumu",
      "müteahhit firmalarla güneş paneli iş birliği",
      "2000 m2 üzeri bina güneş enerjisi zorunluluğu",
      "iskan için çatı GES zorunluluğu",
      "inşaat GES yasal zorunluluk",
    ],
    blogCategory: "Müteahhit GES",
    relatedServiceSlugs: ["fabrika-cati-ges", "projelendirme-muhendislik-basvuru", "taahhut-isletme-bakim"],
    article: {
      title: "Müteahhitler için GES Rehberi: Ne Zaman Devreye Alınmalı, Kim Öder, Satışa Etkisi Ne?",
      intro:
        "Toplu konut ve site projelerinde güneş enerjisi sistemini projeye dahil etmeyi düşünen müteahhit ve geliştiricilerin en çok merak ettiği pratik soruları derledik.",
      sections: [
        {
          heading: "2000 m² üzeri projelerde güneş enerjisi neden artık zorunlu?",
          paragraphs: [
            "2000 m² ve üzeri inşaat alanına sahip yapılarda yenilenebilir enerji kaynağı kullanımı yasal bir zorunluluk haline geldi; bu şart karşılanmadan projeniz için iskân (yapı kullanma izin belgesi) alınamıyor. Yani artık güneş enerjisi sistemi, toplu konut projelerinde bir 'ekstra' değil, teslim sürecinin ayrılmaz bir parçası.",
            "Ankara Altındağ Doğantepe'de MSN Grup İnşaat ile hayata geçirdiğimiz çok bloklu bir projede tam da bu ihtiyacı karşıladık: kapsamdaki her bloğun çatısına 38 adet 595W Aktürk Enerji güneş paneli ve 20 kW'lık Deye invertör kurarak her bloğu 22,6 kWp gücünde bağımsız bir sisteme kavuşturduk — kurulum, iskân başvuru takvimini hiç aksatmadan tamamlandı. Bu tür projelerde erken planlama yapıldığında, yasal zorunluluk sizin için bir soruna değil, sorunsuz ilerleyen bir sürece dönüşüyor.",
          ],
        },
        {
          heading: "GES, projeye ne zaman dahil edilmeli?",
          paragraphs: [
            "En verimli sonuç, GES'in kaba inşaat aşamasında değil, proje geliştirme/ruhsat aşamasında planlanmasıyla alınır. Böylece elektrik altyapısı (pano kapasitesi, kablo güzergahı, sayaç yeri) baştan GES'e uygun tasarlanır ve sonradan ek maliyet çıkmaz.",
            "Yine de kaba inşaatı devam eden ya da tamamlanmış projelere de sonradan GES entegre edebiliyoruz — ideal olan erken planlama olsa da, zorunlu değil.",
          ],
        },
        {
          heading: "Blok bazlı kurulum teslim tarihini etkiler mi?",
          paragraphs: [
            "Doğru planlandığında hayır — tam tersine, çatısı biten bloktan kuruluma başlayıp diğer bloklarda inşaat devam ederken paralel ilerliyoruz. Bu sayede GES kurulumu şantiye takviminizin bir parçası olur, ayrı bir gecikme kalemi olmaz.",
            "Kritik nokta, EDAŞ başvuru sürecinin proje aşamasında başlatılmasıdır; başvuru iskân aşamasına kalırsa teslim tarihini riske atabilir. Bu stratejiyi biz proje başında sizinle birlikte kuruyoruz.",
          ],
        },
        {
          heading: "\"Güneş enerjili site\" etiketi satışlarda gerçekten fark yaratıyor mu?",
          paragraphs: [
            "Enerji giderleri konut alıcıları için giderek daha belirleyici bir kriter haline geliyor. Ortak alan elektriğinin (asansör, aydınlatma, hidrofor) güneşten karşılandığı bir site, aidat tasarrufu vaadiyle somut bir pazarlama argümanı sunuyor.",
            "Bu, sadece bir broşür maddesi değil — aidat bütçesine yansıyan, alıcının kendi cebinde hissedeceği bir fark. Satış ekibinizin kullanabileceği somut rakamları (tahmini aidat tasarrufu gibi) projelendirme aşamasında birlikte çıkarabiliyoruz.",
          ],
        },
        {
          heading: "Ortak alan mı, daire bazlı mı — hangisi doğru tercih?",
          paragraphs: [
            "Çoğu projede ortak alan tüketimini (asansör, merdiven aydınlatması, hidrofor, otopark) karşılayacak bir sistem tercih ediliyor; bu hem yönetimi kolaylaştırıyor hem de site yönetimine doğrudan aidat tasarrufu sağlıyor.",
            "Talep varsa daire bazlı sistemler (her bağımsız bölüm kendi üretimini kendi sayacından karşılar) de tasarlıyoruz — özellikle üst düzey/villa tipi projelerde bu, satış fiyatına yansıtılabilecek ek bir özellik olarak konumlandırılabiliyor.",
          ],
        },
        {
          heading: "Toplu alımda maliyet ne kadar düşüyor, kim ödüyor?",
          paragraphs: [
            "Panel, invertör ve montaj ekipmanını proje ölçeğinde tedarik ettiğimiz için birim maliyet, tek bir villa için yapılan bireysel alıma göre belirgin şekilde düşüyor — bu avantarı doğrudan proje bütçenize yansıtıyoruz.",
            "Ödeme modeli genellikle inşaat sürecine paralel hakediş bazlı ilerliyor; malzeme ve işçilik kalemleri şeffaf şekilde ayrıştırılıyor. İsteyen müteahhit firmalarla uzun vadeli bayilik/çözüm ortaklığı modeliyle de çalışabiliyoruz.",
          ],
        },
      ],
    },
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
    article: {
      title: "Tarımsal Sulama GES Rehberi: Pompa Seçimi, Hibe İmkanları ve Dizelle Karşılaştırma",
      intro:
        "Yukarıda pompa gücünüzü seçip anlık kWp hesabı yapabildiniz. Aşağıda çiftçilerimizin en sık sorduğu, hesap makinesinin cevaplamadığı soruları yanıtlıyoruz.",
      sections: [
        {
          heading: "Şebeke olmayan arazide sulama sistemi nasıl kurulur?",
          paragraphs: [
            "Sistem üç ana bileşenden oluşur: güneş panelleri, pompa kontrol ünitesi (VFD/invertör) ve dalgıç ya da yüzey pompası. Şebeke bağlantısı gerekmediği için EDAŞ başvurusu, hat çekme yatırımı ya da trafo maliyeti yok — panel ve pompa doğrudan birbirine bağlanır.",
            "Kurulum süresi arazi büyüklüğüne göre değişse de çoğu proje birkaç gün içinde tamamlanır; panel sehpası, pompa ve kontrol ünitesi sahada monte edilip sulama hattınıza bağlanır.",
          ],
        },
        {
          heading: "Kuyu debisine göre panel ve pompa nasıl boyutlandırılır?",
          paragraphs: [
            "Doğru boyutlandırma için kuyu derinliği, statik su seviyesi ve debi (litre/saniye) ölçülür. Sığ kuyu/küçük parselde 3-7 kWp yeterli olurken, derin kuyu ve yüksek debi ihtiyacında sistem 15-30 kWp'a kadar çıkabilir — pompa gücü ve panel sayısı bu ölçüme göre birlikte hesaplanır.",
            "Bulutlu günlerde üretim azaldığı için, ihtiyaca göre bir su deposu entegrasyonu öneriyoruz: güneşli saatlerde depoya su çekilir, istediğiniz an bu depodan sulama yapılır — böylece hava koşullarından bağımsız bir esneklik kazanılır.",
          ],
        },
        {
          heading: "Tarımsal GES için hibe ve destek imkanı var mı?",
          paragraphs: [
            "Kırsal kalkınma ve tarımsal destekleme programları zaman zaman güneş enerjili sulama sistemleri için hibe veya düşük faizli kredi imkanı sunuyor; bu programların kapsamı ve şartları dönemsel olarak değişiyor.",
            "Güncel destek programlarını takip ediyor, uygun olduğunuz bir hibe/kredi fırsatı varsa başvuru evraklarınızda danışmanlık sağlıyoruz — bu süreç projenizin efektif maliyetini daha da aşağı çekebilir.",
          ],
        },
        {
          heading: "Dizel jeneratöre kıyasla gerçek maliyet avantajı ne kadar?",
          paragraphs: [
            "Dizel jeneratörle sulama yapan bir çiftçi, her sulama sezonunda yakıt, bakım ve amortisman maliyetiyle karşı karşıya kalır; bu maliyet yıldan yıla yakıt fiyatlarıyla birlikte artar. Güneş enerjili sistemde ise kurulum sonrası işletme maliyeti neredeyse sıfırdır.",
            "Bu nedenle güneş enerjili sulama sistemleri genellikle 2-6 sulama sezonu içinde kendini amorti eder — kuyu derinliğine ve önceki dizel yakıt giderinize göre bu süre değişir. Panellerin 25 yılı aşan ömrü boyunca amortisman sonrası tüm üretim kârdır.",
          ],
        },
        {
          heading: "Kurulum sonrası bakım gerektirir mi?",
          paragraphs: [
            "Sistemde hareketli parça minimum düzeydedir; paneller sezonluk bir görsel kontrol ve temizlik dışında bakım istemez. Pompa tarafında ise su kalitesine bağlı periyodik kontrol önerilir.",
            "İsteyen çiftçilerimiz için sezon dışında sökülüp saklanabilen taşınabilir kurulum seçeneği de sunuyoruz — özellikle kiralık arazilerde ya da mevsimlik kullanımda tercih ediliyor.",
          ],
        },
      ],
    },
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
    article: {
      title: "Rüzgar-Güneş Hibrit Sistem Rehberi: Ne Zaman Mantıklı, Batarya Şart mı?",
      intro:
        "Şebekeden tamamen bağımsız çalışması gereken tesisler için rüzgar-güneş hibrit sistemleri sıkça araştırılıyor. En sık gelen soruları yanıtlıyoruz.",
      sections: [
        {
          heading: "Hangi durumlarda rüzgar-güneş hibrit sistem mantıklı?",
          paragraphs: [
            "Hibrit sistem, tek başına güneşin yetersiz kaldığı senaryolarda değerli: gece kesintisiz üretim gereken telekom istasyonları, uzun bulutlu dönemler yaşanan bölgeler ya da şebekeden tamamen bağımsız çalışması gereken kritik altyapılar. Sadece güneş yeterliyse ek türbin maliyetine gerek kalmayabilir.",
            "Bölgenizin rüzgar potansiyeli belirleyici faktör; keşif öncesinde bölge verilerini analiz ediyor, rüzgar zayıfsa bunu dürüstçe söyleyip güneş + batarya ağırlıklı bir kurgu öneriyoruz — gereksiz türbin yatırımı yaptırmıyoruz.",
          ],
        },
        {
          heading: "Küçük ölçekli rüzgar türbini villa veya tesis için yeterli mi?",
          paragraphs: [
            "Küçük ölçekli türbinler, güneş panellerinin ana kaynak olduğu bir sistemde destekleyici rol oynar — özellikle gece ve kış aylarında güneşin ürettiği açığı kısmen kapatır. Tek başına bir villanın tüm ihtiyacını karşılayacak büyüklükte değildir, panel + türbin kombinasyonu olarak düşünülmelidir.",
            "Uzak tesisler, dağ evleri ve telekom istasyonları gibi şebekenin hiç ulaşmadığı noktalarda bu kombinasyon, tek kaynaklı sistemlere göre çok daha güvenilir bir kesintisizlik sağlar.",
          ],
        },
        {
          heading: "Hibrit sistemde batarya şart mı?",
          paragraphs: [
            "Şebekeden tamamen bağımsız (off-grid) çalışacaksa evet — güneş ve rüzgarın anlık üretmediği saatlerde ihtiyacınızı karşılayacak enerji bataryada depolanmalı. Şebekeye bağlı hibrit kurulumlarda batarya opsiyoneldir, ama kesintisizlik önemliyse yine önerilir.",
            "Batarya kapasitesi, tesisin kritik yük profiline göre belirlenir; hibrit invertör hem panel hem türbin çıkışını tek hatta toplayıp bataryayı yönetir, siz tek bir uygulamadan tüm sistemi izlersiniz.",
          ],
        },
        {
          heading: "Gece enerji üretimi nasıl sağlanıyor?",
          paragraphs: [
            "Güneş panelleri gece üretim yapamaz; bu saatlerde ya rüzgar türbini (varsa ve rüzgar yeterliyse) ya da gündüz bataryada biriken enerji devreye girer. Doğru boyutlandırılmış bir hibrit sistemde bu geçiş otomatik ve kesintisizdir.",
            "Kritik altyapılarda (telekom istasyonu gibi) ek güvence için yedekli batarya kapasitesi öneriyoruz — birkaç gün üst üste düşük rüzgar/güneş olsa bile sistem çalışmaya devam eder.",
          ],
        },
        {
          heading: "Kurulum ve bakım maliyeti sadece güneş sistemine göre nasıl?",
          paragraphs: [
            "Türbin eklemek başlangıç yatırımını artırır; panel tarafı neredeyse bakım istemezken türbinde periyodik mekanik kontrol gerekir (rulman, kanat, elektrik bağlantıları). Bu bakım planını kurulumla birlikte size sunuyoruz.",
            "Buna karşılık, güneşin yetersiz kaldığı dönemlerde jeneratör yakıtı ya da uzun süreli enerji kesintisi riskini ortadan kaldırdığı için, kritik tesislerde bu ek maliyet kısa sürede kendini gösterir.",
          ],
        },
      ],
    },
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
    article: {
      title: "Lityum Batarya Depolama Rehberi: Kaç kWh Yeterli, LiFePO4 Neden Güvenli?",
      intro:
        "Kesintide elektriksiz kalmamak ya da güneşi gece kullanmak isteyenlerin en çok sorduğu soruları derledik.",
      sections: [
        {
          heading: "Evim için kaç kWh batarya kapasitesi yeterli?",
          paragraphs: [
            "Kapasite, hangi cihazları ne kadar süre çalıştırmak istediğinize göre belirlenir. Aydınlatma, buzdolabı, internet ve TV gibi kritik yükler için 5-10 kWh mertebesinde bir batarya genellikle kesinti yedeği olarak yeterlidir.",
            "Akşam tüketiminizin büyük kısmını güneşten karşılamak istiyorsanız 10-20 kWh aralığına çıkmak gerekir; ısı pompası desteği veya yoğun tüketim varsa 20 kWh üzerine çıkan sistemlerle şebekeden neredeyse tam bağımsızlık sağlanabilir. Kesin rakam, günlük tüketim profilinize göre keşifte hesaplanır.",
          ],
        },
        {
          heading: "LiFePO4 diğer lityum kimyasallarından neden daha güvenli?",
          paragraphs: [
            "LiFePO4 (lityum demir fosfat), telefon ve dizüstü bilgisayarlarda kullanılan lityum-kobalt hücrelere göre termal olarak çok daha kararlıdır; aşırı ısınma ve yangın riski belirgin şekilde düşüktür. Bu nedenle ev ve işletme kullanımı için sektörün tercih ettiği kimyasaldır.",
            "Buna ek olarak BMS (batarya yönetim sistemi) her hücreyi sürekli izleyerek aşırı şarj, aşırı deşarj ve sıcaklık anomalilerine karşı otomatik koruma sağlar — doğru sigortalama ve standartlara uygun montajla güvenli bir ev kurulumu elde edilir.",
          ],
        },
        {
          heading: "Kesinti anında sistem nasıl devreye giriyor?",
          paragraphs: [
            "Sistem bir UPS mantığıyla çalışır: şebeke kesintisi algılandığı anda, milisaniyeler içinde otomatik olarak bataryaya geçiş yapılır. Çoğu kullanıcı bu geçişi ışıkların titremesi dışında fark etmez.",
            "Devreye alma sırasında bu senaryo test edilir ve mobil uygulama telefonunuza kurulur — böylece batarya doluluk oranını, üretimi ve tüketimi her an anlık izleyebilirsiniz.",
          ],
        },
        {
          heading: "Mevcut güneş enerjisi sistemime sonradan batarya eklenebilir mi?",
          paragraphs: [
            "Çoğu durumda evet. Mevcut invertörünüzün modeline göre ya hibrit dönüşüm yapılır ya da ek bir şarj/depolama ünitesi entegre edilir — sistemi baştan kurmanıza gerek kalmaz.",
            "Entegrasyon öncesi invertör uyumluluğunu keşifte kontrol ediyoruz; bazı eski model invertörlerde ek bir dönüştürücü gerekebilir, bunu da net şekilde önceden bildiriyoruz.",
          ],
        },
        {
          heading: "Batarya kaç yıl kullanılır, ömrü nasıl korunur?",
          paragraphs: [
            "LiFePO4 hücreler binlerce şarj-deşarj döngüsü ömrüne sahiptir; günlük kullanımda 10 yıl mertebesinde yüksek performans korunur ve üretici garantileri bunu destekler.",
            "Batarya ömrünü en çok etkileyen faktör aşırı derin deşarjdır; BMS bu riski otomatik olarak sınırlar. Aşırı sıcak/soğuk ortamlardan kaçınmak ve üretici önerilerine uygun montaj da ömrü uzatan pratik adımlardır.",
          ],
        },
      ],
    },
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
    article: {
      title: "Hobi Bahçesi ve Karavan için Off-Grid Rehberi: Kaç Watt Yeterli, Neler Çalışır?",
      intro:
        "Şebekenin ulaşmadığı hobi bahçesi, karavan ve uzak tesisler için en çok sorulan pratik soruları yanıtlıyoruz.",
      sections: [
        {
          heading: "Hobi bahçesi veya karavan için kaç watt sistem yeterli?",
          paragraphs: [
            "İhtiyaç, hangi cihazları çalıştıracağınıza göre değişir. Sadece aydınlatma ve küçük bir su pompası için 0,5-2 kWp'lik küçük bir sistem + küçük batarya çoğu zaman yeterlidir; bu paketler genellikle aynı gün içinde kurulup çalışır hale gelir.",
            "Karavanda buzdolabı ve elektronik cihazlar için 200-600W esnek ya da sert panel yeterli olurken, uzak bir tesis/kulübede daha kapsamlı ihtiyaçlar için 1-5 kWp + batarya paketine çıkılabilir. Kesin boyut, telefon görüşmesi ya da keşif sonrası netleşir.",
          ],
        },
        {
          heading: "EDAŞ başvurusu olmadan kurulum nasıl yapılır?",
          paragraphs: [
            "Sistem şebekeye hiç bağlanmadığı için EDAŞ başvurusu, abonelik, sayaç ya da bağlantı anlaşması gerekmez — panel, batarya ve invertörden oluşan kompakt sistem doğrudan sahada kurulur ve devreye alınır.",
            "Bu, villa çatı GES'e kıyasla süreci ciddi şekilde hızlandırır: bürokratik onay beklemeden, çoğu zaman aynı gün ya da birkaç gün içinde elektriğiniz olur.",
          ],
        },
        {
          heading: "Karavanda hangi cihazlar çalıştırılabilir?",
          paragraphs: [
            "Buzdolabı, aydınlatma, telefon/laptop şarjı, televizyon ve küçük elektronik cihazlar doğru boyutlanmış panel ve bataryayla güneş olduğu sürece sorunsuz çalışır. Kamp tipi düşük tüketimli klimalar da uygun batarya/invertör kombinasyonuyla mümkün.",
            "Standart bir ev tipi klima için dürüst olmak gerekirse — enerji tüketimi çok yüksek olduğu için verimli değil. Keşifte gerçekçi bir senaryo üzerinden hangi cihazların pratik olarak çalışabileceğini birlikte planlıyoruz.",
          ],
        },
        {
          heading: "İhtiyaç arttıkça sistem nasıl büyütülür?",
          paragraphs: [
            "Sistem modüler tasarlanır: bugün sadece aydınlatma ve su pompasıyla başlayıp yarın buzdolabı, sonra ek batarya kapasitesi ekleyebilirsiniz. Baştan büyük yatırım yapmak zorunda değilsiniz.",
            "Bu yaklaşım özellikle hobi bahçesi sahiplerinde tercih ediliyor — arazi kullanımınız yıllar içinde değiştikçe (örneğin misafirhane veya küçük bir kulübe eklendiğinde) sistemi kademeli büyütüyoruz.",
          ],
        },
        {
          heading: "Kış aylarında ya da bulutlu havada performans nasıl?",
          paragraphs: [
            "Bulutlu günlerde üretim azalır ama durmaz; doğru boyutlanmış batarya, birkaç gün süren düşük üretim dönemlerinde bile kritik ihtiyaçlarınızı karşılamaya devam eder.",
            "Kış aylarında güneşlenme süresi kısaldığı için sistem boyutlandırmasında bu mevsimsel değişim de hesaba katılır — yıl boyu kullanılacak bir hobi bahçesi/kulübe için kışı da göz önünde bulundurarak biraz daha geniş boyutlandırma öneriyoruz.",
          ],
        },
      ],
    },
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
    article: {
      title: "Ev Tipi Araç Şarj İstasyonu Rehberi: Pano Yeterli mi, Güneşle Ne Kadar Tasarruf?",
      intro:
        "Villa, işletme ve site otoparkları için elektrikli araç şarj istasyonu kurdurmayı düşünenlerin en çok sorduğu soruları yanıtlıyoruz.",
      sections: [
        {
          heading: "AC duvar tipi şarj ile hızlı (DC) şarj arasındaki fark nedir?",
          paragraphs: [
            "Ev ve işyeri kullanımında standart çözüm AC Tip 2 duvar tipi istasyonlardır — güvenli, sessiz ve mevcut elektrik altyapınıza kolayca entegre edilir; aracı genellikle birkaç saat içinde tam şarj eder, gece boyunca şarj etmek için ideal.",
            "DC hızlı şarj istasyonları çok daha yüksek güç çeker ve çok daha pahalıdır; bunlar genellikle ticari/yol üstü şarj istasyonları için tercih edilir, villa veya standart işyeri kullanımı için AC tip yeterli ve ekonomiktir.",
          ],
        },
        {
          heading: "Villamın elektrik panosu şarj istasyonuna yetiyor mu?",
          paragraphs: [
            "Bu, keşifte kontrol ettiğimiz ilk şeydir: pano kapasitenizi, kablo kesitinizi ve mevcut sigortalarınızı inceliyoruz. Çoğu modern villa panosu tek bir AC istasyonu için yeterlidir.",
            "Yetersiz çıkarsa gerekli pano/kablo güncellemesini de biz üstleniyoruz — bu ek maliyeti size keşif sonrası net şekilde bildiriyoruz, sürpriz çıkmaz.",
          ],
        },
        {
          heading: "Güneş enerjisiyle araç şarjı gerçekte ne kadar tasarruf sağlar?",
          paragraphs: [
            "Şarj istasyonunu mevcut ya da yeni kurulacak GES sisteminize entegre ettiğinizde, aracınızı büyük ölçüde gündüz ürettiğiniz enerjiyle şarj edersiniz — kilometre başına yakıt/şarj maliyetiniz şebekeden çekilen elektriğe göre ciddi oranda düşer.",
            "Akıllı uygulama üzerinden şarjı güneşin en yoğun olduğu saatlere otomatik programlayabilirsiniz; bu sayede üretiminizin büyük kısmı doğrudan aracınıza gider, şebekeye satmak yerine kendi tüketiminizde değerlendirilir.",
          ],
        },
        {
          heading: "Site veya işyeri otoparkında çoklu istasyon nasıl yönetiliyor?",
          paragraphs: [
            "Birden fazla üniteyi ortak elektrik altyapısına bağlayarak kuruyor ve yönetiyoruz; yük yönetimi (load balancing) sayesinde aynı anda şarj olan araçlar arasında güç adil şekilde paylaştırılır, pano aşırı yüklenmez.",
            "Site yönetimleri için kullanım/faturalama takibi de mümkün — hangi dairenin ne kadar şarj kullandığı ortak altyapı üzerinden izlenebilir.",
          ],
        },
        {
          heading: "Akıllı şarj programlama tam olarak nasıl çalışır?",
          paragraphs: [
            "Mobil uygulama üzerinden şarj geçmişinizi görebilir, belirli saatlerde (örneğin güneşin en yoğun olduğu öğle saatlerinde) otomatik şarj başlatabilir ya da elektrik tarifenizin en ucuz olduğu gece saatlerine programlayabilirsiniz.",
            "Bu esneklik, hem güneş enerjinizden maksimum faydalanmanızı hem de şebekeden çekilen enerjide en uygun tarife saatlerini yakalamanızı sağlıyor.",
          ],
        },
      ],
    },
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
    article: {
      title: "Güneş Paneli ve İnvertör Alım Rehberi: Nelere Dikkat Edilmeli?",
      intro:
        "Panel, invertör ve batarya alırken sıkça sorulan, doğru ürünü seçmenize yardımcı olacak pratik soruları yanıtlıyoruz.",
      sections: [
        {
          heading: "Panel/invertör alırken en çok nelere dikkat edilmeli?",
          paragraphs: [
            "Öncelik üretici garanti belgesi ve orijinallik — gri ithalat ya da belgesiz ürünlerde arıza durumunda garanti desteği alamazsınız. İkinci kriter, panel ile invertörün gerilim/akım uyumluluğu; yanlış eşleştirme verim kaybına ya da cihaz arızasına yol açabilir.",
            "Panel teknolojisi de önemli: monokristalin paneller yüksek verim isteyenler için, TOPCon gibi yeni nesil teknolojiler daha da yüksek verim sunuyor; polikristalin ise bütçe dostu bir seçenek. Hangi teknolojinin sizin projeniz için mantıklı olduğunu ücretsiz danışmanlıkla belirliyoruz.",
          ],
        },
        {
          heading: "Toptan alımda fiyat nasıl avantajlı hale gelir?",
          paragraphs: [
            "Belirli adetlerin üzerindeki alımlarda birim maliyet düşer; bu avantaj özellikle bayi, müteahhit ve kurumsal alıcılar için proje ölçeğine göre fiyatlandırmayla devreye girer.",
            "Fiyat listemiz döviz kuru ve stok durumuna göre sık güncellendiği için, güncel ve size özel teklifi WhatsApp veya e-posta üzerinden aynı gün paylaşıyoruz.",
          ],
        },
        {
          heading: "Orijinal ürün garantisi neden bu kadar önemli?",
          paragraphs: [
            "Paneller 25 yıla varan performans garantisiyle satılır; bu garantinin geçerli olması için ürünün yetkili/orijinal kanaldan alınmış olması şart. Belgesiz ürünlerde arıza ya da düşük performans durumunda başvuracak bir muhatap bulamazsınız.",
            "Her ürünümüz üretici garanti belgesiyle teslim edilir — hem bireysel proje sahipleri hem toplu alım yapan firmalar için bu belge, ileride yaşanabilecek anlaşmazlıkların önüne geçer.",
          ],
        },
        {
          heading: "Bayiler için stok ve tedarik süreci nasıl işliyor?",
          paragraphs: [
            "Bayi ve müteahhit firmalar için öncelikli stok ayırma ve özel fiyat listesi sunuyoruz; talep listenizi ilettiğinizde güncel stok durumuna göre aynı gün teklif dönüyoruz.",
            "Ankara depomuzdan Türkiye geneline sigortalı sevkiyat yapıyoruz; kırılgan ürünler (paneller gibi) paletli olarak, proje takviminize uygun planlamayla gönderiliyor.",
          ],
        },
        {
          heading: "Hangi marka/teknoloji tercih edilmeli?",
          paragraphs: [
            "Doğru seçim, kullanım amacınıza bağlı: çatı alanı sınırlıysa yüksek verimli mono/TOPCon paneller daha az alanda daha fazla güç sağlar; alan bol ve bütçe önceliğiyse polikristalin/standart panellerle daha ekonomik bir sistem kurulabilir.",
            "İnvertör tarafında string, hibrit (bataryalı) ve off-grid modeller arasında seçim, sisteminizin şebeke bağlantısı ve depolama ihtiyacına göre yapılır — hangi kombinasyonun projenize uyduğunu ücretsiz teknik danışmanlıkla netleştiriyoruz.",
          ],
        },
      ],
    },
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
    article: {
      title: "GES Bayilik Rehberi: Ne Gerekir, Kazanç Modeli Nasıl İşler?",
      intro:
        "Solar sektöründe bayilik veya distribütörlük değerlendiren firmaların en çok sorduğu soruları yanıtlıyoruz.",
      sections: [
        {
          heading: "GES bayiliği almak için ne gerekir?",
          paragraphs: [
            "Ağır bir ilk yatırım ya da teknik ekip zorunluluğu dayatmıyoruz — satış ve müşteri ilişkilerini yönetebilen firmalar için uygun bir model kuruyoruz, teknik eğitimi ve ilk kurulumlarda saha desteğini biz sağlıyoruz.",
            "Asıl önemli olan bölgenizi tanımanız ve büyüme isteğiniz; ilk görüşmede firmanızı ve hedeflerinizi dinleyip size özel, gerçekçi bir başlangıç planı çıkarıyoruz.",
          ],
        },
        {
          heading: "Bayilik ile distribütörlük arasındaki fark nedir?",
          paragraphs: [
            "Bayilik modeli, satış ve kurulumu bölgenizde yürütmenizi kapsar — eğitim, marka desteği ve öncelikli tedarik fiyatı bizden, saha işi sizden. Distribütörlük ise daha geniş bir bölgede malzeme dağıtımı yapmayı ve kendi alt bayi ağınızı kurmayı içerir.",
            "Hangi modelin firmanıza uygun olduğu; mevcut dağıtım altyapınıza, ekip büyüklüğünüze ve hedeflediğiniz coğrafi kapsam alanına göre değişir — bunu ilk görüşmede birlikte netleştiriyoruz.",
          ],
        },
        {
          heading: "Bayilik desteği tam olarak neleri kapsıyor?",
          paragraphs: [
            "Keşif, projelendirme, kurulum ve satış süreçlerinde ekibinizi eğitiyoruz; ilk projelerinizde sahada fiilen yanınızda oluyoruz. Ortak pazarlama materyalleri ve marka kullanım desteğiyle bölgenizde güvenilir bir GES markası olarak konumlanmanıza yardımcı oluyoruz.",
            "Teknik destek tek seferlik değil — sürekli tedarik önceliği, güncel fiyat listesi ve karşılaştığınız saha sorunlarında danışmanlık almaya devam edersiniz.",
          ],
        },
        {
          heading: "Bayilikte kazanç modeli nasıl işliyor?",
          paragraphs: [
            "Bayiye özel fiyat listesi ve stok önceliğiyle rekabetçi teklif verme gücü kazanırsınız; kazancınız, sattığınız/kurduğunuz projelerin marjından oluşur — bize bağlı bir komisyon modeli değil, kendi işinizi kurduğunuz bir yapı.",
            "2016'dan beri sahada olan kurulu bir markanın referans gücüyle müşteri karşısına çıkmanız, özellikle yeni başlayan firmalar için güven inşa etme süresini kısaltıyor.",
          ],
        },
        {
          heading: "Hangi bölgeler için fırsat var, bölge koruması sağlanıyor mu?",
          paragraphs: [
            "Türkiye'de solar pazarı her yıl büyüyor ve henüz güçlü bir yerel oyuncunun olmadığı birçok bölge var. İş birliği modeline göre bölge bazlı çalışıyoruz; aynı bölgeye kontrolsüz şekilde bayi vermeyerek emeğinizin karşılığını koruyoruz.",
            "Bölgenizdeki mevcut durumu ve rekabeti ilk görüşmede birlikte değerlendirip, size en uygun coğrafi kapsamı netleştiriyoruz.",
          ],
        },
      ],
    },
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
    article: {
      title: "GES Projelendirme ve EDAŞ Başvuru Rehberi: Statik Rapordan Bağlantı Anlaşmasına",
      intro:
        "Kurulumu kim yaparsa yapsın, GES'in kağıt üzerindeki süreci hakkında en çok sorulan soruları yanıtlıyoruz.",
      sections: [
        {
          heading: "Statik rapor ve elektrik projesi neden şart?",
          paragraphs: [
            "Statik rapor, çatınızın panel yükünü güvenle taşıyıp taşımadığını mühendislik hesabıyla kanıtlar — bu belge olmadan EDAŞ başvurusu kabul edilmez. Elektrik projesi (tek hat şeması) ise sistemin nasıl bağlanacağını gösteren, başvurunun teknik omurgasıdır.",
            "Bu belgeler mevzuata tam uyumlu hazırlanmazsa başvuru revizyon turlarına girer, süreç uzar. Doğru hazırlanmış bir dosya, en büyük zaman tasarrufu kaynağıdır.",
          ],
        },
        {
          heading: "EDAŞ bağlantı anlaşması ve lisanssız üretim başvurusu nasıl yapılır?",
          paragraphs: [
            "Başvuru, ilgili dağıtım şirketine (EDAŞ) statik rapor, elektrik projesi ve gerekli evrakla birlikte yapılır; kurum başvuruyu inceleyip bağlantı görüşü verir. Sürecin her adımını sizin adınıza takip ediyor, kurumla yazışmaları biz yürütüyoruz.",
            "Dosya eksiksiz ve mevzuata uygun hazırlandığında süreç düzgün ilerler; eksik ya da hatalı evrak en sık gecikme sebebidir — bu yüzden dosya hazırlığına özellikle özen gösteriyoruz.",
          ],
        },
        {
          heading: "Kurulumu başka firma yaptı, sadece proje/başvuru hizmeti alabilir miyim?",
          paragraphs: [
            "Evet — bu hizmeti tamamen bağımsız olarak veriyoruz. Mevcut kurulumunuzun projelendirmesini ve EDAŞ sürecini devralıp mevzuata uygun hale getiriyor, başvuruyu sizin adınıza tamamlıyoruz.",
            "Bu, özellikle kurulumu yapan firmanın mühendislik/başvuru desteği sunmadığı ya da sürecin tıkandığı durumlarda sıkça başvurulan bir hizmet.",
          ],
        },
        {
          heading: "Başvuru sürecinde en sık yapılan hatalar nelerdir?",
          paragraphs: [
            "En sık görülen sorunlar: eksik ya da güncel olmayan statik rapor, tek hat şemasıyla saha uygulamasının uyuşmaması ve başvuru evrakının kurumun istediği formatta hazırlanmamış olması. Bunların her biri revizyon talebine, dolayısıyla gecikmeye yol açar.",
            "Biz bu hataları, dosyayı sunmadan önce kendi içimizde çift kontrol ederek en aza indiriyoruz — amacımız başvurunun ilk seferde sorunsuz ilerlemesi.",
          ],
        },
        {
          heading: "Kurumsal ve savunma sanayi projelerinde ek gereklilik var mı?",
          paragraphs: [
            "Evet, kurumsal ve kritik altyapı projelerinde standart konut/tarım başvurularına göre ek teknik doküman ve onay süreçleri gerekebilir. Savunma sanayi ve telekomünikasyon sektöründeki saha tecrübemiz, bu tür daha karmaşık başvurularda da güvenilir bir çözüm ortağı olmamızı sağlıyor.",
            "Bu projelerde süreç genellikle daha uzun sürse de, doğru hazırlanmış bir dosya ve deneyimli takip, riski önemli ölçüde azaltıyor.",
          ],
        },
      ],
    },
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
    article: {
      title: "Fabrika Çatı GES Rehberi: Amortisman, KDV İstisnası ve Teşvikler",
      intro:
        "Üretim tesisi sahiplerinin fabrika çatı GES yatırımı öncesi en çok sorduğu maliyet, teşvik ve süreç sorularını yanıtlıyoruz.",
      sections: [
        {
          heading: "Fabrika çatı GES yatırımı kaç yılda amorti eder?",
          paragraphs: [
            "Endüstriyel tesislerde üretim genellikle gündüz saatlerinde en yoğun elektrik tüketimiyle çakıştığı için, üretilen enerjinin büyük bölümü anında tüketilir — bu da geri ödeme süresini konut projelerine göre kısaltır. Çatı üstü GES yatırımları sanayi ölçeğinde tipik olarak 3-5 yıl aralığında kendini amorti eder; arazi tipi santrallerde bu süre biraz daha uzundur.",
            "Kesin süre; tesisinizin gündüz tüketim yoğunluğu, çatı alanı ve mevcut elektrik birim fiyatınıza göre değişir. Panellerin 25+ yıllık ömrü boyunca amortisman sonrası üretim tamamen işletme kârına dönüşür.",
          ],
        },
        {
          heading: "KDV istisnası ve vergi avantajları nelerdir?",
          paragraphs: [
            "Panel, invertör, trafo ve montaj dahil GES ekipmanı alımlarında KDV istisnası uygulanabiliyor — bu, ilk yatırım maliyetini doğrudan aşağı çeken önemli bir kalem. 240 kW ve üzeri çatı GES yatırımı yapan ve kendi tüketimi için lisanssız üretim yapan işletmeler, bulundukları bölgeden bağımsız olarak en az 4. bölge teşvik seviyesinden yararlanabiliyor.",
            "Bu kapsamda gümrük vergisi muafiyeti, kurumlar vergisinde bölgeye göre değişen oranlarda indirim (3-7 yıl arası uygulanan) ve 6-12 yıla varan SGK işveren primi muafiyeti gibi ek teşvikler de söz konusu olabiliyor. Güncel teşvik mevzuatı sık değiştiği için, sizin ölçeğinizdeki projede hangi teşviklerden yararlanabileceğinizi başvuru sürecinde netleştiriyoruz.",
          ],
        },
        {
          heading: "Üretim durmadan kurulum nasıl yapılır?",
          paragraphs: [
            "Kurulumu vardiya ve bakım planınıza göre programlıyoruz; çatı üzerindeki çalışmalar üretim hattınızı etkilemeyecek şekilde, gerekirse mesai dışı saatlerde yürütülür.",
            "Trapez sac veya sandviç panel gibi farklı endüstriyel çatı tiplerine uygun montaj sistemleri kullanıyoruz — çatı yapısına özel braket ve su yalıtım detayları, üretim faaliyetinize hiç dokunmadan uygulanır.",
          ],
        },
        {
          heading: "Trapez sac ve sandviç panel çatılarda montaj nasıl farklılaşır?",
          paragraphs: [
            "Trapez sac çatılarda panel dizilimi, sacın oluk yapısına uygun özel klemens ve braket sistemleriyle delinmeden ya da minimum delikle uygulanır; sandviç panel çatılarda ise yapının taşıma kapasitesine göre farklı bir montaj detayı kullanılır.",
            "Her iki durumda da su yalıtımının bozulmaması kritik önemde — montaj öncesi çatı statiği ve malzeme uyumluluğu keşifte titizlikle kontrol edilir.",
          ],
        },
        {
          heading: "Üç faz elektrik altyapısına uygun sistem nasıl tasarlanır?",
          paragraphs: [
            "Endüstriyel tesislerde üç faz elektrik altyapısına uygun invertör ve panel dizilimiyle yüksek kapasiteli sistemler kuruyoruz; mevcut pano ve trafo kapasitenizi keşifte kontrol edip gerekirse yükseltme ihtiyacını netleştiriyoruz.",
            "OSB içindeki tesislerde bağlantı süreci kendi müdürlüğü üzerinden yürüyebiliyor; bu süreci de standart EDAŞ başvurusu gibi sizin adınıza uçtan uca takip ediyoruz.",
          ],
        },
      ],
    },
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
    article: {
      title: "GES İşletme-Bakım Rehberi: Ne Sıklıkla, Ne Kadar Verim Kazandırır?",
      intro:
        "Devreye alınmış bir güneş enerjisi sisteminin bakımı ve kurumsal taahhüt süreciyle ilgili en çok sorulan soruları yanıtlıyoruz.",
      sections: [
        {
          heading: "GES bakımı ne sıklıkla yapılmalı?",
          paragraphs: [
            "Genel öneri 3-6 ayda bir periyodik ziyarettir; ancak tesisin konumu (toz, tarım arazisi yakınlığı, kuş pisliği riski) ve sistem ölçeği bu periyodu etkiler. Şehir dışındaki toz yoğun bölgelerde daha sık, temiz çatı ortamlarında daha seyrek bakım yeterli olabilir.",
            "Kesin periyodu keşifte tesisinize özel belirliyoruz; amaç gereksiz sık ziyaretle maliyet çıkarmadan, üretim kaybına yol açmayacak bir denge kurmak.",
          ],
        },
        {
          heading: "Panel temizliği üretimi gerçekten ne kadar artırıyor?",
          paragraphs: [
            "Toz, polen ve kir birikimi panel yüzeyinde ışığın paneline ulaşmasını engelleyerek üretimde ölçülebilir bir kayba yol açar; bu kayıp bölgeye ve mevsime göre değişse de, düzenli temizlik yapılmayan sistemlerde zamanla belirgin hale gelebilir.",
            "Bu yüzden periyodik bakım ziyaretlerimizde panel temizliği standart bir kalemdir — küçük bir yatırım gibi görünse de, sistemin ömrü boyunca kayıp üretimi önlediği için kendini fazlasıyla amorti eder.",
          ],
        },
        {
          heading: "Sistemimi başka firma kurdu, yine de bakımını devralabilir misiniz?",
          paragraphs: [
            "Evet — marka ve kurulumu kim yaptıysa yapsın, mevcut sisteminizin bakım ve işletme sürecini devralabiliyoruz. İlk ziyarette sistemin genel sağlık durumunu (panel, invertör, bağlantı noktaları) ücretsiz değerlendiriyoruz.",
            "Bu, özellikle kurulumu yapan firmayla iletişimi kopan ya da bakım hizmeti sunmayan firmalarla çalışmış müşterilerimiz için sık başvurulan bir hizmet.",
          ],
        },
        {
          heading: "Uzaktan izleme arıza tespitini nasıl hızlandırıyor?",
          paragraphs: [
            "Sistem üretim verilerini sürekli izliyoruz; beklenenin altında bir üretim tespit ettiğimizde, sahaya çıkmadan önce olası arızayı (kirlenme, bağlantı sorunu, invertör hatası vb.) teşhis etmeye çalışıyoruz. Bu, hem müdahale süresini kısaltır hem de gereksiz saha ziyaretini önler.",
            "Uzun süreli, fark edilmeyen bir üretim kaybı — özellikle büyük ölçekli fabrika sistemlerinde — ciddi bir mali kayba dönüşebilir; uzaktan izleme bu riski büyük ölçüde ortadan kaldırıyor.",
          ],
        },
        {
          heading: "Kurumsal ihalede taahhüt yüklenimi nasıl işliyor?",
          paragraphs: [
            "İhale şartnamesine uygun mühendislik, malzeme tedariki, kurulum ve devreye alma süreçlerini sözleşme kapsamında uçtan uca üstleniyoruz — ister kendi projemiz olsun ister başka bir yüklenicinin devrettiği iş.",
            "Kurumsal ve kamu projelerinde şartname uyumluluğu kritik olduğu için, teklif aşamasında dosyanızı titizlikle inceleyip eksiksiz bir taahhüt planı sunuyoruz.",
          ],
        },
      ],
    },
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
