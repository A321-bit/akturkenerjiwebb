import type { Metadata } from "next";
import { CheckCircle2, Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getSiteSettings, whatsappLink, SITE_URL } from "@/lib/data";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getStoreSettings } from "@/lib/store-data";
import TrackedContactLink from "@/components/TrackedContactLink";
import StoreFaq from "@/components/store/StoreFaq";
import BankAccounts, { COMPANY_TITLE } from "@/components/BankAccounts";

// Mağaza iletişim: kurumsal iletişim sayfası "ücretsiz keşif" odaklıdır; bu
// sayfa sipariş hattına ve sipariş sürecine odaklanır.
export const metadata: Metadata = {
  ...buildMetadata({
    title: "Sipariş Hattı ve Müşteri Hizmetleri",
    description:
      "Aktürk Enerji Mağaza sipariş hattı: WhatsApp'tan sipariş, siparişte gereken bilgiler, teslimat ve kurulum talebi, sipariş soruları.",
    path: "/magaza/iletisim",
  }),
};

const ORDER_INFO = [
  "Almak istediğiniz paketin adı (ürün sayfasındaki butonla yazarsanız otomatik eklenir)",
  "Teslimat yapılacak il ve ilçe",
  "Kurulum da isteyip istemediğiniz; istiyorsanız kurulum yerinin birkaç fotoğrafı",
  "Fatura bilgisi: şahıs mı, şirket mi",
  "Şebekeli sistemlerde son elektrik faturanızın fotoğrafı (pakete uygunluğu kontrol etmek için)",
];

export default async function StoreContactPage() {
  const [site, store] = await Promise.all([getSiteSettings(), getStoreSettings()]);
  const orderHref = whatsappLink(
    site.contact.whatsappNumber,
    `Merhaba, Aktürk Enerji Mağaza'dan sipariş vermek istiyorum.\n\nSayfa: ${SITE_URL}/magaza/iletisim`
  );
  const small = "flex items-center gap-3 rounded-xl border border-line bg-paper-raised px-4 py-3.5 transition-colors hover:border-brand/60";
  const icon = "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand";
  const orderFaqs = store.faqs.filter((f) => /sipariş|ödeme|kurulum|bölge|teslim|kdv/i.test(f.q));

  return (
    <div className="flex flex-col gap-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            ...breadcrumbJsonLd([
              { name: "Mağaza", path: "/magaza" },
              { name: "İletişim", path: "/magaza/iletisim" },
            ]),
          }),
        }}
      />
      <section className="max-w-3xl">
        <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Sipariş Hattı</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Sipariş hattı ve müşteri hizmetleri</h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-slate">
          Mağazadaki paketlerin siparişini WhatsApp üzerinden alıyoruz. Mesajınızı aldıktan sonra uzmanımız paketin
          ihtiyacınıza uygunluğunu sizinle kontrol eder, fiyatı ve teslimat bilgisini yazılı olarak iletir; onayınızla
          sipariş kesinleşir.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col justify-between gap-6 rounded-2xl bg-ink p-6 text-paper sm:p-8">
          <div>
            <p className="font-display text-[22px] font-semibold leading-tight">WhatsApp Sipariş Hattı</p>
            <p className="mt-2 text-[14.5px] leading-relaxed text-paper/75">
              Paket sayfasındaki &quot;WhatsApp&apos;tan Sipariş&quot; butonu ürün adını ve fiyatını mesaja otomatik ekler. Buradan da
              doğrudan yazabilirsiniz.
            </p>
          </div>
          <TrackedContactLink
            method="whatsapp"
            label="store_whatsapp_contact"
            href={orderHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 text-[16px] font-bold text-white transition-transform hover:scale-[1.02] sm:w-fit sm:px-8"
          >
            <MessageCircle size={19} fill="currentColor" />
            WhatsApp&apos;tan Sipariş Ver
          </TrackedContactLink>
        </div>

        <div className="rounded-2xl border border-line bg-paper-raised p-6 sm:p-7">
          <p className="font-display text-[17px] font-semibold text-ink">Siparişte bize iletmeniz gerekenler</p>
          <ul className="mt-4 flex flex-col gap-3">
            {ORDER_INFO.map((t) => (
              <li key={t} className="flex gap-2.5 text-[14px] leading-relaxed text-slate">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-volt" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section>
        <h2 className="font-display text-lg font-semibold tracking-tight">Diğer iletişim kanalları</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <TrackedContactLink method="call" label="store_call_contact" href={site.contact.phoneHref} className={small}>
            <span className={icon}>
              <Phone size={17} />
            </span>
            <span>
              <span className="block text-[13.5px] font-semibold text-ink">{site.contact.phoneDisplay}</span>
              <span className="block text-[12px] text-slate">Telefon</span>
            </span>
          </TrackedContactLink>
          <a href={`mailto:${site.contact.email}`} className={small}>
            <span className={icon}>
              <Mail size={17} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] font-semibold text-ink">{site.contact.email}</span>
              <span className="block text-[12px] text-slate">E-posta</span>
            </span>
          </a>
          <div className={small}>
            <span className={icon}>
              <Clock size={17} />
            </span>
            <span>
              <span className="block text-[13.5px] font-semibold text-ink">{site.contact.workingHours}</span>
              <span className="block text-[12px] text-slate">Çalışma saatleri</span>
            </span>
          </div>
          <div className={small}>
            <span className={icon}>
              <MapPin size={17} />
            </span>
            <span>
              <span className="block text-[13.5px] font-semibold text-ink">{site.contact.addressLine}</span>
              <span className="block text-[12px] text-slate">Adres</span>
            </span>
          </div>
        </div>
      </section>

      <section>
        <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Havale / EFT</p>
        <h2 className="mt-1.5 font-display text-lg font-semibold tracking-tight">Banka hesap bilgilerimiz</h2>
        <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-slate">
          Alıcı: {COMPANY_TITLE} Ödemenizi siparişiniz yazılı olarak onaylandıktan sonra yapmanızı rica ederiz;
          açıklama kısmına adınızı ve sipariş ettiğiniz paketi yazmanız yeterli. Ödemeleriniz için yalnızca aşağıdaki
          resmi hesaplarımızı kullanınız.
        </p>
        <div className="mt-5">
          <BankAccounts copyable />
        </div>
      </section>

      {orderFaqs.length > 0 && <StoreFaq faqs={orderFaqs} />}
    </div>
  );
}
