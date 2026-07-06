import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { getSiteSettings, getServices, SITE_URL } from "@/lib/data";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import Analytics from "@/components/Analytics";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${settings.name} | Ankara Güneş Enerjisi Sistemleri (GES)`,
      template: `%s | ${settings.name}`,
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
        logo: `${SITE_URL}/logo.svg`,
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
        <Header settings={settings} />
        <main className="flex-1">{children}</main>
        <Footer settings={settings} services={services} />
        <FloatingActions settings={settings} />
      </body>
    </html>
  );
}
