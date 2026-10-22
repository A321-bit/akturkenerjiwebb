import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/data";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

// Mağaza teslimat (kargo/nakliye) ve iade politikası. Google Merchant Center'daki
// gönderim ve iade politikası bu sayfaya bağlanır; buradaki koşullar değişirse
// Merchant Center ayarları da güncellenmeli.
export const metadata: Metadata = buildMetadata({
  title: "Teslimat ve İade Politikası",
  description:
    "Aktürk Enerji Mağaza teslimat, nakliye ücreti, teslim süresi, 14 gün cayma hakkı, iade ve değişim koşulları.",
  path: "/magaza/teslimat-ve-iade",
});

export default async function DeliveryReturnsPage() {
  const site = await getSiteSettings();
  const jsonLd = {
    "@context": "https://schema.org",
    ...breadcrumbJsonLd([
      { name: "Mağaza", path: "/magaza" },
      { name: "Teslimat ve İade", path: "/magaza/teslimat-ve-iade" },
    ]),
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Mağaza</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Teslimat ve İade Politikası</h1>

      <div className="prose prose-slate mt-8 max-w-none text-[15px] leading-relaxed">
        <p>
          Bu sayfa, Akturk Yenilenebilir Enerji Teknolojileri San. Tic. Ltd. Şti. (&ldquo;Aktürk Enerji&rdquo;) mağazasından
          verilen siparişlerin teslimat ve iade koşullarını açıklar. Siparişler WhatsApp ya da telefonla, size yazılı olarak
          iletilen fiyat ve teslimat bilgisini onaylamanızla oluşturulur.
        </p>

        <h2>Teslimat bölgesi</h2>
        <p>Türkiye&apos;nin tüm il ve ilçelerine gönderim yapıyoruz.</p>

        <h2>Nakliye ücreti</h2>
        <ul>
          <li>Ürün fiyatlarına nakliye (kargo) ücreti dahil değildir; nakliye ücreti alıcıya aittir.</li>
          <li>
            Nakliye ücreti; ürünün ağırlığına, hacmine (koli ya da palet) ve teslimat adresine göre hesaplanır ve
            <strong> sipariş onayından önce</strong> size yazılı olarak bildirilir. Onaylamadığınız bir ücret alınmaz.
          </li>
          <li>Güneş panelleri kırılma riskine karşı yalnızca orijinal üretici paletinde, ambar/nakliye firmasıyla gönderilir.</li>
        </ul>

        <h2>Teslim süresi</h2>
        <ul>
          <li>Stokta bulunan ürünler, sipariş onayı ve ödemeden sonra <strong>1–3 iş günü</strong> içinde kargoya/nakliyeye verilir.</li>
          <li>
            Stokta olmayan ya da tedarikçiden gelen ürünlerde tedarik süresi sipariş öncesinde ayrıca bildirilir. Yasal teslim
            süresi her durumda 30 günü geçemez.
          </li>
          <li>Kargoya verilen ürünün taşıma süresi, gönderim yapılan ile ve nakliye firmasına göre değişir.</li>
        </ul>

        <h2>Teslim alırken</h2>
        <p>
          Lütfen paketi, özellikle panel paletlerini, nakliye görevlisinin yanında kontrol edin. Ambalajda ezilme, kırık ya da
          hasar varsa görevliye <strong>hasar tespit tutanağı</strong> tutturun ve fotoğraflayıp bize aynı gün iletin. Tutanak
          tutulmadan teslim alınan hasarlı gönderilerde nakliye firmasına başvuru zorlaşır.
        </p>

        <h2>Cayma hakkı (14 gün)</h2>
        <p>
          6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında, tüketici olarak
          ürünü teslim aldığınız tarihten itibaren <strong>14 gün</strong> içinde hiçbir gerekçe göstermeden cayma hakkınızı
          kullanabilirsiniz.
        </p>
        <ul>
          <li>
            Cayma bildiriminizi bu süre içinde <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a> adresine
            e-postayla ya da WhatsApp&apos;tan yazılı olarak iletmeniz yeterlidir.
          </li>
          <li>Ürünü, bildirimden sonra 10 gün içinde, kullanılmamış ve yeniden satılabilir durumda, aksesuarları ve ambalajıyla birlikte göndermeniz gerekir.</li>
          <li>Ürün bedeli ve varsa teslimatta ödediğiniz nakliye ücreti, cayma bildiriminizin bize ulaşmasından itibaren <strong>14 gün</strong> içinde, ödemede kullandığınız yöntemle iade edilir.</li>
          <li>Ürünün kurulumu yapılmış, kullanılmış ya da olağan kullanım dışında zarar görmüşse, değer kaybı tutarı iadeden düşülebilir.</li>
          <li>Size özel olarak hazırlanan ya da kişiselleştirilen ürün ve projelerde (ör. talebiniz üzerine özel ölçü veya içerikle hazırlanan siparişler) yönetmelik gereği cayma hakkı kullanılamaz.</li>
        </ul>

        <h2>İade nakliye ücreti</h2>
        <ul>
          <li>Cayma hakkıyla yapılan iadelerde iade nakliye ücreti <strong>alıcıya</strong> aittir.</li>
          <li>Ürün <strong>hatalı, kusurlu ya da siparişten farklı</strong> gönderildiyse iade nakliye ücreti <strong>Aktürk Enerji&apos;ye</strong> aittir; ürün değiştirilir ya da bedeli iade edilir.</li>
        </ul>

        <h2>Ayıplı ürün ve garanti</h2>
        <p>
          Ürünlerde ayıp (kusur) olması halinde 6502 sayılı Kanun&apos;daki seçimlik haklarınızı (onarım, değişim, bedel
          indirimi veya sözleşmeden dönme) kullanabilirsiniz. Ürünler ayrıca üretici garantisi kapsamındadır; garanti
          süreleri her ürünün sayfasında yazar. Garanti başvurularında üreticiyle süreci biz yürütürüz.
        </p>

        <h2>İletişim</h2>
        <p>
          Teslimat, iade ve garanti sorularınız için <a href={site.contact.phoneHref}>{site.contact.phoneDisplay}</a>, {" "}
          <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a> ya da{" "}
          <Link href="/magaza/iletisim">mağaza iletişim sayfası</Link>. Adres: {site.contact.addressLine}.
        </p>
      </div>
    </div>
  );
}
