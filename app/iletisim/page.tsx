import type { Metadata } from "next";
import BankAccounts, { COMPANY_TITLE } from "@/components/BankAccounts";
import { MapPin, Mail, Phone, Clock, MessageCircle, Navigation } from "lucide-react";
import Link from "next/link";
import { getReferences, getSiteSettings, whatsappLink, SITE_URL } from "@/lib/data";
import { serviceAreas } from "@/lib/reference-links";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import LeadForm from "@/components/LeadForm";
import TrackedContactLink from "@/components/TrackedContactLink";

export const metadata: Metadata = buildMetadata({
  title: "İletişim ve Ücretsiz Keşif",
  description:
    "Güneş enerjisi sistemi için ücretsiz keşif talep edin: formu doldurun, arayın ya da WhatsApp'tan yazın. Aktürk Enerji Teknolojileri, Keçiören/Ankara.",
  path: "/iletisim",
  keywords: ["Aktürk Enerji iletişim", "güneş enerjisi teklif", "ücretsiz keşif"],
});

const jsonLd = {
  "@context": "https://schema.org",
  ...breadcrumbJsonLd([
    { name: "Anasayfa", path: "/" },
    { name: "İletişim", path: "/iletisim" },
  ]),
};

export default async function ContactPage() {
  const [site, references] = await Promise.all([getSiteSettings(), getReferences()]);
  const areas = serviceAreas(references);

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
        İletişim
      </p>
      <h1 className="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Ücretsiz keşif için hemen ulaşın
      </h1>
      <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-slate">
        Formu doldurun, size dönüş yapalım — ya da daha hızlı bir yanıt için
        doğrudan WhatsApp&apos;tan yazın.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-4">
          <TrackedContactLink
            method="whatsapp"
            href={whatsappLink(
              site.contact.whatsappNumber,
              `Merhaba, Aktürk Enerji'den güneş enerjisi sistemleri hakkında bilgi almak istiyorum.\n\nSayfa: ${SITE_URL}/iletisim`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-line bg-paper-raised p-5 transition-colors hover:border-[#25D366]/60"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366]">
              <MessageCircle size={20} fill="currentColor" className="text-[#25D366]" />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-ink">WhatsApp&apos;tan Yazın</p>
              <p className="text-[13px] text-slate">En hızlı dönüş yolu</p>
            </div>
          </TrackedContactLink>

          <TrackedContactLink
            method="call"
            href={site.contact.phoneHref}
            className="flex items-center gap-3 rounded-2xl border border-line bg-paper-raised p-5 transition-colors hover:border-brand/60"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Phone size={19} />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-ink">{site.contact.phoneDisplay}</p>
              <p className="text-[13px] text-slate">Telefonla arayın</p>
            </div>
          </TrackedContactLink>

          <a
            href={`mailto:${site.contact.email}`}
            className="flex items-center gap-3 rounded-2xl border border-line bg-paper-raised p-5 transition-colors hover:border-brand/60"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Mail size={19} />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-ink">{site.contact.email}</p>
              <p className="text-[13px] text-slate">E-posta gönderin</p>
            </div>
          </a>

          <a
            href={
              site.contact.mapsEmbedUrl ||
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.contact.addressLine)}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-line bg-paper-raised p-5 transition-colors hover:border-brand/60"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <MapPin size={19} />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-ink">{site.contact.addressLine}</p>
              <p className="flex items-center gap-1 text-[13px] text-slate">
                <Navigation size={12} /> Yol tarifi al
              </p>
            </div>
          </a>

          <div className="flex items-center gap-3 rounded-2xl border border-line bg-paper-raised p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Clock size={19} />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-ink">{site.contact.workingHours}</p>
              <p className="text-[13px] text-slate">Çalışma saatleri</p>
            </div>
          </div>
        </div>

        <LeadForm />
      </div>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold tracking-tight">Hizmet verdiğimiz bölgeler</h2>
        <p className="mt-2 max-w-3xl text-[14.5px] leading-relaxed text-slate">
          Keçiören&apos;deki ofisimizden Ankara&apos;nın tüm ilçelerine keşif ve kurulum yapıyoruz; daha
          büyük projelerde Türkiye geneline çalışıyoruz. Aşağıdaki bölgelerde tamamlanmış projelerimiz var:
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {areas.districts.map(([name, count]) => (
            <span key={name} className="rounded-full border border-line bg-paper-raised px-3 py-1 text-[13px] text-ink">
              {name}, Ankara <span className="text-slate-soft">· {count} proje</span>
            </span>
          ))}
          {areas.cities.map(([name, count]) => (
            <span key={name} className="rounded-full border border-line bg-paper-raised px-3 py-1 text-[13px] text-ink">
              {name} <span className="text-slate-soft">· {count} proje</span>
            </span>
          ))}
        </div>
        <Link href="/referanslarimiz" className="mt-3 inline-block text-[14px] font-semibold text-brand hover:underline">
          Tüm projelerimizi inceleyin →
        </Link>
      </section>

      <div className="mt-10">
        <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
          Havale / EFT
        </p>
        <h2 className="mt-1.5 font-display text-xl font-semibold tracking-tight">
          Banka Hesap Bilgilerimiz
        </h2>
        <p className="mt-2 max-w-2xl text-[14px] text-slate">
          {COMPANY_TITLE} Ödemeleriniz için
          yalnızca aşağıdaki resmi hesaplarımızı kullanınız.
        </p>

        <div className="mt-5">
          <BankAccounts />
        </div>
      </div>
    </div>
  );
}
