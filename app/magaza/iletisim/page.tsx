import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getSiteSettings, whatsappLink, SITE_URL } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import LeadForm from "@/components/LeadForm";
import TrackedContactLink from "@/components/TrackedContactLink";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Mağaza İletişim ve Sipariş",
    description: "Aktürk Enerji Mağaza sipariş ve iletişim: WhatsApp sipariş hattı, telefon, e-posta ve adres.",
    path: "/magaza/iletisim",
  }),
  robots: { index: false, follow: true },
};

export default async function StoreContactPage() {
  const site = await getSiteSettings();
  const card = "flex items-center gap-3 rounded-2xl border border-line bg-paper-raised p-5 transition-colors hover:border-brand/60";
  const icon = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand";

  return (
    <div className="flex flex-col gap-8">
      <section className="max-w-3xl">
        <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">İletişim</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Sipariş ve iletişim</h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-slate">
          Sipariş vermek ya da bir ürün hakkında soru sormak için en hızlı yol WhatsApp sipariş hattımız. Formu
          doldurursanız uzmanımız sizi arar.
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-4">
          <TrackedContactLink
            method="whatsapp"
            href={whatsappLink(
              site.contact.whatsappNumber,
              `Merhaba, Aktürk Enerji Mağaza'dan sipariş vermek istiyorum.\n\nSayfa: ${SITE_URL}/magaza/iletisim`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-[#25D366]/40 bg-paper-raised p-5 transition-colors hover:border-[#25D366]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366]/10">
              <MessageCircle size={20} fill="currentColor" className="text-[#25D366]" />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-ink">WhatsApp Sipariş Hattı</p>
              <p className="text-[13px] text-slate">En hızlı dönüş yolu</p>
            </div>
          </TrackedContactLink>

          <TrackedContactLink method="call" href={site.contact.phoneHref} className={card}>
            <span className={icon}>
              <Phone size={19} />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-ink">{site.contact.phoneDisplay}</p>
              <p className="text-[13px] text-slate">Telefonla arayın</p>
            </div>
          </TrackedContactLink>

          <a href={`mailto:${site.contact.email}`} className={card}>
            <span className={icon}>
              <Mail size={19} />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-ink">{site.contact.email}</p>
              <p className="text-[13px] text-slate">E-posta gönderin</p>
            </div>
          </a>

          <div className={card}>
            <span className={icon}>
              <MapPin size={19} />
            </span>
            <p className="text-[14px] font-semibold text-ink">{site.contact.addressLine}</p>
          </div>

          <div className={card}>
            <span className={icon}>
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
    </div>
  );
}
