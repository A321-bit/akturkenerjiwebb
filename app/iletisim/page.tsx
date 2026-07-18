import type { Metadata } from "next";
import { MapPin, Mail, Phone, Clock, MessageCircle, Navigation } from "lucide-react";
import { getSiteSettings, whatsappLink } from "@/lib/data";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import LeadForm from "@/components/LeadForm";
import TrackedContactLink from "@/components/TrackedContactLink";

export const metadata: Metadata = buildMetadata({
  title: "İletişim",
  description:
    "Ücretsiz keşif talebi için formu doldurun ya da doğrudan WhatsApp'tan yazın. Aktürk Enerji Teknolojileri, Ankara.",
  path: "/iletisim",
  keywords: ["Aktürk Enerji iletişim", "Ankara güneş enerjisi teklif", "Ankara"],
});

const jsonLd = {
  "@context": "https://schema.org",
  ...breadcrumbJsonLd([
    { name: "Anasayfa", path: "/" },
    { name: "İletişim", path: "/iletisim" },
  ]),
};

export default async function ContactPage() {
  const site = await getSiteSettings();

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
              "Merhaba, Aktürk Enerji'den güneş enerjisi sistemleri hakkında bilgi almak istiyorum."
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

      <div className="mt-10">
        <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
          Havale / EFT
        </p>
        <h2 className="mt-1.5 font-display text-xl font-semibold tracking-tight">
          Banka Hesap Bilgilerimiz
        </h2>
        <p className="mt-2 max-w-2xl text-[14px] text-slate">
          Akturk Yenilenebilir Enerji Teknolojileri San. Tic. Ltd. Ödemeleriniz için
          yalnızca aşağıdaki resmi hesaplarımızı kullanınız.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <BankCard
            bankName="VakıfBank"
            branch="1096 - Esertepe / Ankara"
            accounts={[
              { label: "TL", iban: "TR06 0001 5001 5800 7314 9556 86" },
              { label: "USD", iban: "TR18 0001 5001 5804 8020 8240 80" },
              { label: "EURO", iban: "TR55 0001 5001 5804 8020 8240 93" },
            ]}
          />
          <BankCard
            bankName="Türkiye Ziraat Bankası"
            branch="1274 - Esertepe / Ankara"
            accounts={[
              { label: "TL", iban: "TR03 0001 0021 0191 5377 6550 02" },
              { label: "USD", iban: "TR73 0001 0021 0191 5377 6550 03" },
              { label: "EURO", iban: "TR46 0001 0021 0191 5377 6550 04" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function BankCard({
  bankName,
  branch,
  accounts,
}: {
  bankName: string;
  branch: string;
  accounts: { label: string; iban: string }[];
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper-raised p-5">
      <p className="text-[14.5px] font-semibold text-ink">{bankName}</p>
      <p className="text-[12.5px] text-slate-soft">{branch}</p>
      <div className="mt-3 flex flex-col gap-2">
        {accounts.map(({ label, iban }) => (
          <div key={label} className="flex flex-col gap-0.5 rounded-lg bg-ink/[0.03] px-3 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-soft">
              {label}
            </span>
            <span className="font-mono-data text-[13px] tracking-wide text-ink">{iban}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
