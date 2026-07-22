import type { Metadata } from "next";
import Script from "next/script";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { getSiteSettings, getServices, SITE_URL, GOOGLE_MAPS_URL } from "@/lib/data";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import Analytics from "@/components/Analytics";

// GA4 Ölçüm Kimliği (Measurement ID) — bu kimlik gizli değildir, her
// sayfanın kaynak kodunda zaten herkese açık olarak yer alır.
const GA_MEASUREMENT_ID = "G-7MWBQYG55N";

// Meta Pixel ID — bu da gizli değildir, her sayfanın kaynak kodunda görünür.
const META_PIXEL_ID = "956247070771662";

// Google Ads Etiketi (telefon araması dönüşümünü ölçmek için) — GA4 ile
// aynı gtag.js/dataLayer'ı paylaşıyor, bu yüzden gtag.js'i ikinci kez
// yüklemeden sadece ek bir 'config' çağrısı yapıyoruz.
const GOOGLE_ADS_ID = "AW-18330659140";

// Build sırasında Vercel'in build makinesinden Supabase'e yapılan istekler
// tutarsız şekilde "fetch failed" ile başarısız oluyor (yerelde ve runtime'da
// sorun yok). force-dynamic ile tüm sayfalar yalnızca request anında,
// dağıtılmış fonksiyon ortamında render edilir — hem build hatasını ortadan
// kaldırır hem de admin panel değişikliklerinin anında yansımasını sağlar.
export const dynamic = "force-dynamic";

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
      default: `${settings.name} | Ankara Güneş Enerjisi Sistemleri (GES)`,
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
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      url: SITE_URL,
      siteName: settings.name,
      title: `${settings.name} | Ankara Güneş Enerjisi Sistemleri`,
      description: settings.description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${settings.name} | Ankara Güneş Enerjisi Sistemleri`,
      description: settings.description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
  };
}

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
        areaServed: "TR",
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
          areaServed: "TR",
          availableLanguage: "Turkish",
        },
        sameAs,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: settings.name,
        url: SITE_URL,
        inLanguage: "tr-TR",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };

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
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
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
      <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
      <Script id="google-ads-config" strategy="afterInteractive">
        {`gtag('config', '${GOOGLE_ADS_ID}');`}
      </Script>
    </html>
  );
}
