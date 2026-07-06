import type { Metadata } from "next";
import { MapPin, Mail, Phone, Clock, MessageCircle } from "lucide-react";
import { site, whatsappLink } from "@/lib/site-config";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "İletişim",
  description:
    "Ücretsiz keşif talebi için formu doldurun ya da doğrudan WhatsApp'tan yazın. Aktürk Enerji Teknolojileri, Ankara.",
  alternates: { canonical: "/iletisim" },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
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
          <a
            href={whatsappLink("Merhaba, Aktürk Enerji'den güneş enerjisi sistemleri hakkında bilgi almak istiyorum.")}
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
          </a>

          <a
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
          </a>

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

          <div className="flex items-center gap-3 rounded-2xl border border-line bg-paper-raised p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <MapPin size={19} />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-ink">{site.contact.addressLine}</p>
              <p className="text-[13px] text-slate">{site.city}, {site.country}</p>
            </div>
          </div>

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

        <ContactForm />
      </div>
    </div>
  );
}
