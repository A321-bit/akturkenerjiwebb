import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site-config";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";

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

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | Ankara Güneş Enerjisi Sistemleri (GES)`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [
    "güneş enerjisi sistemleri Ankara",
    "GES kurulumu",
    "çatı güneş paneli",
    "villa güneş enerjisi",
    "tarımsal sulama güneş enerjisi",
    "solar enerji Ankara",
    "lityum batarya depolama",
  ],
  authors: [{ name: site.name }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: site.url,
    siteName: site.name,
    title: `${site.name} | Ankara Güneş Enerjisi Sistemleri`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} | Ankara Güneş Enerjisi Sistemleri`,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${site.url}/#organization`,
    name: site.name,
    url: site.url,
    description: site.description,
    foundingDate: String(site.foundedYear),
    address: {
      "@type": "PostalAddress",
      streetAddress: site.contact.addressLine,
      addressLocality: site.city,
      addressCountry: "TR",
    },
    telephone: site.contact.phoneHref.replace("tel:", ""),
    email: site.contact.email,
    areaServed: "TR",
    knowsAbout: [
      "Güneş enerjisi sistemleri",
      "Çatı GES kurulumu",
      "Tarımsal sulama sistemleri",
      "Rüzgar ve hibrit enerji sistemleri",
      "Lityum batarya depolama",
      "Elektrik mühendisliği ve proje başvuruları",
    ],
  };

  return (
    <html
      lang="tr"
      className={`${spaceGrotesk.variable} ${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppFloat />
      </body>
    </html>
  );
}
