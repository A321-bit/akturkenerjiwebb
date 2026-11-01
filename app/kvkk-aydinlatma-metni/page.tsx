import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_NAME, companyRegistry } from "@/lib/company";
import { getSiteSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "KVKK Aydınlatma Metni",
    description:
      "Aktürk Enerji web sitesindeki formlar, hesaplayıcılar, canlı destek, teklif bağlantıları, WhatsApp ve telefon üzerinden iletilen kişisel verilerin işlenmesine dair 6698 sayılı KVKK kapsamında aydınlatma metni.",
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
      <p className="mt-2 text-[13px] text-slate">Son güncelleme: 1 Kasım 2026</p>

      <div className="prose prose-slate mt-8 max-w-none text-[15px] leading-relaxed">
        <h2>Veri sorumlusu</h2>
        <p>
          {LEGAL_NAME} (&ldquo;Aktürk Enerji&rdquo;) olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;)
          kapsamında veri sorumlusu sıfatıyla kişisel verilerinizi aşağıda açıklanan şekilde işliyoruz. Adres:{" "}
          {site.contact.addressLine}. E-posta: <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>.
          {companyRegistry.map((x) => ` ${x.label}: ${x.value}.`).join("")}
        </p>

        <h2>İşlenen kişisel veriler</h2>
        <ul>
          <li><strong>Kimlik ve iletişim:</strong> ad soyad, telefon numarası, e-posta adresi, adres.</li>
          <li>
            <strong>Talep ve proje bilgileri:</strong> ihtiyaç türü, il ve ilçe, fatura ya da tüketim bilgisi, hesaplayıcıya girdiğiniz
            veriler, çatı konumu ve tasarımı, ada ve parsel, size hazırlanan teklif, görüşme ve sipariş notları.
          </li>
          <li><strong>Canlı destek:</strong> sohbete yazdığınız mesajlar ve paylaştığınız iletişim bilgileri.</li>
          <li><strong>İş başvurusu:</strong> özgeçmiş ve başvuru formunda paylaştığınız bilgiler.</li>
          <li><strong>Yorumlar:</strong> site üzerinden gönderdiğiniz değerlendirme ve yorumlar.</li>
          <li>
            <strong>Site kullanımı ve kaynak:</strong> siteye hangi sayfa ve reklamdan geldiğiniz, görüntülenen sayfalar, IP adresi
            ve tarayıcı bilgisi; onay verirseniz çerezlerle toplanan analiz ve reklam verileri.
          </li>
          <li><strong>Teklif bağlantısı:</strong> size özel teklif bağlantısının açıldığı an.</li>
        </ul>

        <h2>İşleme amaçları ve hukuki sebepler</h2>
        <ul>
          <li>
            Talebinize dönüş yapmak, keşif, fizibilite ve teklif hazırlamak, siparişinizi ve kurulumu yürütmek, müşteri kaydınızı
            tutmak: sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması (KVKK m. 5/2-c).
          </li>
          <li>
            Teklifinizin açıldığını görerek zamanında dönüş yapmak, hizmet kalitesini ve hangi kanalın talep getirdiğini kendi
            kayıtlarımızda ölçmek, site güvenliğini sağlamak, canlı destek sunmak: meşru menfaat (m. 5/2-f).
          </li>
          <li>İş başvurunuzu değerlendirmek: sözleşmenin kurulması (m. 5/2-c) ve meşru menfaat (m. 5/2-f).</li>
          <li>Fatura, garanti, tüketici işlemleri ve diğer yasal yükümlülükler: kanunlarda öngörülmesi ve hukuki yükümlülük (m. 5/2-a, ç).</li>
          <li>
            Analiz ve pazarlama çerezleri, reklam ölçümü ve hedefleme: açık rızanız (m. 5/1). Rızanızı{" "}
            <Link href="/cerez-politikasi">Çerez Politikası</Link> sayfasından istediğiniz an geri alabilirsiniz.
          </li>
        </ul>
        <p>Toplu SMS veya e-posta ile ticari ileti göndermiyoruz; ileride gönderirsek yalnız mevzuata uygun onayınızla göndeririz.</p>

        <h2>Toplama yöntemi</h2>
        <p>
          Kişisel verileriniz; web sitesindeki formlar, hesaplayıcılar ve canlı destek, sosyal medya reklam formları, WhatsApp,
          telefon, e-posta, yüz yüze görüşme ve çerezler aracılığıyla, kısmen veya tamamen otomatik yollarla toplanır.
        </p>

        <h2>Aktarım</h2>
        <p>Verileriniz yalnızca yukarıdaki amaçlarla sınırlı olarak şu alıcılara aktarılabilir:</p>
        <ul>
          <li>Barındırma ve veritabanı: Vercel, Supabase.</li>
          <li>E-posta bildirimleri: Resend.</li>
          <li>Canlı destek yanıtları: Google Gemini. Ad ve telefon bilginiz bu hizmete gönderilmez; yazdığınız mesajlarda kişisel bilgi paylaşmamanızı rica ederiz.</li>
          <li>Onayınızla analiz ve reklam ölçümü: Google, Meta, Microsoft.</li>
          <li>WhatsApp üzerinden yazmanız hâlinde: WhatsApp (Meta).</li>
          <li>Siparişin teslimi ve kurulum için: nakliye firmaları, tedarikçiler ve iş ortakları (yalnız gereken bilgi).</li>
          <li>Talep hâlinde yetkili kamu kurumları.</li>
        </ul>
        <p>Bu sağlayıcıların sunucularının bir kısmı yurt dışındadır; yurt dışına aktarım KVKK m. 9 hükümleri çerçevesinde yürütülür.</p>

        <h2>Saklama süresi</h2>
        <p>
          Verilerinizi işleme amacının gerektirdiği süre ve ilgili mevzuattaki saklama ve zamanaşımı süreleri boyunca saklar, süre
          sonunda siler, yok eder veya anonim hâle getiririz.
        </p>

        <h2>Haklarınız</h2>
        <p>KVKK m. 11 uyarınca;</p>
        <ul>
          <li>kişisel verilerinizin işlenip işlenmediğini öğrenme ve işlenmişse bilgi talep etme,</li>
          <li>işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
          <li>yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
          <li>eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
          <li>KVKK m. 7 şartlarıyla silinmesini veya yok edilmesini isteme,</li>
          <li>düzeltme, silme ve yok etme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme,</li>
          <li>münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonuca itiraz etme,</li>
          <li>kanuna aykırı işleme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
        </ul>
        <p>haklarına sahipsiniz.</p>
        <p>
          Başvurularınızı <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a> adresine e-posta ile veya{" "}
          {site.contact.addressLine} adresine yazılı olarak iletebilirsiniz. Talebiniz en geç 30 gün içinde ücretsiz olarak
          sonuçlandırılır; işlem ayrıca bir maliyet gerektirirse Kurul&apos;un belirlediği tarife uygulanabilir.
        </p>
      </div>
    </div>
  );
}
