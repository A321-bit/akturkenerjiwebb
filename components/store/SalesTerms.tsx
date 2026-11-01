import Link from "next/link";
import type { SiteSettings } from "@/lib/data";
import { LEGAL_NAME, companyRegistry } from "@/lib/company";

// Ön bilgilendirme formu ve mesafeli satış sözleşmesinin ortak bölümleri.
export function SellerInfo({ site }: { site: SiteSettings }) {
  return (
    <ul>
      <li><strong>Unvan:</strong> {LEGAL_NAME}</li>
      <li><strong>Adres:</strong> {site.contact.addressLine}</li>
      <li><strong>Telefon:</strong> <a href={site.contact.phoneHref}>{site.contact.phoneDisplay}</a></li>
      <li><strong>E-posta:</strong> <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a></li>
      {companyRegistry.map((x) => <li key={x.label}><strong>{x.label}:</strong> {x.value}</li>)}
    </ul>
  );
}

export function WithdrawalTerms({ site }: { site: SiteSettings }) {
  return (
    <>
      <p>
        Tüketici, malı teslim aldığı tarihten itibaren <strong>14 gün</strong> içinde hiçbir gerekçe göstermeden ve cezai şart
        ödemeden sözleşmeden cayabilir. Birden çok ürünün ayrı ayrı teslim edildiği siparişlerde süre son ürünün teslimiyle başlar.
      </p>
      <ul>
        <li>Cayma bildirimi bu süre içinde <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a> adresine e-postayla ya da WhatsApp&apos;tan yazılı olarak iletilir.</li>
        <li>Tüketici, malı bildirimden itibaren 10 gün içinde geri gönderir.</li>
        <li>
          <strong>İade masrafı tüketiciden alınmaz.</strong> İade için kullanılacak taşıyıcı sipariş onayında ya da cayma bildiriminiz
          üzerine yazılı olarak bildirilir. Bildirilen taşıyıcının bulunduğunuz yerde şubesi yoksa ürünü ek ücret almadan sizden teslim
          alırız. Panel paleti gibi büyük gönderilerde nakliyeyi biz ayarlarız.
        </li>
        <li>Ürün bedeli ve teslimatta ödediğiniz nakliye dahil tüm ödemeler, cayma bildiriminin bize ulaşmasından itibaren 14 gün içinde, ödemede kullanılan yöntemle ve ek masraf olmadan iade edilir.</li>
        <li>Malın işleyişine, teknik özelliklerine ve kullanım talimatlarına uygun kullanımından doğan değişikliklerden tüketici sorumlu değildir. Bunun dışındaki kullanımdan doğan değer kaybı iadeden düşülebilir.</li>
      </ul>
      <p>
        Tüketicinin istekleri veya kişisel ihtiyaçları doğrultusunda özel olarak hazırlanan mallarda ve mevzuatta sayılan diğer
        istisnalarda cayma hakkı kullanılamaz. Bu haklar tüketici işlemleri içindir; ticari veya mesleki amaçla yapılan alımlarda
        6502 sayılı Kanun değil genel hükümler uygulanır.
      </p>
    </>
  );
}

export function DisputeTerms() {
  return (
    <p>
      Şikâyet ve talepleriniz için yukarıdaki iletişim bilgilerinden bize ulaşabilirsiniz. Uyuşmazlıklarda, Ticaret Bakanlığı&apos;nca
      her yıl ilan edilen parasal sınırlar içinde yerleşim yerinizdeki ya da işlemi yaptığınız yerdeki tüketici hakem heyetine, bu
      sınırların üzerinde tüketici mahkemesine başvurabilirsiniz. Tüketici mahkemesinde dava açmadan önce arabulucuya başvurulması
      zorunludur.
    </p>
  );
}

export function OrderLegalNote() {
  return (
    <p className="mt-3 text-center text-[12px] leading-snug text-slate">
      Sipariş vermeden önce{" "}
      <Link href="/magaza/on-bilgilendirme" target="_blank" className="underline hover:text-ink">Ön Bilgilendirme Formu</Link>
      {" ve "}
      <Link href="/magaza/mesafeli-satis-sozlesmesi" target="_blank" className="underline hover:text-ink">Mesafeli Satış Sözleşmesi</Link>
      &apos;ni okuyun.
    </p>
  );
}
