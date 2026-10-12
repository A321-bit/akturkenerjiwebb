import type { Metadata } from "next";
import { preconnect } from "react-dom";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { getSiteSettings, getServices, SITE_URL, GOOGLE_MAPS_URL } from "@/lib/data";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import Analytics from "@/components/Analytics";
import { AREA_SERVED, openingHoursFromText } from "@/lib/seo";

// GA4 Ölçüm Kimliği (Measurement ID) — bu kimlik gizli değildir, her
// sayfanın kaynak kodunda zaten herkese açık olarak yer alır.
const GA_MEASUREMENT_ID = "G-7MWBQYG55N";

// Meta Pixel ID — bu da gizli değildir, her sayfanın kaynak kodunda görünür.
const META_PIXEL_ID = "956247070771662";

// Microsoft Clarity Proje Kimliği — oturum kaydı (session replay) ve ısı
// haritası (heatmap) için; bu da gizli değildir.
const CLARITY_PROJECT_ID = "xsw2u5pknm";

// Google Ads Etiketi (telefon araması dönüşümünü ölçmek için) — GA4 ile
// aynı gtag.js/dataLayer'ı paylaşıyor, bu yüzden gtag.js'i ikinci kez
// yüklemeden sadece ek bir 'config' çağrısı yapıyoruz.
const GOOGLE_ADS_ID = "AW-18330659140";

// Sayfalar önbellekten (CDN) sunulur ve en geç saatte bir yenilenir; admin
// panelinden yapılan her kayıt lib/admin-crud.ts içinde tüm siteyi anında
// yeniden doğrular (revalidatePath). Eskiden force-dynamic vardı: her istek
// sunucuda yeniden render ediliyor, TTFB 0,6–1 sn oluyordu. Build sırasındaki
// ara sıra "fetch failed" hataları lib/supabase.ts'deki tekrar deneme ile
// karşılanıyor; [slug] sayfaları build'de değil ilk ziyarette üretiliyor.
export const revalidate = 3600;

// Üçü de globalde (html class'ında) tanımlı olduğu için Next.js varsayılan
// olarak tüm ağırlıkları <link rel="preload"> ile render-blocking şekilde
// önceden yüklüyordu (PageSpeed: "oluşturmayı engelleyen kaynaklar", ~1450ms).
// Sadece başlıklarda kullanılan Space Grotesk gerçekten önceden yüklenmeyi
// hak ediyor (LCP genelde bir başlık); gövde metni (Inter) tarayıcı sistem
// fontuyla anında görünüp arkadan takas ediyor (font-display: swap zaten
// varsayılan), küçük etiket fontu (Plex Mono) ise hiç önceliksiz.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  preload: false,
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: settings.seoTitle,
      template: `%s | ${settings.shortName}`,
    },
    description: settings.description,
    keywords: [
      "güneş enerjisi sistemleri Ankara",
      "GES kurulumu",
      "çatı güneş paneli",
      "villa güneş enerjisi",
      "tarımsal sulama güneş enerjisi",
      "solar enerji Ankara",
      "lityum batarya depolama",
    ],
    authors: [{ name: settings.name }],
    openGraph: {
      type: "website",
      locale: "tr_TR",
      url: SITE_URL,
      siteName: settings.siteName,
      title: settings.seoTitle,
      description: settings.description,
    },
    twitter: {
      card: "summary_large_image",
      title: settings.seoTitle,
      description: settings.description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
  };
}

// Google (Analytics + Ads), Meta Pixel ve Clarity mobilde ana iş parçacığını
// ~1,5 sn tıkıyordu (PageSpeed TBT 1.270 ms). Sayfa açılırken yalnızca
// olayları biriktiren küçük kuyruklar (gtag/fbq/clarity) kurulur; asıl
// scriptler ilk etkileşimde (kaydırma, dokunma, tıklama, tuş) ya da en geç
// 4 sn sonra yüklenir ve kuyruktaki olayları gönderir. Admin panelinde hiçbiri
// yüklenmez (kendi ziyaretlerimiz ölçümleri kirletmesin).
const deferredTagsScript = `
(function(w,d){
  if (location.pathname.indexOf("/admin") === 0) return;
  w.dataLayer = w.dataLayer || [];
  w.gtag = function(){ w.dataLayer.push(arguments); };
  w.gtag("js", new Date());
  w.gtag("config", "${GA_MEASUREMENT_ID}");
  w.gtag("config", "${GOOGLE_ADS_ID}");
  var n = w.fbq = function(){ n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
  if (!w._fbq) w._fbq = n;
  n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
  w.fbq("init", "${META_PIXEL_ID}");
  w.fbq("track", "PageView");
  w.clarity = w.clarity || function(){ (w.clarity.q = w.clarity.q || []).push(arguments); };
  var loaded = false;
  var events = ["scroll", "pointerdown", "touchstart", "keydown", "mousemove"];
  function add(src){ var s = d.createElement("script"); s.async = true; s.src = src; d.head.appendChild(s); }
  function load(){
    if (loaded) return; loaded = true;
    events.forEach(function(e){ w.removeEventListener(e, load, { passive: true }); });
    add("https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}");
    add("https://connect.facebook.net/en_US/fbevents.js");
    add("https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}");
  }
  events.forEach(function(e){ w.addEventListener(e, load, { once: true, passive: true }); });
  setTimeout(load, 4000);
})(window, document);
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();
  const services = await getServices();

  const sameAs = [
    GOOGLE_MAPS_URL,
    settings.social.instagram,
    settings.social.linkedin,
    settings.social.youtube,
    settings.social.facebook,
  ].filter(Boolean);

  const openingHours = openingHoursFromText(settings.contact.workingHours);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": `${SITE_URL}/#localbusiness`,
        name: settings.name,
        url: SITE_URL,
        description: settings.description,
        foundingDate: String(settings.foundedYear),
        image: `${SITE_URL}/logo.svg`,
        address: {
          "@type": "PostalAddress",
          streetAddress: settings.contact.addressLine,
          addressLocality: settings.city,
          addressCountry: "TR",
        },
        telephone: settings.contact.phoneHref.replace("tel:", ""),
        email: settings.contact.email,
        areaServed: AREA_SERVED,
        ...(openingHours ? { openingHoursSpecification: openingHours } : {}),
        priceRange: "$$",
        hasMap: GOOGLE_MAPS_URL,
        sameAs,
        knowsAbout: [
          "Güneş enerjisi sistemleri",
          "Çatı GES kurulumu",
          "Tarımsal sulama sistemleri",
          "Rüzgar ve hibrit enerji sistemleri",
          "Lityum batarya depolama",
          "Elektrik mühendisliği ve proje başvuruları",
        ],
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: settings.name,
        legalName: settings.name,
        url: SITE_URL,
        logo: `${SITE_URL}/logo-icon.png`,
        foundingDate: String(settings.foundedYear),
        address: {
          "@type": "PostalAddress",
          streetAddress: settings.contact.addressLine,
          addressLocality: settings.city,
          addressCountry: "TR",
        },
        contactPoint: {
          "@type": "ContactPoint",
          telephone: settings.contact.phoneHref.replace("tel:", ""),
          email: settings.contact.email,
          contactType: "customer service",
          areaServed: AREA_SERVED,
          availableLanguage: "Turkish",
        },
        sameAs,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: settings.siteName,
        alternateName: [settings.name, settings.shortName].filter((n) => n && n !== settings.siteName),
        url: SITE_URL,
        inLanguage: "tr-TR",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };

  // Reklam trafiğinin çok geldiği sayfalarda (ör. /teklif-al) görsellerin
  // ve izleme scriptlerinin bağlantısı, tarayıcı bu kaynakları HTML'i
  // parse ederken keşfetmeden önce paralelde kurulsun diye erken açılıyor.
  preconnect("https://tzibyocqotqcowebswlq.supabase.co");
  preconnect("https://connect.facebook.net");
  preconnect("https://www.clarity.ms");

  return (
    <html
      lang="tr"
      data-scroll-behavior="smooth"
      className={`${spaceGrotesk.variable} ${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Analytics />
        <script dangerouslySetInnerHTML={{ __html: deferredTagsScript }} />
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
        <Header settings={settings} />
        <main className="flex-1">{children}</main>
        <Footer settings={settings} services={services} />
        <FloatingActions settings={settings} />
      </body>
    </html>
  );
}
