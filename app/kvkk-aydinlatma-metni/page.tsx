import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "KVKK Aydınlatma Metni",
    description:
      "Aktürk Enerji web sitesindeki formlar, WhatsApp ve telefon üzerinden iletilen kişisel verilerin hangi amaçla işlendiğine dair 6698 sayılı KVKK kapsamında aydınlatma metni.",
    path: "/kvkk-aydinlatma-metni",
  }),
  robots: { index: false, follow: true },
};

export default async function KvkkPage() {
  const site = await getSiteSettings();

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Yasal</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Kişisel Verilerin Korunması Aydınlatma Metni
      </h1>

      <div className="prose prose-slate mt-8 max-w-none text-[15px] leading-relaxed">
        <p>
          Akturk Yenilenebilir Enerji Teknolojileri San. Tic. Ltd. Şti. (&ldquo;Aktürk Enerji&rdquo;)
          olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) kapsamında veri
          sorumlusu sıfatıyla kişisel verilerinizi aşağıda açıklanan şekilde işliyoruz.
        </p>

        <h2>İşlenen kişisel veriler</h2>
        <ul>
          <li>
            <strong>Kimlik ve iletişim:</strong> ad soyad, telefon numarası, e-posta adresi.
          </li>
          <li>
            <strong>Talep bilgileri:</strong> ihtiyaç türü, bölge, aylık fatura aralığı ve formda
            ilettiğiniz diğer açıklamalar.
          </li>
          <li>
            <strong>İş başvurusu:</strong> özgeçmiş ve başvuru formunda paylaştığınız bilgiler.
          </li>
          <li>
            <strong>İşlem güvenliği ve pazarlama:</strong> siteye hangi sayfa ve reklamdan
            geldiğiniz (kaynak/kampanya bilgisi), IP adresi, tarayıcı bilgisi ve çerezler aracılığıyla
            toplanan site kullanım verileri.
          </li>
        </ul>

        <h2>İşleme amaçları ve hukuki sebepler</h2>
        <ul>
          <li>
            Teklif ve keşif talebinize dönüş yapmak, size özel sistem ve fiyat teklifi hazırlamak —
            bir sözleşmenin kurulmasıyla doğrudan ilgili olması (KVKK m. 5/2-c).
          </li>
          <li>
            İş başvurunuzu değerlendirmek — sözleşmenin kurulması (m. 5/2-c) ve meşru menfaat
            (m. 5/2-f).
          </li>
          <li>
            Hangi reklam ve kanalların talep getirdiğini ölçmek, site güvenliğini sağlamak — meşru
            menfaat (m. 5/2-f).
          </li>
          <li>
            Zorunlu olmayan analiz ve reklam çerezleri — açık rızanız (m. 5/1).
          </li>
          <li>Yasal yükümlülüklerin yerine getirilmesi (m. 5/2-ç).</li>
        </ul>

        <h2>Toplama yöntemi</h2>
        <p>
          Kişisel verileriniz; web sitesindeki teklif ve başvuru formları, WhatsApp, telefon ve
          e-posta aracılığıyla, kısmen veya tamamen otomatik yollarla toplanır.
        </p>

        <h2>Aktarım</h2>
        <p>
          Verileriniz yalnızca yukarıdaki amaçlarla sınırlı olarak; hizmet aldığımız barındırma,
          veritabanı ve e-posta altyapısı sağlayıcılarına, site analizi ve reklam ölçümü için
          kullandığımız hizmet sağlayıcılara (Google, Meta, Microsoft) ve talep hâlinde yetkili kamu
          kurumlarına aktarılabilir. Bu sağlayıcıların sunucularının bir kısmı yurt dışında
          bulunduğundan aktarım, KVKK m. 9&apos;da öngörülen şartlara uygun olarak yapılır.
        </p>

        <h2>Haklarınız</h2>
        <p>
          KVKK m. 11 uyarınca kişisel verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme,
          düzeltilmesini veya silinmesini isteme, aktarıldığı üçüncü kişileri öğrenme, işlemenin
          sonuçlarına itiraz etme ve zarara uğramanız hâlinde tazminat talep etme haklarına
          sahipsiniz.
        </p>
        <p>
          Başvurularınızı <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a> adresine
          e-posta ile veya {site.contact.addressLine} adresine yazılı olarak iletebilirsiniz.
          Talebiniz en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.
        </p>
      </div>
    </div>
  );
}
